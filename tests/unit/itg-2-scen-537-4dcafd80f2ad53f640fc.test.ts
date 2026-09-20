import { savePerformanceRecord } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer', () => ({
  ...jest.requireActual('../../src/logic/persistence-layer'),
  authorizeUserAction: jest.fn(),
  validateInputData: jest.fn(),
  findWorkerById: jest.fn(),
  findPlacementPlanByWorkerAndDate: jest.fn(),
  findPerformanceRecordsByWorkerAndPeriod: jest.fn(),
}));

describe('SCEN-537: savePerformanceRecord - InvalidTimeRangeError when requiredTimeMinutes is 0 or less', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (persistenceLayer.authorizeUserAction as jest.Mock).mockResolvedValue({
      authorized: true,
    });

    (persistenceLayer.validateInputData as jest.Mock).mockResolvedValue({
      valid: true,
    });

    (persistenceLayer.findWorkerById as jest.Mock).mockResolvedValue({
      found: true,
      workerId: 'worker-001',
      workerName: 'Test Worker',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'Assembly',
      operatingStatus: 'active',
    });

    (persistenceLayer.findPlacementPlanByWorkerAndDate as jest.Mock).mockResolvedValue({
      found: true,
      placementPlanId: 'placement-001',
      workerId: 'worker-001',
      placementDepartment: 'Assembly Dept',
      placementJobType: 'Assembly',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      placementStatus: 'active',
      expectedProductivityTarget: 100,
    });

    (persistenceLayer.findPerformanceRecordsByWorkerAndPeriod as jest.Mock).mockResolvedValue({
      found: false,
      performanceRecords: [],
      totalCount: 0,
      workerId: 'worker-001',
      periodStartDate: new Date('2024-01-15'),
      periodEndDate: new Date('2024-01-15'),
    });
  });

  it('should throw InvalidTimeRangeError when requiredTimeMinutes is 0', async () => {
    const validInput = {
      performanceRecordId: 'perf-record-001',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate: new Date('2024-01-15'),
      workContent: 'Assembly work',
      completionCount: 10,
      requiredTimeMinutes: 0,
      qualityScore: 85,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    await expect(savePerformanceRecord(validInput)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidTimeRangeError',
        message: '所要時間 0 分は無効です。',
      })
    );
  });

  it('should throw InvalidTimeRangeError when requiredTimeMinutes is negative', async () => {
    const validInput = {
      performanceRecordId: 'perf-record-002',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate: new Date('2024-01-15'),
      workContent: 'Assembly work',
      completionCount: 10,
      requiredTimeMinutes: -5,
      qualityScore: 85,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    await expect(savePerformanceRecord(validInput)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidTimeRangeError',
        message: '所要時間 -5 分は無効です。',
      })
    );
  });
});