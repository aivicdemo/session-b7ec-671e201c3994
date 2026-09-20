import { savePerformanceRecord } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

// Mock the internal functions
jest.mock('../../src/logic/persistence-layer', () => {
  const actual = jest.requireActual('../../src/logic/persistence-layer');
  return {
    ...actual,
    authorizeUserAction: jest.fn(),
    validateInputData: jest.fn(),
    findWorkerById: jest.fn(),
    findPlacementPlanByWorkerAndDate: jest.fn(),
    findPerformanceRecordsByWorkerAndPeriod: jest.fn(),
  };
});

describe('savePerformanceRecord - SCEN-557', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully create a new performance record when workDate is today', async () => {
    // Arrange
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const requestingUserId = 'user-123';
    const workerId = 'worker-456';
    const placementPlanId = 'plan-789';
    const performanceRecordId = 'perf-' + Date.now();

    // Setup stubs for authorizeUserAction - verify requestingUserId has permission
    (persistenceLayer.authorizeUserAction as jest.Mock).mockResolvedValue({
      authorized: true,
      userRole: 'worker', // worker or fieldLeader
    });

    // Setup stubs for validateInputData - verify all business rules
    (persistenceLayer.validateInputData as jest.Mock).mockResolvedValue({
      valid: true,
      errors: [],
    });

    // Setup stubs for findWorkerById - worker exists and is active
    (persistenceLayer.findWorkerById as jest.Mock).mockResolvedValue({
      workerId,
      workerName: 'テスト作業者',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'assembly',
      operatingStatus: 'active',
      hourlyRate: 1200,
      maxOperatingHours: 8,
      found: true,
    });

    // Setup stubs for findPlacementPlanByWorkerAndDate - placement exists and workDate is within valid period
    (persistenceLayer.findPlacementPlanByWorkerAndDate as jest.Mock).mockResolvedValue({
      placementPlanId,
      workerId,
      placementDepartment: 'assembly-dept',
      placementJobType: 'assembly-type',
      startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      placementStatus: 'active',
      expectedProductivityTarget: 100,
      optimizationReason: null,
      found: true,
    });

    // Setup stubs for findPerformanceRecordsByWorkerAndPeriod - no duplicate records exist
    (persistenceLayer.findPerformanceRecordsByWorkerAndPeriod as jest.Mock).mockResolvedValue({
      performanceRecords: [],
      totalCount: 0,
      found: false,
      workerId,
      periodStartDate: today,
      periodEndDate: today,
    });

    const input = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate: today,
      workContent: 'テスト作業内容',
      completionCount: 10,
      requiredTimeMinutes: 120,
      qualityScore: 85,
      remarks: null,
      createdBy: requestingUserId,
      updatedBy: undefined,
      requestingUserId,
      operation: 'create' as const,
    };

    // Act
    const result = await savePerformanceRecord(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
    expect(result.performanceRecordId).toBe(performanceRecordId);
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.toDateString()).toBe(today.toDateString());
    expect(result.message === undefined || typeof result.message === 'string').toBe(true);

    // Verify stubs were called appropriately
    expect(persistenceLayer.authorizeUserAction).toHaveBeenCalled();
    expect(persistenceLayer.validateInputData).toHaveBeenCalledWith(
      expect.objectContaining({
        workContent: 'テスト作業内容',
        completionCount: 10,
        requiredTimeMinutes: 120,
        qualityScore: 85,
      })
    );
    expect(persistenceLayer.findWorkerById).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId,
      })
    );
    expect(persistenceLayer.findPlacementPlanByWorkerAndDate).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId,
        targetDate: today,
      })
    );
    expect(persistenceLayer.findPerformanceRecordsByWorkerAndPeriod).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId,
        startDate: today,
        endDate: today,
      })
    );
  });
});