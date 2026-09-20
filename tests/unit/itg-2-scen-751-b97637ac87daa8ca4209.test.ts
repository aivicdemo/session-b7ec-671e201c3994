import { calculateNumericMetrics } from '../../src/logic/authorization-and-validation';

describe('SCEN-751: 改善率計算時に比較値が不足しているとき、計算入力値が不正であるというエラーメッセージを返す', () => {
  it('should return InvalidInputValuesError when comparisonValue is null for improvement_rate calculation', () => {
    const input = {
      metricType: 'improvement_rate',
      plannedTime: null,
      actualTime: null,
      baseValue: 100,
      comparisonValue: null,
      riskScoreComponents: null,
      proficiencyDataPoints: null,
      decimalPlaces: 2,
      validationRules: null,
    };

    const result = calculateNumericMetrics(input);

    expect(result.success).toBe(false);
    expect(result.metricType).toBe('improvement_rate');
    expect(result.error).toBeDefined();
    expect(result.error).toContain('InvalidInputValuesError');
    expect(result.error).toContain('計算入力値が不正です');
    expect(result.error).toContain('comparisonValue = null');
    expect(result.calculatedValue).toBeNull();
    expect(result.roundedValue).toBeNull();
    expect(result.isWithinValidRange).toBeNull();
  });
});