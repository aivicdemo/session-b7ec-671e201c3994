import { calculateNumericMetrics } from '../../src/logic/authorization-and-validation';

describe('SCEN-749: calculateNumericMetrics with negative actualTime', () => {
  it('should return error when actualTime is negative', async () => {
    const input = {
      metricType: 'productivity_rate',
      plannedTime: 480,
      actualTime: -60,
      decimalPlaces: 2,
      validationRules: null,
    };

    const result = await calculateNumericMetrics(input);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/計算入力値が不正です.*actualTime = -60/);
    expect(result.metricType).toBe('productivity_rate');
    expect(result.calculatedValue).toBeNull();
    expect(result.roundedValue).toBeNull();
  });
});