import { getDelayRiskJudgmentById } from '../../src/logic/data-persistence';

describe('SCEN-985: getDelayRiskJudgmentById - 空文字列のリスク判定結果IDで検索', () => {
  it('空文字列のリスク判定結果IDで検索すると、InvalidRiskJudgmentIdエラーが発生する', async () => {
    const input = {
      riskJudgmentId: ''
    };

    await expect(getDelayRiskJudgmentById(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidRiskJudgmentId',
        message: 'リスク判定結果IDは必須です。'
      })
    );
  });
});