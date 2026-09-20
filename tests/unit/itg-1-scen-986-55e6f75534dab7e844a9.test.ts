import { getDelayRiskJudgmentById } from '../../src/logic/data-persistence';

describe('SCEN-986: getDelayRiskJudgmentById with null riskJudgmentId', () => {
  it('should throw InvalidRiskJudgmentId error when riskJudgmentId is null', async () => {
    const input = {
      riskJudgmentId: null as any,
    };

    await expect(getDelayRiskJudgmentById(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidRiskJudgmentId',
        message: 'リスク判定結果IDは必須です。',
      })
    );
  });
});