import { assessDeliveryRiskAndProposeAdjustments } from '../../src/logic/delivery-risk-assessment';
import * as deliveryRiskModule from '../../src/logic/delivery-risk-assessment';

describe('SCEN-288: 指定拠点の進捗データが存在しない場合、進捗データ欠落エラーが発生する', () => {
  let validateInputDataSpy: jest.SpyInstance;
  let calculateDateTimeValuesSpy: jest.SpyInstance;
  let findProductivityDataBySiteAndPeriodSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // validateInputData をスタブ化
    validateInputDataSpy = jest.spyOn(deliveryRiskModule, 'validateInputData' as any).mockReturnValue(undefined);

    // calculateDateTimeValues をスタブ化
    calculateDateTimeValuesSpy = jest.spyOn(deliveryRiskModule, 'calculateDateTimeValues' as any).mockReturnValue({
      remainingHours: 24,
      remainingMinutes: 1440
    });

    // findProductivityDataBySiteAndPeriod をスタブ化
    findProductivityDataBySiteAndPeriodSpy = jest.spyOn(deliveryRiskModule, 'findProductivityDataBySiteAndPeriod' as any).mockImplementation((siteId: string) => {
      if (siteId === 'site-001') {
        return [
          {
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            completionRate: 70,
            workforceCount: 10
          }
        ];
      }
      // site-002 の場合は null を返す
      return null;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw MissingRequiredSiteDataError when site progress data is missing', async () => {
    // テストデータを準備
    const siteIds = ['site-001', 'site-002'];
    const deliveryDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後
    const requestedByUserId = 'user-123';
    const evaluationPeriodDays = 30;

    // site-002 の進捗率を意図的に除外
    const currentProgressRateBysite = {
      'site-001': 75
    };

    // エラーが発生することを期待
    await expect(
      assessDeliveryRiskAndProposeAdjustments({
        siteIds,
        deliveryDate,
        currentProgressRateBysite,
        evaluationPeriodDays,
        requestedByUserId
      })
    ).rejects.toThrow('指定された拠点の進捗データが見つかりません。');
  });

  it('should throw error with correct name MissingRequiredSiteDataError', async () => {
    const siteIds = ['site-001', 'site-002'];
    const deliveryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const requestedByUserId = 'user-123';
    const evaluationPeriodDays = 30;

    const currentProgressRateBysite = {
      'site-001': 75
    };

    try {
      await assessDeliveryRiskAndProposeAdjustments({
        siteIds,
        deliveryDate,
        currentProgressRateBysite,
        evaluationPeriodDays,
        requestedByUserId
      });
      fail('Expected error to be thrown');
    } catch (error: unknown) {
      expect(error).toBeDefined();
      if (error instanceof Error) {
        expect(error.name).toBe('MissingRequiredSiteDataError');
        expect(error.message).toBe('指定された拠点の進捗データが見つかりません。');
      }
    }
  });

  it('should not return output fields when error occurs', async () => {
    const siteIds = ['site-001', 'site-002'];
    const deliveryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const requestedByUserId = 'user-123';
    const evaluationPeriodDays = 30;

    const currentProgressRateBysite = {
      'site-001': 75
    };

    let result: any = undefined;
    let errorOccurred = false;

    try {
      result = await assessDeliveryRiskAndProposeAdjustments({
        siteIds,
        deliveryDate,
        currentProgressRateBysite,
        evaluationPeriodDays,
        requestedByUserId
      });
    } catch (error) {
      errorOccurred = true;
    }

    expect(errorOccurred).toBe(true);
    expect(result).toBeUndefined();
  });
});