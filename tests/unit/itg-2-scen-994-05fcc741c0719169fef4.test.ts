import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';

describe('SCEN-994: 進捗遅延リスク検知と拠点特定', () => {
  it('should detect delay risk, identify affected sites, and determine data collection strategy', async () => {
    const userId = 'test-user-001';
    const siteIds = ['site-001', 'site-002', 'site-003'];
    const teamIds = ['team-001', 'team-002'];
    const monitoringPeriodDays = 7;
    const delayRiskThreshold = 60;
    const includeProductivityAnalysis = true;

    const input = {
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis,
    };

    const result = await monitorProgressAndDetectDelayRisk(input);

    // monitoringExecutedAtは現在日時のISO 8601形式文字列
    expect(result.monitoringExecutedAt).toBeDefined();
    expect(typeof result.monitoringExecutedAt).toBe('string');
    expect(new Date(result.monitoringExecutedAt).toString()).not.toBe('Invalid Date');

    // delayRiskDetectedがtrueであること（複数拠点でリスクスコア≥60を検知）
    expect(result.delayRiskDetected).toBe(true);

    // affectedSitesには、検知された各拠点について、AffectedSiteDetailの各フィールドが拠点ごとのリスク検知情報を含んでいること
    expect(result.affectedSites).toBeDefined();
    expect(Array.isArray(result.affectedSites)).toBe(true);
    expect(result.affectedSites.length).toBeGreaterThan(0);

    result.affectedSites.forEach((site) => {
      expect(site.siteId).toBeDefined();
      expect(typeof site.siteId).toBe('string');
      expect(site.siteName).toBeDefined();
      expect(typeof site.siteName).toBe('string');
      expect(site.delayRiskScore).toBeDefined();
      expect(typeof site.delayRiskScore).toBe('number');
      expect(site.delayRiskScore).toBeGreaterThanOrEqual(0);
      expect(site.delayRiskScore).toBeLessThanOrEqual(100);
      expect(site.delayRiskScore).toBeGreaterThanOrEqual(delayRiskThreshold);

      expect(site.currentProgressRate).toBeDefined();
      expect(typeof site.currentProgressRate).toBe('number');
      expect(site.currentProgressRate).toBeGreaterThanOrEqual(0);
      expect(site.currentProgressRate).toBeLessThanOrEqual(100);

      expect(site.plannedProgressRate).toBeDefined();
      expect(typeof site.plannedProgressRate).toBe('number');
      expect(site.plannedProgressRate).toBeGreaterThanOrEqual(0);
      expect(site.plannedProgressRate).toBeLessThanOrEqual(100);

      expect(site.progressGapPercentage).toBeDefined();
      expect(typeof site.progressGapPercentage).toBe('number');

      expect(site.estimatedDeliveryDate).toBeDefined();
      expect(typeof site.estimatedDeliveryDate).toBe('string');
      expect(new Date(site.estimatedDeliveryDate).toString()).not.toBe('Invalid Date');

      expect(site.plannedDeliveryDate).toBeDefined();
      expect(typeof site.plannedDeliveryDate).toBe('string');
      expect(new Date(site.plannedDeliveryDate).toString()).not.toBe('Invalid Date');

      expect(site.remainingDays).toBeDefined();
      expect(typeof site.remainingDays).toBe('number');

      expect(site.affectedTeams).toBeDefined();
      expect(Array.isArray(site.affectedTeams)).toBe(true);
    });

    // recommendedAdjustmentsには、対応が必要な各拠点について、AdjustmentRecommendationの各フィールドが具体的な調整内容を含んでいること
    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(result.recommendedAdjustments.length).toBeGreaterThan(0);

    result.recommendedAdjustments.forEach((adjustment) => {
      expect(adjustment.siteId).toBeDefined();
      expect(typeof adjustment.siteId).toBe('string');

      expect(adjustment.adjustmentType).toBeDefined();
      expect(typeof adjustment.adjustmentType).toBe('string');

      expect(adjustment.adjustmentDescription).toBeDefined();
      expect(typeof adjustment.adjustmentDescription).toBe('string');

      expect(adjustment.estimatedImpactOnDelivery).toBeDefined();
      expect(typeof adjustment.estimatedImpactOnDelivery).toBe('number');

      expect(adjustment.urgencyLevel).toBeDefined();
      expect(typeof adjustment.urgencyLevel).toBe('string');
      expect(['critical', 'high', 'medium', 'low']).toContain(adjustment.urgencyLevel);

      expect(adjustment.recommendedExecutionDate).toBeDefined();
      expect(typeof adjustment.recommendedExecutionDate).toBe('string');
      expect(new Date(adjustment.recommendedExecutionDate).toString()).not.toBe('Invalid Date');
    });

    // overallDelayRiskScoreが60以上の数値であること
    expect(result.overallDelayRiskScore).toBeDefined();
    expect(typeof result.overallDelayRiskScore).toBe('number');
    expect(result.overallDelayRiskScore).toBeGreaterThanOrEqual(delayRiskThreshold);
    expect(result.overallDelayRiskScore).toBeLessThanOrEqual(100);

    // notificationSentがtrueであること（関係者への通知が送信されたことを示す）
    expect(result.notificationSent).toBe(true);

    // analysisDetailsが存在し、監視対象期間内の進捗トレンド、拠点ごとのリスク分類、生産性分析結果が含まれていること
    expect(result.analysisDetails).toBeDefined();

    if (result.analysisDetails) {
      expect(result.analysisDetails.analysisStartDate).toBeDefined();
      expect(typeof result.analysisDetails.analysisStartDate).toBe('string');
      expect(new Date(result.analysisDetails.analysisStartDate).toString()).not.toBe('Invalid Date');

      expect(result.analysisDetails.analysisEndDate).toBeDefined();
      expect(typeof result.analysisDetails.analysisEndDate).toBe('string');
      expect(new Date(result.analysisDetails.analysisEndDate).toString()).not.toBe('Invalid Date');

      expect(result.analysisDetails.totalSitesMonitored).toBeDefined();
      expect(typeof result.analysisDetails.totalSitesMonitored).toBe('number');
      expect(result.analysisDetails.totalSitesMonitored).toBeGreaterThan(0);

      expect(result.analysisDetails.sitesWithDelayRisk).toBeDefined();
      expect(typeof result.analysisDetails.sitesWithDelayRisk).toBe('number');
      expect(result.analysisDetails.sitesWithDelayRisk).toBeGreaterThan(0);

      expect(result.analysisDetails.averageProgressRate).toBeDefined();
      expect(typeof result.analysisDetails.averageProgressRate).toBe('number');
      expect(result.analysisDetails.averageProgressRate).toBeGreaterThanOrEqual(0);
      expect(result.analysisDetails.averageProgressRate).toBeLessThanOrEqual(100);

      expect(result.analysisDetails.dataQualityScore).toBeDefined();
      expect(typeof result.analysisDetails.dataQualityScore).toBe('number');
      expect(result.analysisDetails.dataQualityScore).toBeGreaterThanOrEqual(0);
      expect(result.analysisDetails.dataQualityScore).toBeLessThanOrEqual(100);

      expect(result.analysisDetails.analysisReliability).toBeDefined();
      expect(typeof result.analysisDetails.analysisReliability).toBe('string');
      expect(['high', 'medium', 'low']).toContain(result.analysisDetails.analysisReliability);
    }
  });
});