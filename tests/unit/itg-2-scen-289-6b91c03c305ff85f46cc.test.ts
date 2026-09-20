import { assessDeliveryRiskAndProposeAdjustments } from '../../src/logic/delivery-risk-assessment';
import * as authValidation from '../../src/logic/authorization-and-validation';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/authorization-and-validation');
jest.mock('../../src/logic/persistence-layer');

describe('SCEN-289: assessDeliveryRiskAndProposeAdjustments - InsufficientDataForRiskCalculationError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InsufficientDataForRiskCalculationError when productivity data is insufficient', async () => {
    const validateInputDataMock = authValidation.validateInputData as jest.Mock;
    const findProductivityDataMock = persistenceLayer.findProductivityDataBySiteAndPeriod as jest.Mock;

    validateInputDataMock.mockResolvedValue(undefined);
    findProductivityDataMock.mockResolvedValue([]);

    const siteIds = ['SITE-001'];
    const deliveryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const currentProgressRateBysite = { 'SITE-001': 45 };
    const evaluationPeriodDays = 30;
    const requestedByUserId = 'USER-12345';

    try {
      await assessDeliveryRiskAndProposeAdjustments({
        siteIds,
        deliveryDate,
        currentProgressRateBysite,
        evaluationPeriodDays,
        requestedByUserId,
      });
      fail('Expected InsufficientDataForRiskCalculationError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('InsufficientDataForRiskCalculationError');
      expect(error.message).toBe('リスク判定に必要な過去実績データが不足しています。');
    }
  });
});