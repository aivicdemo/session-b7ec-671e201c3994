import { judgePersonnelReallocationFeasibility } from '../../src/logic/personnel-reallocation-judgment';

describe('SCEN-275: 融通元候補拠点が存在しないときの例外処理', () => {
  test('融通元候補拠点が空配列の場合、NoReallocatablePersonnelError例外が発生する', async () => {
    const input = {
      delayRiskContext: {
        affectedSiteId: 'site-001',
        delayRiskScore: 75,
        detectedAt: '2024-01-15T10:00:00Z',
        requiredAdjustments: ['人員追加'],
      },
      targetWorkTypeIds: ['work-type-A'],
      requiredPersonnelCount: 5,
      candidateSiteIds: [],
      analysisDate: '2024-01-15',
      lookbackDays: 7,
      skillMatchThreshold: 50,
      workloadThreshold: 85,
    };

    let caughtError: Error | null = null;

    try {
      await judgePersonnelReallocationFeasibility(input);
      fail('例外が発生すべきでした');
    } catch (error: unknown) {
      if (error instanceof Error) {
        caughtError = error;
      } else {
        throw error;
      }
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError!.constructor.name).toBe('NoReallocatablePersonnelError');
    expect(caughtError!.message).toBe(
      '現在、人員融通が可能な拠点がありません。他の対応方法を検討してください。'
    );

    // 出力型のプロパティが存在しないことを確認
    expect(caughtError).not.toHaveProperty('feasibilityJudgment');
    expect(caughtError).not.toHaveProperty('reallocatablePersonnelSummary');
    expect(caughtError).not.toHaveProperty('recommendedPlacementProposals');
  });
});