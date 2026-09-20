import { calculateRiskScore } from '../../src/logic/validation-common-calculation';

describe('SCEN-461: 重み係数の合計が1.0でないか、個別の重み係数が0～1の範囲外の場合、重み係数設定エラーが発生する', () => {
  it('重み係数合計が1.1の場合、InvalidWeightConfigurationErrorが発生する', () => {
    const input = {
      progressRate: 50,
      delayDays: 10,
      productivityRate: 1.0,
      progressRateWeight: 0.5,
      delayDaysWeight: 0.3,
      productivityRateWeight: 0.3,
    };

    expect(() => calculateRiskScore(input)).toThrow();
    
    try {
      calculateRiskScore(input);
    } catch (error) {
      expect(error).toEqual(
        expect.objectContaining({
          name: expect.stringContaining('InvalidWeightConfiguration'),
          message: expect.stringContaining('重み係数は0～1の範囲で、合計が1.0である必要があります。'),
        })
      );
    }
  });
});