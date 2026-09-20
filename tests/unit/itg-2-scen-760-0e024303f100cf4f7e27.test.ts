import { calculateNumericMetrics } from '../../src/logic/authorization-and-validation';

describe('calculateNumericMetrics - Default decimal places handling', () => {
  it('should apply default decimal places (2) when decimalPlaces is null and return expected values', async () => {
    const input = {
      metricType: 'productivity_rate',
      plannedTime: 100,
      actualTime: 85,
      baseValue: null,
      comparisonValue: null,
      riskScoreComponents: null,
      proficiencyDataPoints: null,
      decimalPlaces: null,
      validationRules: null,
    };

    const result = await calculateNumericMetrics(input);

    expect(result.success).toBe(true);
    expect(result.metricType).toBe('productivity_rate');
    
    // 生産性率の計算：実績時間 / 計画時間 = 85 / 100 = 0.85
    expect(result.calculatedValue).toBe(0.85);
    
    // 小数点以下2桁に丸めた結果の検証
    expect(result.roundedValue).toBe(0.85);
    
    // 妥当性判定の検証
    expect(result.isWithinValidRange).toBe(true);
    expect(result.validationMessage).toBeNull();
    expect(result.error).toBeNull();
  });

  it('should round to default decimal places (2) when decimalPlaces is null', async () => {
    const input = {
      metricType: 'productivity_rate',
      plannedTime: 100,
      actualTime: 85,
      baseValue: null,
      comparisonValue: null,
      riskScoreComponents: null,
      proficiencyDataPoints: null,
      decimalPlaces: null,
      validationRules: null,
    };

    const result = await calculateNumericMetrics(input);

    // decimalPlacesがnullの場合、デフォルト値2が適用されて丸め処理が実行される
    expect(result.success).toBe(true);
    expect(result.calculatedValue).toBe(0.85);
    expect(result.roundedValue).toBe(0.85);
    expect(result.isWithinValidRange).toBe(true);
    expect(result.validationMessage).toBeNull();
    expect(result.error).toBeNull();
  });

  it('should verify default decimal places handling for productivity_rate calculation', async () => {
    const input = {
      metricType: 'productivity_rate',
      plannedTime: 100,
      actualTime: 85,
      baseValue: null,
      comparisonValue: null,
      riskScoreComponents: null,
      proficiencyDataPoints: null,
      decimalPlaces: null,
      validationRules: null,
    };

    const result = await calculateNumericMetrics(input);

    // 計算値が0.85（生産性率85/100）であること
    expect(result.calculatedValue).toBe(0.85);
    
    // 丸めた値が0.85（小数点以下2桁で丸めた結果）であること
    expect(result.roundedValue).toBe(0.85);
    
    // 結果の正常性を検証
    expect(result.success).toBe(true);
    expect(result.isWithinValidRange).toBe(true);
    expect(result.validationMessage).toBeNull();
    expect(result.error).toBeNull();
  });
});