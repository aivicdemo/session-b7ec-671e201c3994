import { calculateNumericMetrics, CalculateNumericMetricsInput } from '../../src/logic/authorization-and-validation';

describe('SCEN-750: 改善率計算時に基準値が不足しているとき、計算入力値が不正であるというエラーメッセージを返す', () => {
  it('improvement_rate 計算タイプで baseValue が null、comparisonValue が 100 の場合、InvalidInputValuesError エラーを返す', () => {
    const input: CalculateNumericMetricsInput = {
      metricType: 'improvement_rate',
      baseValue: null,
      comparisonValue: 100,
    };

    const result = calculateNumericMetrics(input);

    expect(result.success).toBe(false);
    expect(result.metricType).toBe('improvement_rate');
    expect(result.calculatedValue).toBeNull();
    expect(result.roundedValue).toBeNull();
    expect(result.isWithinValidRange).toBeNull();
    expect(result.validationMessage).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error).toContain('計算入力値が不正です');
    expect(result.error).toContain('baseValue = null');
  });
});