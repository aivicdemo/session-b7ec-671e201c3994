import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  extractAndRankAllocationPlansForReview,
  ExtractAndRankAllocationPlansForReviewInput,
} from '../../src/logic/allocation-plan-review-approval';

// Mock dependencies
jest.mock('../../src/services/authorization', () => ({
  authorizeOperation: jest.fn(),
}));

jest.mock('../../src/services/validation', () => ({
  validateDateTimeRange: jest.fn(),
}));

jest.mock('../../src/services/allocation-plan', () => ({
  listAllocationPlansByCondition: jest.fn(),
}));

jest.mock('../../src/services/risk-judgment', () => ({
  getRecentDelayRiskJudgmentByFacilityAndTeam: jest.fn(),
}));

jest.mock('../../src/services/productivity', () => ({
  getLatestProductivityDataByWorker: jest.fn(),
}));

jest.mock('../../src/services/audit', () => ({
  recordOperationAudit: jest.fn(),
}));

import * as authService from '../../src/services/authorization';
import * as validationService from '../../src/services/validation';
import * as allocationService from '../../src/services/allocation-plan';
import * as riskService from '../../src/services/risk-judgment';
import * as productivityService from '../../src/services/productivity';
import * as auditService from '../../src/services/audit';

describe('extractAndRankAllocationPlansForReview - Data Retrieval Error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataRetrievalError when productivity data retrieval fails', async () => {
    // Setup: Prepare stubs for successful operations
    (authService.authorizeOperation as jest.Mock).mockResolvedValue(true);
    
    (validationService.validateDateTimeRange as jest.Mock).mockResolvedValue({
      isValid: true,
      start: '2024-01-15T09:00:00Z',
      end: '2024-01-15T18:00:00Z',
    });

    (allocationService.listAllocationPlansByCondition as jest.Mock).mockResolvedValue([
      {
        allocationPlanId: 'plan-001',
        planName: 'Plan A',
        facilityId: 'facility-101',
        teamId: 'team-001',
        workInstructionId: 'work-001',
        allocatedWorkerCount: 5,
        plannedStartDate: '2024-01-15T09:00:00Z',
        plannedEndDate: '2024-01-15T18:00:00Z',
        priority: 'high',
        status: 'pending_review',
      },
    ]);

    (riskService.getRecentDelayRiskJudgmentByFacilityAndTeam as jest.Mock).mockResolvedValue([
      {
        facilityId: 'facility-101',
        teamId: 'team-001',
        riskLevel: 'high',
        predictedDelayDays: 1,
      },
    ]);

    // Setup: Configure getLatestProductivityDataByWorker to fail
    const networkError = new Error('Network timeout');
    (productivityService.getLatestProductivityDataByWorker as jest.Mock).mockRejectedValue(
      networkError
    );

    (auditService.recordOperationAudit as jest.Mock).mockResolvedValue(true);

    // Execute
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'user-center-001',
      targetFacilityIds: ['facility-101', 'facility-102'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T18:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    // Verify exception is thrown
    await expect(extractAndRankAllocationPlansForReview(input)).rejects.toThrow();

    try {
      await extractAndRankAllocationPlansForReview(input);
    } catch (error: unknown) {
      const err = error as any;

      // Verify error type and message
      expect(err.name).toBe('DataRetrievalError');
      expect(err.message).toBe('データ取得に失敗しました。システム管理者に連絡してください。');

      // Verify error contains internal information for traceability
      expect(err.cause).toBeDefined();
      expect(err.originalError).toBeDefined();
      expect(err.originalError.message).toBe('Network timeout');

      // Verify audit was recorded
      expect(auditService.recordOperationAudit).toHaveBeenCalled();
      const auditCall = (auditService.recordOperationAudit as jest.Mock).mock.calls[0][0];
      expect(auditCall.status).toBe('failed');
      expect(auditCall.errorMessage).toContain('データ取得に失敗');
    }
  });

  it('should record operation audit on data retrieval failure', async () => {
    // Setup
    (authService.authorizeOperation as jest.Mock).mockResolvedValue(true);
    (validationService.validateDateTimeRange as jest.Mock).mockResolvedValue({
      isValid: true,
      start: '2024-01-15T09:00:00Z',
      end: '2024-01-15T18:00:00Z',
    });
    (allocationService.listAllocationPlansByCondition as jest.Mock).mockResolvedValue([]);
    (riskService.getRecentDelayRiskJudgmentByFacilityAndTeam as jest.Mock).mockResolvedValue([]);

    const retrievalError = new Error('Database connection failed');
    (productivityService.getLatestProductivityDataByWorker as jest.Mock).mockRejectedValue(
      retrievalError
    );
    (auditService.recordOperationAudit as jest.Mock).mockResolvedValue(true);

    // Execute
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'user-center-001',
      targetFacilityIds: ['facility-101'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T18:00:00Z',
      priorityFilter: 'high',
      maxResultCount: 50,
    };

    await extractAndRankAllocationPlansForReview(input).catch(() => {
      // Expected to fail
    });

    // Verify
    expect(auditService.recordOperationAudit).toHaveBeenCalled();
    const auditCall = (auditService.recordOperationAudit as jest.Mock).mock.calls[0][0];
    expect(auditCall.userId).toBe('user-center-001');
    expect(auditCall.operationType).toBe('extractAndRankAllocationPlansForReview');
    expect(auditCall.status).toBe('failed');
  });
});