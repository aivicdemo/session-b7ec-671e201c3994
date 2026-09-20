import { calculateNumericMetrics } from '../../src/logic/authorization-and-validation';

describe('SCEN-747: calculateNumericMetrics - Invalid metric type error', () => {
  it('should return error when metric type is not a defined type', async () => {
    const input = {
      metricType: 'invalid_type',
      plannedTime: 480,
      actualTime: 400,
      baseValue: null,
      comparisonValue: null,
      riskScoreComponents: null,
      proficiencyDataPoints: null,
      decimalPlaces: 2,
      validationRules: null,
    };

    const result = await calculateNumericMetrics(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('計算タイプが不正です: invalid_type');
    expect(result.metricType).toBe('invalid_type');
    expect(result.calculatedValue).toBeNull();
    expect(result.roundedValue).toBeNull();
    expect(result.isWithinValidRange).toBeNull();
    expect(result.validationMessage).toBeNull();
  });
});