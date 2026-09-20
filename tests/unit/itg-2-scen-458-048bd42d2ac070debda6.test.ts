import { saveProductivityData } from '../../src/logic/persistence-layer';

describe('SCEN-458: 生産性データ保存時の品質スコア範囲チェック', () => {
  it('品質スコアが0～100の範囲外の場合、InvalidProductivityMetricsErrorが発生する', async () => {
    const input = {
      productivityDataId: 'prod-001',
      performanceRecordId: 'perf-001',
      workerId: 'worker-123',
      siteId: 'site-A',
      teamId: 'team-01',
      workDate: new Date(),
      plannedWorkHours: 480,
      actualWorkHours: 500,
      completionCount: 50,
      productivityRate: 104.17,
      qualityScore: 120,
      errorCount: 0,
      proficiencyLevel: 'INTERMEDIATE',
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    await expect(saveProductivityData(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidProductivityMetricsError',
        message: expect.stringContaining(
          '生産性指標が無効です。生産性率: 104.17%, 品質スコア: 120, 完了件数: 50, 習熟度レベル: INTERMEDIATE'
        ),
      })
    );
  });
});