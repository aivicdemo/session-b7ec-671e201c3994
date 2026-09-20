import { calculateRiskScore } from '../../src/logic/validation-common-calculation';

describe('SCEN-458: 遅延日数が負の値の場合、遅延日数の非負制約エラーが発生する', () => {
  it('遅延日数が負の値のとき、InvalidDelayDaysError が発生する', () => {
    const input = {
      progressRate: 75,
      delayDays: -5,
      productivityRate: 10.0,
    };

    expect(() => {
      calculateRiskScore(input);
    }).toThrow();

    try {
      calculateRiskScore(input);
    } catch (error) {
      expect(error).toHaveProperty('message');
      expect((error as Error).message).toBe('遅延日数は0以上の値で指定してください。');
    }
  });
});