import { saveDelayRiskJudgment } from '../../src/logic/data-persistence';

describe('SCEN-974: saveDelayRiskJudgment - 無効な拠点IDまたはチームIDでエラーが発生する', () => {
  it('指定された拠点IDまたはチームIDが存在しないとき、InvalidFacilityOrTeamIdエラーを発生させる', async () => {
    const input = {
      riskJudgmentId: null,
      workInstructionId: 'WI-001',
      facilityId: 'invalid-facility-id',
      teamId: 'invalid-team-id',
      judgmentDateTime: '2025-01-15T10:30:00Z',
      riskLevel: 'HIGH',
      delayPredictionDays: 2,
      progressRate: 45,
      plannedProgressRate: 60,
      judgmentReason: '人員不足',
      recommendedAction: '人員追加',
      createdBy: 'USER-001',
    };

    await expect(saveDelayRiskJudgment(input)).rejects.toMatchObject({
      name: 'InvalidFacilityOrTeamIdError',
      message: "拠点ID 'invalid-facility-id' またはチームID 'invalid-team-id' が見つかりません。",
    });
  });
});