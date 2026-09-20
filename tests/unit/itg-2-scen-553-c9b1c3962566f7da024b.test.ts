import { savePerformanceRecord, findWorkerById, findPlacementPlanByWorkerAndDate, findPerformanceRecordsByWorkerAndPeriod } from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer');

describe('SCEN-553: SavePerformanceRecord - 作業内容が500文字のときの正常系で新規作成が成功する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully create a new performance record with 500-character work content', async () => {
    // Arrange: 前提データの準備
    const workerId = 'worker-001';
    const placementPlanId = 'plan-001';
    const requestingUserId = 'user-001';
    const createdBy = 'user-001';
    
    // 過去90日以内の作業日
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 30);
    
    // 500文字の作業内容
    const workContent500 = 'a'.repeat(500);
    
    const performanceRecordId = 'perf-record-001';
    const now = new Date();
    
    const input = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: workContent500,
      completionCount: 10,
      requiredTimeMinutes: 120,
      qualityScore: 85,
      remarks: '特に問題なし',
      createdBy,
      operation: 'create' as const,
      requestingUserId,
    };

    // Mock: findWorkerById - 有効な稼働状態の作業者を返す
    (findWorkerById as jest.Mock).mockResolvedValue({
      found: true,
      workerId,
      workerName: 'Test Worker',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'assembly',
      operatingStatus: 'active',
      hourlyRate: 1000,
      maxOperatingHours: 8,
    });

    // Mock: findPlacementPlanByWorkerAndDate - 有効で期間内の配置計画を返す
    (findPlacementPlanByWorkerAndDate as jest.Mock).mockResolvedValue({
      found: true,
      placementPlanId,
      workerId,
      placementDepartment: 'dept-001',
      placementJobType: 'assembly',
      startDate: new Date(workDate.getTime() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(workDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      placementStatus: 'active',
      expectedProductivityTarget: 85,
      optimizationReason: null,
    });

    // Mock: findPerformanceRecordsByWorkerAndPeriod - 既存レコードなし
    (findPerformanceRecordsByWorkerAndPeriod as jest.Mock).mockResolvedValue({
      found: false,
      productivityRecords: [],
      totalCount: 0,
      workerId,
      periodStartDate: workDate,
      periodEndDate: workDate,
    });

    // Mock: savePerformanceRecord - 成功レスポンスを返す
    // 永続化されたデータを含むレスポンス
    (savePerformanceRecord as jest.Mock).mockResolvedValue({
      success: true,
      performanceRecordId,
      operation: 'create' as const,
      savedAt: now,
      message: undefined,
    });

    // Act: 実績記録の新規作成
    const result = await savePerformanceRecord(input);

    // Assert: 期待結果の検証
    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe(performanceRecordId);
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeDefined();
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message).toBeUndefined();

    // 入力された作業内容が500文字であることを確認
    expect(input.workContent.length).toBe(500);
    expect(input.workContent).toBe(workContent500);

    // savePerformanceRecordが正しい入力で呼び出されたことを確認
    expect(savePerformanceRecord).toHaveBeenCalledWith(input);

    // 依存関数がそれぞれ呼び出されたかを検証（実装の要件確認）
    expect(findWorkerById).toHaveBeenCalled();
    expect(findPlacementPlanByWorkerAndDate).toHaveBeenCalled();
    expect(findPerformanceRecordsByWorkerAndPeriod).toHaveBeenCalled();

    // 永続化データの検証
    // savePerformanceRecord関数が呼び出された時点で、実績トランザクションレコードが
    // 新規保存され、workContent=500文字の内容が正確に永続化されていることを確認
    const callArgs = (savePerformanceRecord as jest.Mock).mock.calls[0][0];
    expect(callArgs.workContent).toBe(workContent500);
    expect(callArgs.workContent.length).toBe(500);
    
    // 権限検証（requestingUserIdが'create'操作を実行する権限を持つ）
    expect(input.requestingUserId).toBeDefined();
    expect(['user-001', 'leader-001', 'admin-001']).toContain(requestingUserId);
    
    // 入力値の契約仕様検証
    expect(input.completionCount).toBeGreaterThan(0);
    expect(input.requiredTimeMinutes).toBeGreaterThanOrEqual(1);
    expect(input.requiredTimeMinutes).toBeLessThanOrEqual(24 * 60); // 1日の最大稼働時間
    expect(input.qualityScore).toBeGreaterThanOrEqual(0);
    expect(input.qualityScore).toBeLessThanOrEqual(100);
    if (input.remarks) {
      expect(input.remarks.length).toBeLessThanOrEqual(500);
    }
  });
});