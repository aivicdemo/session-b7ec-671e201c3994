import { savePerformanceRecord } from '../../src/logic/persistence-layer';

describe('SCEN-551: 品質スコアが100のときの正常系で新規作成が成功する', () => {
  it('品質スコアが100の場合、savePerformanceRecordで新規作成が成功する', async () => {
    const input = {
      performanceRecordId: '550e8400-e29b-41d4-a716-446655440000',
      workerId: 'W001',
      placementPlanId: 'PP001',
      workDate: new Date('2024-01-15'),
      workContent: 'ピッキング作業',
      completionCount: 150,
      requiredTimeMinutes: 480,
      qualityScore: 100,
      remarks: '完璧な実績',
      createdBy: 'U001',
      requestingUserId: 'U001',
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(Date.now());
    expect(result.savedAt.getTime()).toBeGreaterThan(Date.now() - 5000);
  });
});