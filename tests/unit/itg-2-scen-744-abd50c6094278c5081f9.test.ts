import { calculateNumericMetrics, CalculateNumericMetricsInput, CalculateNumericMetricsOutput } from '../../src/logic/authorization-and-validation';

describe('SCEN-744: calculateNumericMetrics - improvement_rate calculation', () => {
  it('should calculate improvement rate correctly and return rounded value with validity check', async () => {
    // Arrange
    const input: CalculateNumericMetricsInput = {
      metricType: 'improvement_rate',
      baseValue: 100,
      comparisonValue: 150,
      decimalPlaces: 2,
      validationRules: {
        minValue: -100,
        maxValue: 500,
        allowNegative: true,
      },
    };

    // Act
    const result: CalculateNumericMetricsOutput = await calculateNumericMetrics(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.metricType).toBe('improvement_rate');
    expect(result.calculatedValue).toBe(50.0);
    expect(result.roundedValue).toBe(50.0);
    expect(result.isWithinValidRange).toBe(true);
    expect(result.validationMessage).toBe('計算結果は許容範囲内です');
    expect(result.error).toBeNull();
  });
});