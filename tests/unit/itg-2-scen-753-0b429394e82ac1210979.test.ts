import { calculateNumericMetrics } from '../../src/logic/authorization-and-validation';

describe('SCEN-753: 品質ばらつき計算時に比較値が不足しているとき', () => {
  it('comparisonValue が null の場合、計算入力値が不正であるというエラーメッセージを返す', () => {
    const input = {
      metricType: 'quality_variance',
      baseValue: 100,
      comparisonValue: null,
      decimalPlaces: 2,
      validationRules: null,
    };

    const result = calculateNumericMetrics(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('計算入力値が不正です: comparisonValue = null');
    expect(result.metricType).toBe('quality_variance');
    expect(result.calculatedValue).toBeNull();
    expect(result.roundedValue).toBeNull();
    expect(result.isWithinValidRange).toBeNull();
    expect(result.validationMessage).toBeNull();
  });
});