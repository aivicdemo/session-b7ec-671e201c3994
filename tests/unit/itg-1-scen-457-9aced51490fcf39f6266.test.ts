import { calculateRiskScore } from '../../src/logic/validation-common-calculation';

describe('SCEN-457: calculateRiskScore with invalid progressRate', () => {
  test('should throw InvalidProgressRateError when progressRate is 101', async () => {
    const input = {
      progressRate: 101,
      delayDays: 5,
      productivityRate: 1.2,
    };

    let errorThrown: Error | null = null;

    try {
      await calculateRiskScore(input);
    } catch (error) {
      errorThrown = error as Error;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown?.constructor.name).toBe('InvalidProgressRateError');
    expect(errorThrown?.message).toBe('進捗率は0～100の範囲で指定してください。');
  });

  test('should throw InvalidProgressRateError when progressRate is -1', async () => {
    const input = {
      progressRate: -1,
      delayDays: 5,
      productivityRate: 1.2,
    };

    let errorThrown: Error | null = null;

    try {
      await calculateRiskScore(input);
    } catch (error) {
      errorThrown = error as Error;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown?.constructor.name).toBe('InvalidProgressRateError');
    expect(errorThrown?.message).toBe('進捗率は0～100の範囲で指定してください。');
  });

  test('should not throw error when progressRate is 0', async () => {
    const input = {
      progressRate: 0,
      delayDays: 5,
      productivityRate: 1.2,
    };

    let errorThrown: Error | null = null;

    try {
      await calculateRiskScore(input);
    } catch (error) {
      errorThrown = error as Error;
    }

    expect(errorThrown).toBeNull();
  });

  test('should not throw error when progressRate is 100', async () => {
    const input = {
      progressRate: 100,
      delayDays: 5,
      productivityRate: 1.2,
    };

    let errorThrown: Error | null = null;

    try {
      await calculateRiskScore(input);
    } catch (error) {
      errorThrown = error as Error;
    }

    expect(errorThrown).toBeNull();
  });
});