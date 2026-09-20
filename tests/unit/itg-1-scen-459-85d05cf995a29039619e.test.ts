import { calculateRiskScore } from '../../src/logic/validation-common-calculation';

describe('SCEN-459: 生産性率が0以上の数値でない場合、生産性率の非負制約エラーが発生する', () => {
  it('生産性率が負の値の場合、InvalidProductivityRateErrorが発生する', () => {
    const input = {
      progressRate: 50,
      delayDays: 5,
      productivityRate: -0.5,
    };

    expect(() => {
      calculateRiskScore(input);
    }).toThrow();

    expect(() => {
      calculateRiskScore(input);
    }).toThrow(/生産性率は0以上の数値で指定してください/);
  });
});