import { saveDelayRiskJudgment, SaveDelayRiskJudgmentInput } from '../../src/logic/data-persistence';

describe('SCEN-978: 計画上の進捗率が0～100の範囲外であるとき、InvalidProgressRateエラーを発生させる', () => {
  it('should throw InvalidProgressRateError when plannedProgressRate is -10', async () => {
    const input: SaveDelayRiskJudgmentInput = {
      riskJudgmentId: null,
      workInstructionId: 'WI-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      judgmentDateTime: '2024-01-15T10:30:00Z',
      riskLevel: 'HIGH',
      delayPredictionDays: 2,
      progressRate: 50,
      plannedProgressRate: -10,
      judgmentReason: '進捗が計画を下回る',
      recommendedAction: '人員追加',
      createdBy: 'USER-001',
    };

    await expect(saveDelayRiskJudgment(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidProgressRateError',
        message: '進捗率は0～100の範囲内である必要があります。',
      })
    );
  });
});