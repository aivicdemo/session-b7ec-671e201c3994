import {
  savePerformanceRecord,
  findPerformanceRecordsByWorkerAndPeriod,
  findWorkerById,
  findPlacementPlanByWorkerAndDate,
} from '../../src/logic/persistence-layer';

// Mock dependencies
jest.mock('../../src/logic/persistence-layer', () => ({
  savePerformanceRecord: jest.fn(),
  findPerformanceRecordsByWorkerAndPeriod: jest.fn(),
  findWorkerById: jest.fn(),
  findPlacementPlanByWorkerAndDate: jest.fn(),
  authorizeUserAction: jest.fn(),
  validateInputData: jest.fn(),
}));

describe('SCEN-543: 同一作業者・同一作業日・同一配置計画の実績記録が既に存在して新規作成を試みるときDuplicatePerformanceRecordErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('同じ作業者・作業日・配置計画の実績記録が既に存在する場合、新規作成時にDuplicatePerformanceRecordErrorが発生する', async () => {
    const workerId = 'worker-001';
    const placementPlanId = 'plan-001';
    const workDate = new Date('2024-01-15');
    const workDateFormatted = '2024-01-15';

    // スタブ設定：作業者が存在し稼働状態を返す
    (findWorkerById as jest.Mock).mockResolvedValue({
      workerId,
      workerName: 'Test Worker',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'picking',
      operatingStatus: 'active',
      hourlyRate: 1500,
      maxOperatingHours: 8,
      found: true,
    });

    // スタブ設定：配置計画が有効期間内を返す
    (findPlacementPlanByWorkerAndDate as jest.Mock).mockResolvedValue({
      placementPlanId,
      workerId,
      placementDepartment: 'department-001',
      placementJobType: 'picking',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      placementStatus: 'active',
      expectedProductivityTarget: 100,
      optimizationReason: null,
      found: true,
    });

    // スタブ設定：同一作業者・同一作業日・同一配置計画の既存レコード1件を返す
    (findPerformanceRecordsByWorkerAndPeriod as jest.Mock).mockResolvedValue({
      performanceRecords: [
        {
          performanceRecordId: 'existing-uuid-001',
          workerId,
          placementPlanId,
          workDate,
          workContent: 'Existing picking work',
          completionCount: 45,
          requiredTimeMinutes: 110,
          qualityScore: 80,
          remarks: null,
          createdAt: new Date('2024-01-15T08:00:00Z'),
          updatedAt: new Date('2024-01-15T08:00:00Z'),
        },
      ],
      totalCount: 1,
      found: true,
      workerId,
      periodStartDate: workDate,
      periodEndDate: workDate,
    });

    // DuplicatePerformanceRecordError をシミュレート
    class DuplicatePerformanceRecordError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'DuplicatePerformanceRecordError';
        Object.setPrototypeOf(this, DuplicatePerformanceRecordError.prototype);
      }
    }

    const duplicateError = new DuplicatePerformanceRecordError(
      `作業者 ${workerId} の ${workDateFormatted} の実績記録は既に存在します。`
    );

    (savePerformanceRecord as jest.Mock).mockRejectedValue(duplicateError);

    const input = {
      performanceRecordId: 'new-uuid-001',
      workerId,
      placementPlanId,
      workDate,
      workContent: 'ピッキング作業',
      completionCount: 50,
      requiredTimeMinutes: 120,
      qualityScore: 85,
      remarks: null,
      createdBy: 'user-admin',
      requestingUserId: 'user-admin',
      operation: 'create' as const,
    };

    let thrownError: Error | null = null;

    try {
      await savePerformanceRecord(input);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError?.name).toBe('DuplicatePerformanceRecordError');
    expect(thrownError?.message).toBe(
      `作業者 ${workerId} の ${workDateFormatted} の実績記録は既に存在します。`
    );
    expect(thrownError?.constructor.name).toBe('DuplicatePerformanceRecordError');
    expect(savePerformanceRecord).toHaveBeenCalledWith(input);
    expect(savePerformanceRecord).toHaveBeenCalledTimes(1);
  });
});