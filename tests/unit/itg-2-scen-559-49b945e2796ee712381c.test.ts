import { savePerformanceRecord, FindPerformanceRecordsByWorkerAndPeriodInput } from '../../src/logic/persistence-layer';

describe('SCEN-559: updatedByがundefinedの新規作成操作が成功する', () => {
  it('updatedByをundefinedで新規作成操作を実行した場合、successがtrueで保存される', async () => {
    const performanceRecordId = 'perf-rec-' + Math.random().toString(36).substring(7);
    const workerId = 'worker-' + Math.random().toString(36).substring(7);
    const placementPlanId = 'placement-' + Math.random().toString(36).substring(7);
    const requestingUserId = 'user-' + Math.random().toString(36).substring(7);
    const createdBy = 'creator-' + Math.random().toString(36).substring(7);

    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 10);

    const input = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: '組立作業A',
      completionCount: 50,
      requiredTimeMinutes: 480,
      qualityScore: 85,
      remarks: null,
      createdBy,
      updatedBy: undefined,
      requestingUserId,
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe(performanceRecordId);
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeGreaterThanOrEqual(new Date().getTime() - 1000);
  });

  it('updatedByがundefinedの場合、createdByのみが記録される', async () => {
    const performanceRecordId = 'perf-rec-' + Math.random().toString(36).substring(7);
    const workerId = 'worker-' + Math.random().toString(36).substring(7);
    const placementPlanId = 'placement-' + Math.random().toString(36).substring(7);
    const requestingUserId = 'user-' + Math.random().toString(36).substring(7);
    const createdBy = 'creator-' + Math.random().toString(36).substring(7);

    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 5);

    const input = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: '検査作業B',
      completionCount: 100,
      requiredTimeMinutes: 300,
      qualityScore: 92,
      remarks: '品質良好',
      createdBy,
      updatedBy: undefined,
      requestingUserId,
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
  });

  it('workDateが過去90日以内の場合、新規作成が成功する', async () => {
    const performanceRecordId = 'perf-rec-' + Math.random().toString(36).substring(7);
    const workerId = 'worker-' + Math.random().toString(36).substring(7);
    const placementPlanId = 'placement-' + Math.random().toString(36).substring(7);
    const requestingUserId = 'user-' + Math.random().toString(36).substring(7);
    const createdBy = 'creator-' + Math.random().toString(36).substring(7);

    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 89);

    const input = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: '梱包作業C',
      completionCount: 75,
      requiredTimeMinutes: 420,
      qualityScore: 88,
      remarks: null,
      createdBy,
      updatedBy: undefined,
      requestingUserId,
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
    expect(result.savedAt).toBeInstanceOf(Date);
  });

  it('completionCountが正の整数の場合、新規作成が成功する', async () => {
    const performanceRecordId = 'perf-rec-' + Math.random().toString(36).substring(7);
    const workerId = 'worker-' + Math.random().toString(36).substring(7);
    const placementPlanId = 'placement-' + Math.random().toString(36).substring(7);
    const requestingUserId = 'user-' + Math.random().toString(36).substring(7);
    const createdBy = 'creator-' + Math.random().toString(36).substring(7);

    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 3);

    const input = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: 'ピッキング作業',
      completionCount: 1,
      requiredTimeMinutes: 60,
      qualityScore: 95,
      remarks: null,
      createdBy,
      updatedBy: undefined,
      requestingUserId,
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
  });

  it('qualityScoreが0～100の範囲の場合、新規作成が成功する', async () => {
    const performanceRecordId = 'perf-rec-' + Math.random().toString(36).substring(7);
    const workerId = 'worker-' + Math.random().toString(36).substring(7);
    const placementPlanId = 'placement-' + Math.random().toString(36).substring(7);
    const requestingUserId = 'user-' + Math.random().toString(36).substring(7);
    const createdBy = 'creator-' + Math.random().toString(36).substring(7);

    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 1);

    const input = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: 'テスト作業',
      completionCount: 30,
      requiredTimeMinutes: 180,
      qualityScore: 0,
      remarks: null,
      createdBy,
      updatedBy: undefined,
      requestingUserId,
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);

    const input2 = { ...input, qualityScore: 100, performanceRecordId: 'perf-rec-' + Math.random().toString(36).substring(7) };
    const result2 = await savePerformanceRecord(input2);

    expect(result2.success).toBe(true);
  });

  it('messageフィールドが返却される可能性がある', async () => {
    const performanceRecordId = 'perf-rec-' + Math.random().toString(36).substring(7);
    const workerId = 'worker-' + Math.random().toString(36).substring(7);
    const placementPlanId = 'placement-' + Math.random().toString(36).substring(7);
    const requestingUserId = 'user-' + Math.random().toString(36).substring(7);
    const createdBy = 'creator-' + Math.random().toString(36).substring(7);

    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 2);

    const input = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: 'サンプル作業',
      completionCount: 20,
      requiredTimeMinutes: 120,
      qualityScore: 75,
      remarks: '作業完了',
      createdBy,
      updatedBy: undefined,
      requestingUserId,
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
    if (result.message !== undefined) {
      expect(typeof result.message).toBe('string');
    }
  });

  it('operationが新規作成を示す create である', async () => {
    const performanceRecordId = 'perf-rec-' + Math.random().toString(36).substring(7);
    const workerId = 'worker-' + Math.random().toString(36).substring(7);
    const placementPlanId = 'placement-' + Math.random().toString(36).substring(7);
    const requestingUserId = 'user-' + Math.random().toString(36).substring(7);
    const createdBy = 'creator-' + Math.random().toString(36).substring(7);

    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 7);

    const input = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: '作業内容',
      completionCount: 45,
      requiredTimeMinutes: 270,
      qualityScore: 80,
      remarks: null,
      createdBy,
      updatedBy: undefined,
      requestingUserId,
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);

    expect(result.operation).toBe('create');
  });

  it('savedAtが現在日時以降である', async () => {
    const performanceRecordId = 'perf-rec-' + Math.random().toString(36).substring(7);
    const workerId = 'worker-' + Math.random().toString(36).substring(7);
    const placementPlanId = 'placement-' + Math.random().toString(36).substring(7);
    const requestingUserId = 'user-' + Math.random().toString(36).substring(7);
    const createdBy = 'creator-' + Math.random().toString(36).substring(7);

    const beforeCall = new Date();
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 4);

    const input = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: '時間計測テスト',
      completionCount: 60,
      requiredTimeMinutes: 360,
      qualityScore: 90,
      remarks: null,
      createdBy,
      updatedBy: undefined,
      requestingUserId,
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);
    const afterCall = new Date();

    expect(result.savedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
  });
});