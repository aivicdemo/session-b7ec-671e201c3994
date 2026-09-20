import { calculateNumericMetrics, CalculateNumericMetricsOutput } from '../../src/logic/authorization-and-validation';

describe('SCEN-754: リスクスコア計算時にリスクスコア構成要素が不足しているとき、計算入力値が不正であるというエラーメッセージを返す', () => {
  it('riskScoreComponents が null のとき、エラーメッセージを返す', () => {
    const result: CalculateNumericMetricsOutput = calculateNumericMetrics({
      metricType: 'risk_score',
      plannedTime: 480,
      actualTime: 450,
      baseValue: null,
      comparisonValue: null,
      riskScoreComponents: null,
      proficiencyDataPoints: null,
      decimalPlaces: 2,
      validationRules: null,
    });

    expect(result.success).toBe(false);
    expect(result.metricType).toBe('risk_score');
    expect(result.calculatedValue).toBeNull();
    expect(result.roundedValue).toBeNull();
    expect(result.isWithinValidRange).toBeNull();
    expect(result.error).toContain('計算入力値が不正です');
    expect(result.error).toContain('riskScoreComponents');
  });
});