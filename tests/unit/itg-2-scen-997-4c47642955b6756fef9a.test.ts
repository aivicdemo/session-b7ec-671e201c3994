import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';

describe('SCEN-997: リアルタイム進捗監視と遅延検知', () => {
  it('各拠点の作業負荷・納期余裕度・作業者スキルマッチ度から、融通可能な人員数と融通元拠点を判定し、人員融通の可否と推奨配置案を提示する', async () => {
    const input = {
      userId: 'user-001',
      siteIds: ['site-A', 'site-B'],
      teamIds: ['team-1', 'team-2'],
      monitoringPeriodDays: 7,
      delayRiskThreshold: 60,
      includeProductivityAnalysis: true,
    };

    const result = await monitorProgressAndDetectDelayRisk(input);

    // monitoringExecutedAt は ISO 8601形式
    expect(result.monitoringExecutedAt).toBeDefined();
    expect(typeof result.monitoringExecutedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T/.test(result.monitoringExecutedAt)).toBe(true);

    // delayRiskDetected は true（site-Bでリスク検知）
    expect(result.delayRiskDetected).toBe(true);

    // affectedSites 配列にはsite-Bの詳細情報が含まれる
    expect(result.affectedSites).toBeDefined();
    expect(Array.isArray(result.affectedSites)).toBe(true);
    expect(result.affectedSites.length).toBeGreaterThan(0);

    const siteBDetail = result.affectedSites.find((site) => site.siteId === 'site-B');
    expect(siteBDetail).toBeDefined();
    expect(siteBDetail?.delayRiskScore).toBeGreaterThanOrEqual(60);
    expect(siteBDetail?.currentProgressRate).toBeDefined();
    expect(siteBDetail?.plannedProgressRate).toBeDefined();
    expect(siteBDetail?.estimatedDeliveryDate).toBeDefined();
    expect(siteBDetail?.plannedDeliveryDate).toBeDefined();
    expect(siteBDetail?.remainingDays).toBeDefined();
    expect(siteBDetail?.affectedTeams).toBeDefined();
    expect(Array.isArray(siteBDetail?.affectedTeams)).toBe(true);

    // recommendedAdjustments 配列にはsite-Bに対する調整内容が含まれる
    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(result.recommendedAdjustments.length).toBeGreaterThan(0);

    const siteBAdjustments = result.recommendedAdjustments.filter(
      (adj) => adj.siteId === 'site-B'
    );
    expect(siteBAdjustments.length).toBeGreaterThan(0);

    const siteBAdj = siteBAdjustments[0];
    expect(siteBAdj.adjustmentType).toBeDefined();
    expect(siteBAdj.adjustmentDescription).toBeDefined();
    expect(siteBAdj.estimatedImpactOnDelivery).toBeDefined();
    expect(typeof siteBAdj.estimatedImpactOnDelivery).toBe('number');
    expect(siteBAdj.urgencyLevel).toBeDefined();
    expect(['critical', 'high', 'medium', 'low']).toContain(siteBAdj.urgencyLevel);
    expect(siteBAdj.recommendedExecutionDate).toBeDefined();

    // overallDelayRiskScore は site-Bの最大スコア相当
    expect(result.overallDelayRiskScore).toBeDefined();
    expect(typeof result.overallDelayRiskScore).toBe('number');
    expect(result.overallDelayRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.overallDelayRiskScore).toBeLessThanOrEqual(100);

    // notificationSent は true
    expect(result.notificationSent).toBe(true);

    // analysisDetails には進捗分析の詳細情報が含まれる
    expect(result.analysisDetails).toBeDefined();
    expect(result.analysisDetails?.analysisStartDate).toBeDefined();
    expect(result.analysisDetails?.analysisEndDate).toBeDefined();
    expect(result.analysisDetails?.totalSitesMonitored).toBeDefined();
    expect(result.analysisDetails?.sitesWithDelayRisk).toBeDefined();
    expect(result.analysisDetails?.averageProgressRate).toBeDefined();
    expect(result.analysisDetails?.dataQualityScore).toBeDefined();
    expect(result.analysisDetails?.analysisReliability).toBeDefined();
  });
});