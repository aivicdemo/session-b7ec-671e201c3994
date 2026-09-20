import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';

describe('SCEN-1002: リアルタイム進捗監視と遅延検知', () => {
  it('生成された最適人員配置案と対応指示が現場リーダーに配信され、実行指示の完結まで処理される', async () => {
    const input = {
      userId: 'leader-001',
      siteIds: ['site-A'],
      monitoringPeriodDays: 7,
      delayRiskThreshold: 60,
      includeProductivityAnalysis: true,
    };

    const result = await monitorProgressAndDetectDelayRisk(input);

    expect(result).toBeDefined();
    expect(result.monitoringExecutedAt).toBeDefined();
    expect(typeof result.monitoringExecutedAt).toBe('string');
    expect(new Date(result.monitoringExecutedAt)).toBeInstanceOf(Date);

    expect(typeof result.delayRiskDetected).toBe('boolean');
    expect(result.delayRiskDetected).toBe(true);

    expect(Array.isArray(result.affectedSites)).toBe(true);
    expect(result.affectedSites.length).toBeGreaterThan(0);

    const affectedSite = result.affectedSites[0];
    expect(affectedSite.siteId).toBeDefined();
    expect(affectedSite.siteName).toBeDefined();
    expect(typeof affectedSite.delayRiskScore).toBe('number');
    expect(affectedSite.delayRiskScore).toBeGreaterThan(60);
    expect(typeof affectedSite.currentProgressRate).toBe('number');
    expect(affectedSite.currentProgressRate).toBeGreaterThanOrEqual(0);
    expect(affectedSite.currentProgressRate).toBeLessThanOrEqual(100);
    expect(typeof affectedSite.plannedProgressRate).toBe('number');
    expect(typeof affectedSite.progressGapPercentage).toBe('number');
    expect(affectedSite.remainingDays).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(affectedSite.affectedTeams)).toBe(true);

    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(result.recommendedAdjustments.length).toBeGreaterThan(0);

    const adjustment = result.recommendedAdjustments[0];
    expect(adjustment.siteId).toBeDefined();
    expect(adjustment.adjustmentType).toBeDefined();
    expect(['personnel_addition', 'priority_reordering', 'work_difficulty_adjustment', 'overtime_extension'].includes(adjustment.adjustmentType)).toBe(true);
    expect(adjustment.adjustmentDescription).toBeDefined();
    expect(typeof adjustment.estimatedImpactOnDelivery).toBe('number');
    expect(['critical', 'high', 'medium', 'low'].includes(adjustment.urgencyLevel)).toBe(true);
    expect(adjustment.recommendedExecutionDate).toBeDefined();

    expect(typeof result.overallDelayRiskScore).toBe('number');
    expect(result.overallDelayRiskScore).toBeGreaterThan(60);
    expect(result.overallDelayRiskScore).toBeLessThanOrEqual(100);

    expect(typeof result.notificationSent).toBe('boolean');
    expect(result.notificationSent).toBe(true);

    expect(result.analysisDetails).toBeDefined();
    expect(typeof result.analysisDetails.totalSitesMonitored).toBe('number');
    expect(typeof result.analysisDetails.sitesWithDelayRisk).toBe('number');
    expect(typeof result.analysisDetails.averageProgressRate).toBe('number');
    expect(typeof result.analysisDetails.dataQualityScore).toBe('number');
    expect(['high', 'medium', 'low'].includes(result.analysisDetails.analysisReliability)).toBe(true);
  });
});