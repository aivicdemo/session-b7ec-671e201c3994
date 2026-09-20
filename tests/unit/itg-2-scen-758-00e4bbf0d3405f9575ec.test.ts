import { calculateNumericMetrics, CalculateNumericMetricsInput, CalculateNumericMetricsOutput } from '../../src/logic/authorization-and-validation';

describe('SCEN-758: calculateNumericMetrics - 計算結果が業務上の許容範囲外のときのエラーハンドリング', () => {
  it('計算結果が許容範囲外のとき、エラーメッセージを返す', async () => {
    const input: CalculateNumericMetricsInput = {
      metricType: 'productivity_rate',
      plannedTime: 100,
      actualTime: 150,
      decimalPlaces: 2,
      validationRules: {
        minValue: 0,
        maxValue: 100,
        allowNegative: false,
      },
    };

    const result: CalculateNumericMetricsOutput = await calculateNumericMetrics(input);

    expect(result.success).toBe(false);
    expect(result.metricType).toBe('productivity_rate');
    expect(result.calculatedValue).toBe(150.0);
    expect(result.roundedValue).toBe(150.00);
    expect(result.isWithinValidRange).toBe(false);
    expect(result.error).toMatch(/計算結果が許容範囲外です|OutOfRangeResultError/);
    expect(result.validationMessage).toBe('計算結果150.00は最大許容値100を超過しています');
  });
});