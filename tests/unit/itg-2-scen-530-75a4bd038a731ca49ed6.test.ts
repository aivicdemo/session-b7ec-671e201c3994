import { savePerformanceRecord } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer');

describe('SCEN-530: 作業実績を新規保存または更新し、実績トランザクションレコードを永続化する', () => {
  let findWorkerByIdMock: jest.Mock;
  let findPlacementPlanByWorkerAndDateMock: jest.Mock;
  let findPerformanceRecordsByWorkerAndPeriodMock: jest.Mock;
  let authorizeUserActionMock: jest.Mock;
  let validateInputDataMock: jest.Mock;
  let savedPerformanceRecord: any;

  beforeEach(() => {
    findWorkerByIdMock = jest.fn().mockResolvedValue({
      found: true,
      workerId: 'worker-001',
      workerName: '山田太郎',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'picking',
      operatingStatus: 'active',
      hourlyRate: 1200,
      maxOperatingHours: 8,
    });

    findPlacementPlanByWorkerAndDateMock = jest.fn().mockResolvedValue({
      found: true,
      placementPlanId: 'plan-001',
      workerId: 'worker-001',
      placementDepartment: 'warehouse',
      placementJobType: 'picking',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      placementStatus: 'active',
      expectedProductivityTarget: 85,
      optimizationReason: 'Standard placement',
    });

    const workDate = new Date();
    workDate.setHours(0, 0, 0, 0);

    findPerformanceRecordsByWorkerAndPeriodMock = jest.fn().mockResolvedValue({
      found: false,
      totalCount: 0,
      performanceRecords: [],
      workerId: 'worker-001',
      periodStartDate: workDate,
      periodEndDate: workDate,
    });

    authorizeUserActionMock = jest.fn().mockResolvedValue(true);

    validateInputDataMock = jest.fn().mockResolvedValue(true);

    savedPerformanceRecord = null;

    (persistenceLayer.findWorkerById as jest.Mock) = findWorkerByIdMock;
    (persistenceLayer.findPlacementPlanByWorkerAndDate as jest.Mock) =
      findPlacementPlanByWorkerAndDateMock;
    (persistenceLayer.findPerformanceRecordsByWorkerAndPeriod as jest.Mock) =
      findPerformanceRecordsByWorkerAndPeriodMock;
    (persistenceLayer.authorizeUserAction as jest.Mock) = authorizeUserActionMock;
    (persistenceLayer.validateInputData as jest.Mock) = validateInputDataMock;
    (persistenceLayer.savePerformanceRecord as jest.Mock) = jest
      .fn()
      .mockImplementation(async (input: any) => {
        savedPerformanceRecord = {
          performanceRecordId: input.performanceRecordId,
          workerId: input.workerId,
          placementPlanId: input.placementPlanId,
          workDate: input.workDate,
          workContent: input.workContent,
          completionCount: input.completionCount,
          requiredTimeMinutes: input.requiredTimeMinutes,
          qualityScore: input.qualityScore,
          remarks: input.remarks,
        };
        return {
          success: true,
          performanceRecordId: input.performanceRecordId,
          operation: input.operation,
          savedAt: new Date(),
          message: '作業実績を保存しました',
        };
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('代表的な正常入力で更新操作が成功し、成功フラグと実績記録IDを返す', async () => {
    const performanceRecordId = 'uuid-12345';
    const workerId = 'worker-001';
    const placementPlanId = 'plan-001';
    const workDate = new Date();
    workDate.setHours(0, 0, 0, 0);

    const input = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: '部品Aの仕分け作業',
      completionCount: 150,
      requiredTimeMinutes: 480,
      qualityScore: 95,
      remarks: '特に大型部品の処理が円滑だった',
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);

    expect(findWorkerByIdMock).toHaveBeenCalledWith({
      userId: workerId,
      requestingUserId: 'user-001',
    });

    expect(findPlacementPlanByWorkerAndDateMock).toHaveBeenCalledWith({
      workerId,
      targetDate: workDate,
      requestingUserId: 'user-001',
    });

    expect(findPerformanceRecordsByWorkerAndPeriodMock).toHaveBeenCalledWith({
      workerId,
      startDate: workDate,
      endDate: workDate,
      requestingUserId: 'user-001',
    });

    expect(authorizeUserActionMock).toHaveBeenCalledWith({
      requestingUserId: 'user-001',
      workerId,
    });

    expect(validateInputDataMock).toHaveBeenCalled();

    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe(performanceRecordId);
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);

    const timeDifference = Math.abs(
      result.savedAt.getTime() - new Date().getTime()
    );
    expect(timeDifference).toBeLessThanOrEqual(5000);

    expect(savedPerformanceRecord).not.toBeNull();
    expect(savedPerformanceRecord.performanceRecordId).toBe(performanceRecordId);
    expect(savedPerformanceRecord.workerId).toBe(workerId);
    expect(savedPerformanceRecord.placementPlanId).toBe(placementPlanId);
    expect(savedPerformanceRecord.completionCount).toBe(150);
    expect(savedPerformanceRecord.requiredTimeMinutes).toBe(480);
    expect(savedPerformanceRecord.qualityScore).toBe(95);
    expect(savedPerformanceRecord.workContent).toBe('部品Aの仕分け作業');
    expect(savedPerformanceRecord.remarks).toBe('特に大型部品の処理が円滑だった');

    expect(persistenceLayer.savePerformanceRecord).toHaveBeenCalledWith(input);
  });
});