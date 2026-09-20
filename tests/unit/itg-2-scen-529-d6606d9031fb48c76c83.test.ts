import { savePerformanceRecord } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-529: 実績記録の新規作成', () => {
  it('代表的な正常入力で新規作成操作が成功し、成功フラグと実績記録IDを返す', async () => {
    const requestingUserId = 'user-manager-001';
    const workerId = 'W001';
    const placementPlanId = 'P001';
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 3);

    // 権限検証スタブ
    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValueOnce(true);

    // 入力値検証スタブ
    jest.spyOn(persistenceLayer, 'validateInputData' as any).mockResolvedValueOnce(true);

    // 作業者存在確認スタブ
    jest.spyOn(persistenceLayer, 'findWorkerById' as any).mockResolvedValueOnce({
      found: true,
      workerId,
      operatingStatus: 'active',
    });

    // 配置計画確認スタブ
    jest.spyOn(persistenceLayer, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValueOnce({
      found: true,
      placementPlanId,
      startDate: new Date(workDate.getTime() - 86400000 * 5),
      endDate: new Date(workDate.getTime() + 86400000 * 5),
    });

    // 重複チェックスタブ
    jest.spyOn(persistenceLayer, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValueOnce({
      found: false,
      performanceRecords: [],
    });

    const input = {
      performanceRecordId: 'perf-' + Date.now(),
      workerId,
      placementPlanId,
      workDate,
      workContent: 'ピッキング作業',
      completionCount: 150,
      requiredTimeMinutes: 480,
      qualityScore: 95,
      remarks: null,
      createdBy: requestingUserId,
      requestingUserId,
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
    expect(result.performanceRecordId).toBeDefined();
    expect(typeof result.performanceRecordId).toBe('string');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message).toBeUndefined();
  });
});