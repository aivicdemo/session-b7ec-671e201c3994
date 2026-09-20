import { calculateNumericMetrics } from '../../src/logic/authorization-and-validation';

describe('SCEN-745: 品質ばらつき計算と妥当性判定', () => {
  it('品質ばらつきを基準値と比較値から正常に計算し、丸め結果と妥当性判定を返す', async () => {
    const input = {
      metricType: 'quality_variance',
      baseValue: 100,
      comparisonValue: 85,
      decimalPlaces: 2,
      validationRules: {
        minValue: -50,
        maxValue: 50,
        allowNegative: true,
      },
    };

    const result = await calculateNumericMetrics(input);

    expect(result.success).toBe(true);
    expect(result.metricType).toBe('quality_variance');
    expect(result.calculatedValue).toBe(-15);
    expect(result.roundedValue).toBe(-15.00);
    expect(result.isWithinValidRange).toBe(true);
    expect(result.validationMessage).toContain('許容範囲内');
    expect(result.error).toBeNull();
  });
});