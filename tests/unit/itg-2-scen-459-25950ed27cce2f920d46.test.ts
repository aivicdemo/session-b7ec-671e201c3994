import { saveProductivityData } from '../../src/logic/persistence-layer';

describe('SCEN-459: 完了件数が負数の場合、InvalidProductivityMetricsErrorが発生する', () => {
  it('完了件数が負数の場合にInvalidProductivityMetricsErrorが発生する', async () => {
    const input = {
      productivityDataId: 'prod-001',
      performanceRecordId: 'perf-001',
      workerId: 'worker-001',
      siteId: 'site-001',
      teamId: 'team-001',
      workDate: new Date(new Date().getTime() - 86400000),
      plannedWorkHours: 480,
      actualWorkHours: 500,
      completionCount: -5,
      productivityRate: 104.17,
      qualityScore: 95,
      errorCount: 1,
      proficiencyLevel: 'INTERMEDIATE',
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    await expect(saveProductivityData(input)).rejects.toThrow();
    await expect(saveProductivityData(input)).rejects.toMatchObject({
      name: 'InvalidProductivityMetricsError',
      message: expect.stringMatching(
        /生産性指標が無効です。生産性率: 104\.17%, 品質スコア: 95, 完了件数: -5, 習熟度レベル: INTERMEDIATE/
      ),
    });
  });
});