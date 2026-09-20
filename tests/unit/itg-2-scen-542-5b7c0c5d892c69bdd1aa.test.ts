import { savePerformanceRecord } from '../../src/logic/persistence-layer';

describe('SCEN-542: 品質スコアが100を超えるときInvalidQualityScoreErrorが発生する', () => {
  it('should throw InvalidQualityScoreError when qualityScore exceeds 100', async () => {
    const input = {
      performanceRecordId: 'perf-001',
      workerId: 'worker-001',
      placementPlanId: 'plan-001',
      workDate: new Date('2024-01-15'),
      workContent: 'テスト作業',
      completionCount: 10,
      requiredTimeMinutes: 480,
      qualityScore: 101,
      remarks: null,
      createdBy: 'user-001',
      requestingUserId: 'user-001',
      operation: 'create' as const,
      updatedBy: undefined,
    };

    await expect(savePerformanceRecord(input)).rejects.toMatchObject({
      name: 'InvalidQualityScoreError',
      message: '品質スコア 101 は0～100の範囲内である必要があります。',
    });
  });
});