import { calculateRiskScore } from '../../src/logic/validation-common-calculation';

describe('SCEN-463: 進捗率が0の場合、リスクスコアが最大に近づく', () => {
  it('should return risk score between 90 and 100 when progress rate is 0', () => {
    const result = calculateRiskScore({
      progressRate: 0,
      delayDays: 10,
      productivityRate: 1.0,
      plannedProductivityRate: 1.0,
      progressRateWeight: 0.3,
      delayDaysWeight: 0.4,
      productivityRateWeight: 0.3,
      maxDelayDaysThreshold: 30,
      decimalPlaces: 2,
    });

    expect(result).toBeGreaterThanOrEqual(90);
    expect(result).toBeLessThanOrEqual(100);
    expect(result).toHaveLength(
      String(result).split('.').length === 2
        ? String(result).split('.')[1].length <= 2
          ? 1
          : 0
        : 0
    ) || expect(String(result).split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
  });

  it('should have decimal places of 2 or fewer', () => {
    const result = calculateRiskScore({
      progressRate: 0,
      delayDays: 10,
      productivityRate: 1.0,
      plannedProductivityRate: 1.0,
      progressRateWeight: 0.3,
      delayDaysWeight: 0.4,
      productivityRateWeight: 0.3,
      maxDelayDaysThreshold: 30,
      decimalPlaces: 2,
    });

    const resultString = result.toString();
    const decimalPart = resultString.split('.')[1];
    const decimalPlaces = decimalPart ? decimalPart.length : 0;

    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });

  it('should reflect zero progress rate as maximum risk contribution', () => {
    const resultWithZeroProgress = calculateRiskScore({
      progressRate: 0,
      delayDays: 10,
      productivityRate: 1.0,
      plannedProductivityRate: 1.0,
      progressRateWeight: 0.3,
      delayDaysWeight: 0.4,
      productivityRateWeight: 0.3,
      maxDelayDaysThreshold: 30,
      decimalPlaces: 2,
    });

    const resultWithSomeProgress = calculateRiskScore({
      progressRate: 50,
      delayDays: 10,
      productivityRate: 1.0,
      plannedProductivityRate: 1.0,
      progressRateWeight: 0.3,
      delayDaysWeight: 0.4,
      productivityRateWeight: 0.3,
      maxDelayDaysThreshold: 30,
      decimalPlaces: 2,
    });

    expect(resultWithZeroProgress).toBeGreaterThan(resultWithSomeProgress);
  });
});