import { calculateNumericMetrics } from '../../src/logic/authorization-and-validation';

describe('SCEN-746: 習熟度レベルを完了件数・エラー件数・単位時間から正常に計算し、丸め結果と妥当性判定を返す', () => {
  it('should calculate proficiency level correctly with proper rounding and validation', () => {
    // Arrange
    const input = {
      metricType: 'proficiency_level',
      proficiencyDataPoints: {
        completedCount: 150,
        errorCount: 5,
        timePerUnit: 2.5,
      },
      decimalPlaces: 2,
      validationRules: {
        minValue: 0,
        maxValue: 100,
        allowNegative: false,
      },
    };

    // Act
    const result = calculateNumericMetrics(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.metricType).toBe('proficiency_level');
    expect(result.calculatedValue).not.toBeNull();
    expect(typeof result.calculatedValue).toBe('number');
    expect(result.roundedValue).not.toBeNull();
    expect(typeof result.roundedValue).toBe('number');
    expect(result.roundedValue).toBe(Math.round(result.calculatedValue! * 100) / 100);
    expect(result.isWithinValidRange).toBe(true);
    expect(result.roundedValue).toBeGreaterThanOrEqual(0);
    expect(result.roundedValue).toBeLessThanOrEqual(100);
    expect(result.validationMessage).toBeTruthy();
    expect(result.error).toBeNull();
  });
});