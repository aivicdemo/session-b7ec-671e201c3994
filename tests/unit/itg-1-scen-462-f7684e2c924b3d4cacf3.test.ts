import { calculateRiskScore } from '../../src/logic/validation-common-calculation';

describe('SCEN-462: 遅延日数が最大閾値以上の場合、リスクスコアが100に近づく', () => {
  it('should return risk score close to 100 when delayDays equals maxDelayDaysThreshold', () => {
    // Arrange
    const input = {
      progressRate: 50,
      delayDays: 30,
      productivityRate: 0.8,
      plannedProductivityRate: 1.0,
      progressRateWeight: 0.3,
      delayDaysWeight: 0.4,
      productivityRateWeight: 0.3,
      maxDelayDaysThreshold: 30,
      decimalPlaces: 2,
    };

    // Act
    const result = calculateRiskScore(input);

    // Assert
    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(95);
    expect(result).toBeLessThanOrEqual(100);
    // Verify decimal places
    const decimalPlaces = (result.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });

  it('should apply delayDaysWeight correctly when delayDays reaches maxDelayDaysThreshold', () => {
    // Arrange
    const input = {
      progressRate: 50,
      delayDays: 30,
      productivityRate: 0.8,
      plannedProductivityRate: 1.0,
      progressRateWeight: 0.3,
      delayDaysWeight: 0.4,
      productivityRateWeight: 0.3,
      maxDelayDaysThreshold: 30,
      decimalPlaces: 2,
    };

    // Act
    const result = calculateRiskScore(input);

    // Assert
    // When delayDays equals maxDelayDaysThreshold, the delay component should be maximized
    // This should significantly increase the overall score given the 0.4 weight
    expect(result).toBeGreaterThan(90);
  });

  it('should format output with specified decimal places', () => {
    // Arrange
    const input = {
      progressRate: 50,
      delayDays: 30,
      productivityRate: 0.8,
      plannedProductivityRate: 1.0,
      progressRateWeight: 0.3,
      delayDaysWeight: 0.4,
      productivityRateWeight: 0.3,
      maxDelayDaysThreshold: 30,
      decimalPlaces: 2,
    };

    // Act
    const result = calculateRiskScore(input);

    // Assert
    const resultString = result.toFixed(2);
    expect(resultString).toMatch(/^\d+\.\d{2}$/);
    expect(parseFloat(resultString)).toBe(result);
  });
});