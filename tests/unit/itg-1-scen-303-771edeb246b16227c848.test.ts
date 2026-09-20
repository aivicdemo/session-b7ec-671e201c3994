import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';
import * as auditModule from '../../src/infrastructure/audit/operation-audit';

jest.mock('../../src/infrastructure/audit/operation-audit');
jest.mock('../../src/infrastructure/data/authorization-service');
jest.mock('../../src/infrastructure/data/allocation-plan-repository');
jest.mock('../../src/infrastructure/data/delay-risk-repository');
jest.mock('../../src/infrastructure/data/productivity-repository');
jest.mock('../../src/infrastructure/validation/datetime-validator');

describe('SCEN-303: extractAndRankAllocationPlansForReview operation', () => {
  describe('recordOperationAudit invocation', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      const mockRecordOperationAudit = auditModule.recordOperationAudit as jest.MockedFunction<
        typeof auditModule.recordOperationAudit
      >;
      mockRecordOperationAudit.mockResolvedValue(undefined);

      const mockAuthorizeOperation = require('../../src/infrastructure/data/authorization-service')
        .authorizeOperation as jest.MockedFunction<any>;
      mockAuthorizeOperation.mockResolvedValue(true);

      const mockListAllocationPlansByCondition = require('../../src/infrastructure/data/allocation-plan-repository')
        .listAllocationPlansByCondition as jest.MockedFunction<any>;
      mockListAllocationPlansByCondition.mockResolvedValue({
        allocationPlans: [
          {
            allocationPlanId: 'plan-001',
            planName: 'Plan A',
            facilityId: 'FAC-001',
            teamId: 'TEAM-001',
            workInstructionId: 'WI-001',
            allocatedWorkerCount: 5,
            plannedStartDate: '2024-01-15T09:00:00Z',
            plannedEndDate: '2024-01-15T18:00:00Z',
            expectedCompletionDate: '2024-01-15T17:00:00Z',
            currentProgressRate: 75,
            delayRiskLevel: 'medium',
            delayRiskScore: 45,
            predictedDelayDays: 0,
            feasibilityScore: 85,
            averageWorkerProductivityRate: 80,
            recommendationReason: 'Optimal team allocation',
            rankingPriority: 1,
            status: 'pending_review',
          },
        ],
        totalCount: 1,
      });

      const mockGetRecentDelayRiskJudgment = require('../../src/infrastructure/data/delay-risk-repository')
        .getRecentDelayRiskJudgmentByFacilityAndTeam as jest.MockedFunction<any>;
      mockGetRecentDelayRiskJudgment.mockResolvedValue({
        riskLevel: 'medium',
        predictedDelayDays: 0,
      });

      const mockGetLatestProductivityData = require('../../src/infrastructure/data/productivity-repository')
        .getLatestProductivityDataByWorker as jest.MockedFunction<any>;
      mockGetLatestProductivityData.mockResolvedValue({
        productivityRate: 80,
        qualityScore: 85,
      });

      const mockValidateDateTimeRange = require('../../src/infrastructure/validation/datetime-validator')
        .validateDateTimeRange as jest.MockedFunction<any>;
      mockValidateDateTimeRange.mockResolvedValue(true);
    });

    it('should call recordOperationAudit with correct parameters during execution', async () => {
      const input = {
        userId: 'user-001',
        targetFacilityIds: ['FAC-001', 'FAC-002'],
        timeRangeStart: '2024-01-15T09:00:00Z',
        timeRangeEnd: '2024-01-15T18:00:00Z',
        priorityFilter: 'high' as const,
        maxResultCount: 50,
      };

      const result = await extractAndRankAllocationPlansForReview(input);

      expect(result).toHaveProperty('allocationPlans');
      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('analysisCompletedAt');
      expect(result).toHaveProperty('dataFreshness');
      expect(Array.isArray(result.allocationPlans)).toBe(true);
      expect(typeof result.totalCount).toBe('number');
      expect(result.analysisCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      const mockRecordOperationAudit = auditModule.recordOperationAudit as jest.MockedFunction<
        typeof auditModule.recordOperationAudit
      >;

      expect(mockRecordOperationAudit).toHaveBeenCalledTimes(1);

      const callArgs = mockRecordOperationAudit.mock.calls[0][0];

      expect(callArgs).toBeDefined();
      expect(callArgs.userId).toBe('user-001');

      expect(callArgs).toHaveProperty('operationName');
      expect(callArgs.operationName).toBeDefined();
      expect(typeof callArgs.operationName).toBe('string');
      expect(callArgs.operationName.length).toBeGreaterThan(0);

      expect(callArgs).toHaveProperty('executedAt');
      const executedAtValue = callArgs.executedAt;
      expect(typeof executedAtValue).toBe('string');
      expect(executedAtValue).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      expect(callArgs).toHaveProperty('parameters');
      expect(callArgs.parameters).toBeDefined();
      expect(callArgs.parameters.targetFacilityIds).toEqual(['FAC-001', 'FAC-002']);
      expect(callArgs.parameters.timeRangeStart).toBe('2024-01-15T09:00:00Z');
      expect(callArgs.parameters.timeRangeEnd).toBe('2024-01-15T18:00:00Z');
      expect(callArgs.parameters.priorityFilter).toBe('high');

      expect(mockRecordOperationAudit).toHaveReturned();
    });
  });
});