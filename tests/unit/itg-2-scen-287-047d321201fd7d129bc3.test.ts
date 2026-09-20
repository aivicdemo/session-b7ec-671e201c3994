import {
  assessDeliveryRiskAndProposeAdjustments,
  AssessDeliveryRiskAndProposeAdjustmentsInput,
} from '../../src/logic/delivery-risk-assessment';

describe('SCEN-287: Invalid Progress Rate Error Handling', () => {
  it('should throw InvalidProgressRateError when progress rate is negative', async () => {
    const testDate = new Date();
    const deliveryDate = new Date(testDate.getTime() + 2 * 24 * 60 * 60 * 1000);

    const input: AssessDeliveryRiskAndProposeAdjustmentsInput = {
      siteIds: ['site001', 'site002'],
      deliveryDate,
      currentProgressRateBysite: {
        site001: -5,
        site002: 50,
      },
      evaluationPeriodDays: 30,
      requestedByUserId: 'user123',
    };

    await expect(
      assessDeliveryRiskAndProposeAdjustments(input)
    ).rejects.toMatchObject({
      name: 'InvalidProgressRateError',
      message: expect.stringContaining('進捗率は0～100の範囲で指定してください。'),
    });
  });

  it('should throw InvalidProgressRateError when progress rate exceeds 100', async () => {
    const testDate = new Date();
    const deliveryDate = new Date(testDate.getTime() + 2 * 24 * 60 * 60 * 1000);

    const input: AssessDeliveryRiskAndProposeAdjustmentsInput = {
      siteIds: ['site001', 'site002'],
      deliveryDate,
      currentProgressRateBysite: {
        site001: 105,
        site002: 50,
      },
      evaluationPeriodDays: 30,
      requestedByUserId: 'user123',
    };

    await expect(
      assessDeliveryRiskAndProposeAdjustments(input)
    ).rejects.toMatchObject({
      name: 'InvalidProgressRateError',
      message: expect.stringContaining('進捗率は0～100の範囲で指定してください。'),
    });
  });
});