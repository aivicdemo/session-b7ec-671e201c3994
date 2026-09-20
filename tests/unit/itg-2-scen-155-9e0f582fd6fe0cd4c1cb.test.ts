import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';
import * as progressMonitoring from '../../src/logic/progress-monitoring';

describe('SCEN-155: 遅延リスクが検知されないとき', () => {
  let calculateDelayRiskScoreStub: jest.Mock;
  let identifyAffectedSitesAndAdjustmentsStub: jest.Mock;
  let aggregateProgressDataBySiteStub: jest.Mock;
  let authorizeUserActionStub: jest.Mock;
  let validateInputDataStub: jest.Mock;
  let sendProgressDelayRiskNotificationStub: jest.Mock;

  beforeEach(() => {
    // calculateDelayRiskScore スタブ: 全拠点に対して 0～59 の範囲でスコアを返す
    calculateDelayRiskScoreStub = jest.fn((input) => {
      return {
        siteId: input.siteId,
        delayRiskScore: 45, // 0～59 の範囲内の値
        riskLevel: 'LOW',
        progressGapPercentage: 3.5,
        requiredDailyProgressRate: 10,
        calculatedAt: new Date().toISOString(),
      };
    });

    // identifyAffectedSitesAndAdjustments スタブ: 入力されたスコアが閾値未満のとき空配列を返す
    identifyAffectedSitesAndAdjustmentsStub = jest.fn((input) => {
      const affectedSites = input.delayRiskScores.filter(
        (score: any) => score.delayRiskScore >= input.delayRiskThreshold
      );
      
      return {
        affectedSites: [],
        recommendedAdjustments: [],
        adjustmentSummary: {
          totalAffectedSites: 0,
          totalRequiredPersonnel: 0,
          adjustmentTypes: [],
          estimatedOverallDeliveryImpact: 0,
          identifiedAt: new Date().toISOString(),
        },
        feasibilityAssessment: {
          isFullyFeasible: true,
          feasibleAdjustmentCount: 0,
          infeasibleAdjustments: [],
          constraintFactors: [],
        },
      };
    });

    // aggregateProgressDataBySite スタブ: 進捗データの集約結果を返す
    aggregateProgressDataBySiteStub = jest.fn((input) => {
      return input.siteIds.map((siteId: string, index: number) => ({
        siteId,
        siteName: `Site ${String.fromCharCode(65 + index)}`,
        currentProgressRate: 45 + index * 2,
        plannedProgressRate: 50,
        remainingDays: 5,
        totalWorkload: 1000,
        currentTeamCapacity: 100,
        affectedTeams: [],
      }));
    });

    authorizeUserActionStub = jest.fn(() => true);

    validateInputDataStub = jest.fn(() => ({
      isValid: true,
      errors: [],
    }));

    // sendProgressDelayRiskNotification スタブ: delayRiskDetected の値に基づいて条件判定
    sendProgressDelayRiskNotificationStub = jest.fn((delayRiskDetected: boolean) => {
      if (!delayRiskDetected) {
        return false; // 遅延リスク未検知のため通知送信スキップ
      }
      return true;
    });

    jest.spyOn(progressMonitoring, 'calculateDelayRiskScore' as any).mockImplementation(calculateDelayRiskScoreStub);
    jest.spyOn(progressMonitoring, 'identifyAffectedSitesAndAdjustments' as any).mockImplementation(identifyAffectedSitesAndAdjustmentsStub);
    jest.spyOn(progressMonitoring, 'aggregateProgressDataBySite' as any).mockImplementation(aggregateProgressDataBySiteStub);
    jest.spyOn(progressMonitoring, 'authorizeUserAction' as any).mockImplementation(authorizeUserActionStub);
    jest.spyOn(progressMonitoring, 'validateInputData' as any).mockImplementation(validateInputDataStub);
    jest.spyOn(progressMonitoring, 'sendProgressDelayRiskNotification' as any).mockImplementation(sendProgressDelayRiskNotificationStub);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('遅延リスクスコアが全て閾値未満の場合、affectedSitesが空配列となり、delayRiskDetectedがfalseになる', () => {
    const input = {
      userId: 'user001',
      siteIds: ['site-A', 'site-B', 'site-C'],
      teamIds: undefined,
      monitoringPeriodDays: 7,
      delayRiskThreshold: 60,
      includeProductivityAnalysis: true,
    };

    const result = monitorProgressAndDetectDelayRisk(input);

    // 期待結果の検証
    expect(result.delayRiskDetected).toBe(false);
    expect(result.affectedSites).toEqual([]);
    expect(result.recommendedAdjustments).toEqual([]);
    expect(result.overallDelayRiskScore).toBeLessThan(60);
    expect(result.overallDelayRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.monitoringExecutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.notificationSent).toBe(false);

    // analysisDetailsの詳細検証
    expect(result.analysisDetails).toBeDefined();
    expect(result.analysisDetails?.totalSitesMonitored).toBeGreaterThanOrEqual(0);
    expect(result.analysisDetails?.sitesWithDelayRisk).toBe(0);
    expect(result.analysisDetails?.analysisStartDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.analysisDetails?.analysisEndDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.analysisDetails?.averageProgressRate).toBeGreaterThanOrEqual(0);
    expect(result.analysisDetails?.averageProgressRate).toBeLessThanOrEqual(100);
    expect(result.analysisDetails?.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.analysisDetails?.dataQualityScore).toBeLessThanOrEqual(100);
    expect(['high', 'medium', 'low']).toContain(result.analysisDetails?.analysisReliability);

    // 設計済みエラーが発生していないことの検証
    // エラーが存在しないことは、結果が正常値を持つことで間接的に検証
    expect(result).toHaveProperty('delayRiskDetected');
    expect(result).toHaveProperty('affectedSites');
    expect(result).toHaveProperty('recommendedAdjustments');
    expect(result).toHaveProperty('overallDelayRiskScore');
    expect(result).toHaveProperty('monitoringExecutedAt');
    expect(result).toHaveProperty('notificationSent');

    expect(authorizeUserActionStub).toHaveBeenCalled();
    expect(validateInputDataStub).toHaveBeenCalled();
  });
});