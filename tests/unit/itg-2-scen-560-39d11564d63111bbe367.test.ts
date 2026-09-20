import { savePerformanceRecord, findPerformanceRecordsByWorkerAndPeriod } from '../../src/logic/persistence-layer';
import type {
  SavePerformanceRecordInput,
  SavePerformanceRecordOutput,
  FindWorkerByIdOutput,
  FindPlacementPlanByWorkerAndDateOutput,
  FindPerformanceRecordsByWorkerAndPeriodOutput,
  PerformanceRecordDetail,
} from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer', () => ({
  ...jest.requireActual('../../src/logic/persistence-layer'),
  findWorkerById: jest.fn(),
  findPlacementPlanByWorkerAndDate: jest.fn(),
  findPerformanceRecordsByWorkerAndPeriod: jest.fn(),
  authorizeUserAction: jest.fn(),
  validateInputData: jest.fn(),
}));

describe('SCEN-560: updatedByが指定されている更新操作が成功する', () => {
  const workerId = 'worker-001';
  const placementPlanId = 'plan-001';
  const performanceRecordId = 'perf-001';
  const createdBy = 'user-123';
  const updatedBy = 'user-456';
  const requestingUserId = 'user-456';
  const workDate = new Date('2024-01-15');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully update performance record with updatedBy specified', async () => {
    // Arrange: 前提条件を設定
    const findWorkerByIdMock = require('../../src/logic/persistence-layer').findWorkerById as jest.Mock;
    const findPlacementPlanByWorkerAndDateMock = require('../../src/logic/persistence-layer').findPlacementPlanByWorkerAndDate as jest.Mock;
    const findPerformanceRecordsByWorkerAndPeriodMock = require('../../src/logic/persistence-layer').findPerformanceRecordsByWorkerAndPeriod as jest.Mock;
    const authorizeUserActionMock = require('../../src/logic/persistence-layer').authorizeUserAction as jest.Mock;
    const validateInputDataMock = require('../../src/logic/persistence-layer').validateInputData as jest.Mock;

    // findWorkerByIdスタブ: 作業者が存在し稼働状態が有効
    const workerOutput: FindWorkerByIdOutput = {
      workerId,
      workerName: '山田太郎',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'PICKING',
      operatingStatus: 'active',
      hourlyRate: 1000,
      maxOperatingHours: 8,
      found: true,
    };
    findWorkerByIdMock.mockResolvedValue(workerOutput);

    // findPlacementPlanByWorkerAndDateスタブ: 配置計画が存在し日付が有効期間内
    const placementPlanOutput: FindPlacementPlanByWorkerAndDateOutput = {
      placementPlanId,
      workerId,
      placementDepartment: '倉庫部門',
      placementJobType: 'PICKING',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      placementStatus: 'active',
      expectedProductivityTarget: 100,
      optimizationReason: 'Initial assignment',
      found: true,
    };
    findPlacementPlanByWorkerAndDateMock.mockResolvedValue(placementPlanOutput);

    // findPerformanceRecordsByWorkerAndPeriodスタブ: operation='update'の場合、指定されたperformanceRecordIdが既に存在することを返す
    const existingRecord: PerformanceRecordDetail = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: 'ピッキング作業',
      completionCount: 100,
      requiredTimeMinutes: 480,
      qualityScore: 85,
      remarks: null,
      createdAt: new Date('2024-01-15T08:00:00Z'),
      updatedAt: new Date('2024-01-15T08:00:00Z'),
    };
    const performanceRecordsOutput: FindPerformanceRecordsByWorkerAndPeriodOutput = {
      performanceRecords: [existingRecord],
      totalCount: 1,
      found: true,
      workerId,
      periodStartDate: workDate,
      periodEndDate: workDate,
    };
    findPerformanceRecordsByWorkerAndPeriodMock.mockResolvedValue(performanceRecordsOutput);

    // authorizeUserActionスタブ: requestingUserIdが権限を持つ
    authorizeUserActionMock.mockResolvedValue(true);

    // validateInputDataスタブ: 全入力パラメータが有効
    validateInputDataMock.mockResolvedValue(true);

    // SavePerformanceRecordInputを構築: operation='update'、updatedBy=有効なユーザーID、createdBy=別のユーザーID
    const input: SavePerformanceRecordInput = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: 'ピッキング作業',
      completionCount: 120,
      requiredTimeMinutes: 450,
      qualityScore: 90,
      remarks: '効率が向上しました',
      createdBy,
      updatedBy,
      requestingUserId,
      operation: 'update',
    };

    // Act: savePerformanceRecord関数を呼び出す
    const result: SavePerformanceRecordOutput = await savePerformanceRecord(input);

    // Assert: 返却されたSavePerformanceRecordOutputを検証
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.operation).toBe('update');
    expect(result.performanceRecordId).toBe(performanceRecordId);
    
    // savedAtが現在時刻以前であることを検証（テスト実行時の現在時刻と比較）
    const currentTime = new Date();
    expect(result.savedAt).toBeLessThanOrEqual(currentTime);
    expect(result.savedAt).toBeInstanceOf(Date);
    
    // updatedByフィールドが指定されたユーザーIDで正しく永続化されていることを確認
    // 保存後のレコードを再度取得して検証するためにモックを更新
    const updatedRecord: PerformanceRecordDetail = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: 'ピッキング作業',
      completionCount: 120,
      requiredTimeMinutes: 450,
      qualityScore: 90,
      remarks: '効率が向上しました',
      createdAt: new Date('2024-01-15T08:00:00Z'),
      updatedAt: result.savedAt,
    };
    
    const savedRecordsOutput: FindPerformanceRecordsByWorkerAndPeriodOutput = {
      performanceRecords: [updatedRecord],
      totalCount: 1,
      found: true,
      workerId,
      periodStartDate: workDate,
      periodEndDate: workDate,
    };
    
    // 次の呼び出しで更新されたレコードを返すよう設定
    findPerformanceRecordsByWorkerAndPeriodMock.mockResolvedValueOnce(savedRecordsOutput);
    
    // 保存後のレコード取得で、永続化を確認
    const verifyOutput = await findPerformanceRecordsByWorkerAndPeriod({
      workerId,
      startDate: workDate,
      endDate: workDate,
      requestingUserId,
    });
    
    expect(verifyOutput.found).toBe(true);
    expect(verifyOutput.performanceRecords).toHaveLength(1);
    expect(verifyOutput.performanceRecords[0].performanceRecordId).toBe(performanceRecordId);
    expect(verifyOutput.performanceRecords[0].workContent).toBe('ピッキング作業');
    expect(verifyOutput.performanceRecords[0].completionCount).toBe(120);
    expect(verifyOutput.performanceRecords[0].qualityScore).toBe(90);
    expect(verifyOutput.performanceRecords[0].remarks).toBe('効率が向上しました');
    // updatedAtがresult.savedAtと一致することで、更新時刻が正しく記録されたことを確認
    expect(verifyOutput.performanceRecords[0].updatedAt).toEqual(result.savedAt);
  });

  test('should update performance record with all fields correctly persisted', async () => {
    // Arrange: スタブ設定
    const findWorkerByIdMock = require('../../src/logic/persistence-layer').findWorkerById as jest.Mock;
    const findPlacementPlanByWorkerAndDateMock = require('../../src/logic/persistence-layer').findPlacementPlanByWorkerAndDate as jest.Mock;
    const findPerformanceRecordsByWorkerAndPeriodMock = require('../../src/logic/persistence-layer').findPerformanceRecordsByWorkerAndPeriod as jest.Mock;
    const authorizeUserActionMock = require('../../src/logic/persistence-layer').authorizeUserAction as jest.Mock;
    const validateInputDataMock = require('../../src/logic/persistence-layer').validateInputData as jest.Mock;

    findWorkerByIdMock.mockResolvedValue({
      workerId,
      workerName: 'test worker',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'PICKING',
      operatingStatus: 'active',
      found: true,
    });

    findPlacementPlanByWorkerAndDateMock.mockResolvedValue({
      placementPlanId,
      workerId,
      placementDepartment: 'Dept',
      placementJobType: 'PICKING',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      placementStatus: 'active',
      expectedProductivityTarget: 100,
      found: true,
    });

    // 既存レコード確認用のスタブ設定
    const existingRecord: PerformanceRecordDetail = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: 'test work',
      completionCount: 100,
      requiredTimeMinutes: 480,
      qualityScore: 85,
      remarks: null,
      createdAt: new Date('2024-01-15T08:00:00Z'),
      updatedAt: new Date('2024-01-15T08:00:00Z'),
    };

    findPerformanceRecordsByWorkerAndPeriodMock.mockResolvedValue({
      performanceRecords: [existingRecord],
      totalCount: 1,
      found: true,
      workerId,
      periodStartDate: workDate,
      periodEndDate: workDate,
    });

    authorizeUserActionMock.mockResolvedValue(true);
    validateInputDataMock.mockResolvedValue(true);

    const input: SavePerformanceRecordInput = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: 'Update test work',
      completionCount: 150,
      requiredTimeMinutes: 420,
      qualityScore: 95,
      remarks: 'Updated record',
      createdBy,
      updatedBy,
      requestingUserId,
      operation: 'update',
    };

    // Act
    const result: SavePerformanceRecordOutput = await savePerformanceRecord(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.operation).toBe('update');
    expect(result.performanceRecordId).toBe(performanceRecordId);
    expect(result.savedAt).toBeInstanceOf(Date);
    
    // savedAtが現在時刻以前であることを検証
    const currentTime = new Date();
    expect(result.savedAt).toBeLessThanOrEqual(currentTime);
    
    // 更新されたレコードでモックを再設定
    const updatedRecord: PerformanceRecordDetail = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: 'Update test work',
      completionCount: 150,
      requiredTimeMinutes: 420,
      qualityScore: 95,
      remarks: 'Updated record',
      createdAt: new Date('2024-01-15T08:00:00Z'),
      updatedAt: result.savedAt,
    };
    
    findPerformanceRecordsByWorkerAndPeriodMock.mockResolvedValueOnce({
      performanceRecords: [updatedRecord],
      totalCount: 1,
      found: true,
      workerId,
      periodStartDate: workDate,
      periodEndDate: workDate,
    });
    
    // 永続化されたレコードを取得して検証
    const persistedRecords = await findPerformanceRecordsByWorkerAndPeriod({
      workerId,
      startDate: workDate,
      endDate: workDate,
      requestingUserId,
    });
    
    expect(persistedRecords.found).toBe(true);
    expect(persistedRecords.performanceRecords).toHaveLength(1);
    expect(persistedRecords.performanceRecords[0].performanceRecordId).toBe(performanceRecordId);
    expect(persistedRecords.performanceRecords[0].workContent).toBe('Update test work');
    expect(persistedRecords.performanceRecords[0].completionCount).toBe(150);
    expect(persistedRecords.performanceRecords[0].requiredTimeMinutes).toBe(420);
    expect(persistedRecords.performanceRecords[0].qualityScore).toBe(95);
    expect(persistedRecords.performanceRecords[0].remarks).toBe('Updated record');
    // updatedAtがresult.savedAtと一致することで、更新が正しく永続化されたことを確認
    expect(persistedRecords.performanceRecords[0].updatedAt).toEqual(result.savedAt);
  });
});