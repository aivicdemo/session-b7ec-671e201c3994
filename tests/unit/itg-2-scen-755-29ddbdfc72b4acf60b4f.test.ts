import { calculateNumericMetrics } from '../../src/logic/authorization-and-validation';

describe('SCEN-755: 習熟度レベル計算時に習熟度データポイントが不足しているとき、計算入力値が不正であるというエラーメッセージを返す', () => {
  it('proficiencyDataPoints が null の場合、InvalidInputValuesError を発生させ、エラーメッセージを返す', () => {
    const input = {
      metricType: 'proficiency_level',
      proficiencyDataPoints: null,
      decimalPlaces: 2,
      validationRules: null,
    };

    const result = calculateNumericMetrics(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('計算入力値が不正です: proficiencyDataPoints = null');
    expect(result.metricType).toBe('proficiency_level');
    expect(result.calculatedValue).toBeNull();
    expect(result.roundedValue).toBeNull();
    expect(result.isWithinValidRange).toBeNull();
    expect(result.validationMessage).toBeNull();
  });
});