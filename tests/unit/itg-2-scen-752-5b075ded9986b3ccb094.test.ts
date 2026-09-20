import { calculateNumericMetrics } from '../../src/logic/authorization-and-validation';

describe('SCEN-752: 品質ばらつき計算時に基準値が不足しているとき、計算入力値が不正であるというエラーメッセージを返す', () => {
  it('baseValue が null の場合、エラーメッセージを返す', () => {
    const result = calculateNumericMetrics({
      metricType: 'quality_variance',
      plannedTime: null,
      actualTime: null,
      baseValue: null,
      comparisonValue: 15.5,
      riskScoreComponents: null,
      proficiencyDataPoints: null,
      decimalPlaces: 2,
      validationRules: null,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('計算入力値が不正です');
    expect(result.error).toContain('baseValue = null');
    expect(result.metricType).toBe('quality_variance');
    expect(result.calculatedValue).toBeNull();
    expect(result.roundedValue).toBeNull();
    expect(result.isWithinValidRange).toBeNull();
    expect(result.validationMessage).toBeNull();
  });
});