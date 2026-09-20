import { calculateNumericMetrics } from '../../src/logic/authorization-and-validation';

describe('SCEN-761: 妥当性判定ルールが指定されたとき、ルール内容に従い計算結果が許容範囲内か判定する', () => {
  it('妥当性判定ルール内の計算結果を返す', async () => {
    const result = await calculateNumericMetrics({
      metricType: 'productivity_rate',
      plannedTime: 100,
      actualTime: 80,
      decimalPlaces: 2,
      validationRules: {
        minValue: 0.5,
        maxValue: 1.5,
        allowNegative: false,
      },
    });

    expect(result.success).toBe(true);
    expect(result.metricType).toBe('productivity_rate');
    expect(result.calculatedValue).toBeCloseTo(0.8, 2);
    expect(result.roundedValue).toBeCloseTo(0.8, 2);
    expect(result.isWithinValidRange).toBe(true);
    expect(result.validationMessage).toContain('許容範囲内');
    expect(result.error).toBeNull();
  });

  it('妥当性判定ルール外の計算結果を返す', async () => {
    const result = await calculateNumericMetrics({
      metricType: 'productivity_rate',
      plannedTime: 100,
      actualTime: 200,
      decimalPlaces: 2,
      validationRules: {
        minValue: 0.5,
        maxValue: 1.5,
        allowNegative: false,
      },
    });

    expect(result.success).toBe(true);
    expect(result.metricType).toBe('productivity_rate');
    expect(result.calculatedValue).toBeCloseTo(2.0, 2);
    expect(result.roundedValue).toBeCloseTo(2.0, 2);
    expect(result.isWithinValidRange).toBe(false);
    expect(result.validationMessage).toContain('許容範囲外');
    expect(result.error).toBeNull();
  });
});