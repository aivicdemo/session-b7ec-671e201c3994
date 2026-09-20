import { savePerformanceRecord } from '../../src/logic/persistence-layer';

describe('SCEN-541: 品質スコアが0未満のときInvalidQualityScoreErrorが発生する', () => {
  it('qualityScoreが-1の場合、InvalidQualityScoreErrorが発生する', async () => {
    const input = {
      performanceRecordId: '550e8400-e29b-41d4-a716-446655440000',
      workerId: 'worker-001',
      placementPlanId: 'plan-001',
      workDate: new Date('2024-01-15'),
      workContent: 'テスト作業',
      completionCount: 10,
      requiredTimeMinutes: 120,
      qualityScore: -1,
      remarks: '品質スコアが負の値',
      createdBy: 'user-001',
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    await expect(savePerformanceRecord(input)).rejects.toMatchObject({
      name: 'InvalidQualityScoreError',
      message: expect.stringContaining('品質スコア -1 は0～100の範囲内である必要があります。'),
    });
  });
});