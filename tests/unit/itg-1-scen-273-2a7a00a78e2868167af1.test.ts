import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

// Mock dependencies
jest.mock('../../src/logic/auth-authorization-audit.ts');
jest.mock('../../src/logic/validation-common-calculation.ts');
jest.mock('../../src/logic/data-persistence.ts');

import * as authModule from '../../src/logic/auth-authorization-audit.ts';
import * as validationModule from '../../src/logic/validation-common-calculation.ts';
import * as persistenceModule from '../../src/logic/data-persistence.ts';

describe('extractAndRankAllocationPlansForReview - Data Retrieval Error Handling', () => {
  const mockUserId = 'user-logistics-center-123';
  const mockFacilityIds = ['facility-001', 'facility-002'];
  const mockTimeRangeStart = '2024-01-15T08:00:00Z';
  const mockTimeRangeEnd = '2024-01-15T17:00:00Z';
  const mockPriorityFilter = 'high';
  const mockMaxResultCount = 50;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return DataRetrievalError when data persistence layer fails', async () => {
    // Setup: Mock authorization success
    (authModule.authorizeOperation as jest.Mock).mockResolvedValue({
      authorized: true,
      userId: mockUserId,
      role: 'logistics_center_manager',
    });

    // Setup: Mock date range validation success
    (validationModule.validateDateTimeRange as jest.Mock).mockResolvedValue({
      valid: true,
      startDate: new Date(mockTimeRangeStart),
      endDate: new Date(mockTimeRangeEnd),
    });

    // Setup: Mock data persistence failure (simulate network error, timeout, or DB connection issue)
    (persistenceModule.listAllocationPlansByCondition as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    // Setup: Mock audit logging
    (authModule.recordOperationAudit as jest.Mock).mockResolvedValue({
      auditId: 'audit-001',
      success: false,
    });

    // Execute
    const input = {
      userId: mockUserId,
      targetFacilityIds: mockFacilityIds,
      timeRangeStart: mockTimeRangeStart,
      timeRangeEnd: mockTimeRangeEnd,
      priorityFilter: mockPriorityFilter,
      maxResultCount: mockMaxResultCount,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    // Verify: Result is an error
    expect(result).toHaveProperty('error');
    expect(result.error).toBeDefined();

    // Verify: Error name is DataRetrievalError
    expect(result.error.name).toBe('DataRetrievalError');

    // Verify: Error message matches expected text
    expect(result.error.message).toBe(
      'データ取得に失敗しました。システム管理者に連絡してください。'
    );

    // Verify: Authorization was called
    expect(authModule.authorizeOperation).toHaveBeenCalledWith(
      mockUserId,
      expect.any(String)
    );

    // Verify: Date range validation was called
    expect(validationModule.validateDateTimeRange).toHaveBeenCalledWith(
      mockTimeRangeStart,
      mockTimeRangeEnd
    );

    // Verify: Data persistence was attempted
    expect(persistenceModule.listAllocationPlansByCondition).toHaveBeenCalled();

    // Verify: Audit logging was called with failure status
    expect(authModule.recordOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUserId,
        operationType: expect.any(String),
        success: false,
        errorMessage: expect.stringContaining('Database connection failed'),
      })
    );
  });

  it('should include original cause context in error handling', async () => {
    // Setup: Mock authorization success
    (authModule.authorizeOperation as jest.Mock).mockResolvedValue({
      authorized: true,
      userId: mockUserId,
      role: 'logistics_center_manager',
    });

    // Setup: Mock date range validation success
    (validationModule.validateDateTimeRange as jest.Mock).mockResolvedValue({
      valid: true,
      startDate: new Date(mockTimeRangeStart),
      endDate: new Date(mockTimeRangeEnd),
    });

    // Setup: Mock data persistence failure with specific error type
    const dbError = new Error('Connection timeout after 30 seconds');
    (persistenceModule.listAllocationPlansByCondition as jest.Mock).mockRejectedValue(
      dbError
    );

    // Setup: Mock audit logging
    (authModule.recordOperationAudit as jest.Mock).mockResolvedValue({
      auditId: 'audit-002',
      success: false,
    });

    // Execute
    const input = {
      userId: mockUserId,
      targetFacilityIds: mockFacilityIds,
      timeRangeStart: mockTimeRangeStart,
      timeRangeEnd: mockTimeRangeEnd,
      priorityFilter: mockPriorityFilter,
      maxResultCount: mockMaxResultCount,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    // Verify: Error details are preserved
    expect(result.error).toBeDefined();
    expect(result.error.name).toBe('DataRetrievalError');
    expect(result.error.message).toBe(
      'データ取得に失敗しました。システム管理者に連絡してください。'
    );

    // Verify: Cause information is included in audit
    expect(authModule.recordOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: expect.stringContaining('Connection timeout'),
      })
    );
  });
});