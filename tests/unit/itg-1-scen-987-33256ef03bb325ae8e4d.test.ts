import { getDelayRiskJudgmentById } from '../../src/logic/data-persistence';

describe('SCEN-987: getDelayRiskJudgmentById - Data not found error', () => {
  it('should throw RiskJudgmentNotFound error when risk judgment ID does not exist in database', async () => {
    const nonexistentRiskId = 'nonexistent-risk-id-12345';
    const input = {
      riskJudgmentId: nonexistentRiskId,
    };

    await expect(getDelayRiskJudgmentById(input)).rejects.toMatchObject({
      name: 'RiskJudgmentNotFound',
      message: `進捗遅延リスク判定結果が見つかりません。リスク判定結果ID: ${nonexistentRiskId}`,
    });
  });
});