import { calculateNumericMetrics } from '../../src/logic/authorization-and-validation';

describe('SCEN-742: calculateNumericMetrics - productivity_rate calculation', () => {
  it('should calculate productivity rate correctly and return rounded value with validity check', () => {
    // Arrange
    const input = {
      metricType: 'productivity_rate',
      plannedTime: 480,
      actualTime: 400,
      baseValue: null,
      comparisonValue: null,
      riskScoreComponents: null,
      proficiencyDataPoints: null,
      decimalPlaces: 2,
      validationRules: {
        minValue: 0,
        maxValue: 500,
        allowNegative: false,
      },
    };

    // Act
    const result = calculateNumericMetrics(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.metricType).toBe('productivity_rate');
    expect(result.calculatedValue).toBe(120.0);
    expect(result.roundedValue).toBe(120.0);
    expect(result.isWithinValidRange).toBe(true);
    expect(result.validationMessage).toBeDefined();
    expect(typeof result.validationMessage).toBe('string');
    expect(result.error).toBeNull();
  });
});