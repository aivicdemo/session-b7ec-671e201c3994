import { assessDeliveryRiskAndProposeAdjustments } from '../../src/logic/delivery-risk-assessment';
import * as deliveryRiskModule from '../../src/logic/delivery-risk-assessment';

describe('SCEN-292: 調整内容の提案生成処理でシステムエラーが発生した場合', () => {
  let generateDeliveryAdjustmentProposalsSpy: jest.SpyInstance;
  let validateInputDataSpy: jest.SpyInstance;
  let calculateDateTimeValuesSpy: jest.SpyInstance;
  let findProductivityDataBySiteAndPeriodSpy: jest.SpyInstance;
  let calculateDeliveryRiskScoreSpy: jest.SpyInstance;
  let identifyAffectedSitesRequiringAdjustmentSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // validateInputData をスタブ化
    validateInputDataSpy = jest.spyOn(deliveryRiskModule, 'validateInputData' as any).mockReturnValue(undefined);

    // calculateDateTimeValues をスタブ化
    calculateDateTimeValuesSpy = jest.spyOn(deliveryRiskModule, 'calculateDateTimeValues' as any).mockReturnValue({
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      currentDate: new Date(),
      remainingHours: 72,
    });

    // findProductivityDataBySiteAndPeriod をスタブ化
    findProductivityDataBySiteAndPeriodSpy = jest.spyOn(deliveryRiskModule, 'findProductivityDataBySiteAndPeriod' as any).mockReturnValue([
      {
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        completionRate: 95,
        workforceCount: 10,
      },
      {
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        completionRate: 92,
        workforceCount: 10,
      },
    ]);

    // calculateDeliveryRiskScore をスタブ化
    calculateDeliveryRiskScoreSpy = jest.spyOn(deliveryRiskModule, 'calculateDeliveryRiskScore' as any).mockReturnValue({
      siteId: 'site-001',
      riskScore: 75,
      riskLevel: 'high',
      remainingHours: 72,
      requiredCompletionRate: 1.8,
      projectedCompletionRate: 1.5,
    });

    // identifyAffectedSitesRequiringAdjustment をスタブ化
    identifyAffectedSitesRequiringAdjustmentSpy = jest.spyOn(deliveryRiskModule, 'identifyAffectedSitesRequiringAdjustment' as any).mockReturnValue({
      affectedSites: [
        {
          siteId: 'site-001',
          riskScore: 75,
          riskLevel: 'high',
          remainingHours: 72,
          requiredCompletionRate: 1.8,
          projectedCompletionRate: 1.5,
        },
      ],
      unaffectedSites: ['site-002'],
    });

    // generateDeliveryAdjustmentProposals をスタブ化してエラーをスロー
    generateDeliveryAdjustmentProposalsSpy = jest.spyOn(deliveryRiskModule, 'generateDeliveryAdjustmentProposals' as any).mockImplementation(() => {
      throw new Error('System error in proposal generation');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should throw AdjustmentProposalGenerationFailureError when generateDeliveryAdjustmentProposals fails', async () => {
    const input = {
      siteIds: ['site-001', 'site-002'],
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      currentProgressRateBysite: {
        'site-001': 45,
        'site-002': 60,
      },
      evaluationPeriodDays: 30,
      requestedByUserId: 'user-123',
    };

    let thrownError: any;
    let result: any;

    try {
      result = await assessDeliveryRiskAndProposeAdjustments(input);
    } catch (error) {
      thrownError = error;
    }

    // AdjustmentProposalGenerationFailureError が発生したことを検証
    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError.name).toBe('AdjustmentProposalGenerationFailureError');
    expect(thrownError.message).toBe('調整内容の提案生成に失敗しました。');

    // 戻り値が返されていないことを検証
    expect(result).toBeUndefined();

    // エラーが発生した場合、出力フィールドが存在しないことを確認
    if (thrownError) {
      expect(thrownError.overallDeliveryRiskLevel).toBeUndefined();
      expect(thrownError.affectedSites).toBeUndefined();
      expect(thrownError.proposedAdjustments).toBeUndefined();
      expect(thrownError.estimatedDeliverySuccessProbability).toBeUndefined();
      expect(thrownError.evaluatedAt).toBeUndefined();
    }
  });
});