import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';

describe('SCEN-999: リアルタイム進捗監視と遅延検知', () => {
  it('納期までの残り時間と現在の進捗率から対応が必要な拠点を特定し、具体的な調整内容を提示する', async () => {
    const input = {
      userId: 'user-001',
      siteIds: ['SITE-001', 'SITE-002'],
      teamIds: ['TEAM-A', 'TEAM-B'],
      monitoringPeriodDays: 7,
      delayRiskThreshold: 60,
      includeProductivityAnalysis: true,
    };

    const result = await monitorProgressAndDetectDelayRisk(input);

    expect(result).toBeDefined();
    expect(result.monitoringExecutedAt).toBeDefined();
    expect(typeof result.monitoringExecutedAt).toBe('string');
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.monitoringExecutedAt).toMatch(isoDateRegex);

    expect(result.delayRiskDetected).toBe(true);

    expect(Array.isArray(result.affectedSites)).toBe(true);
    expect(result.affectedSites.length).toBe(1);
    
    const affectedSite = result.affectedSites[0];
    expect(affectedSite.siteId).toBe('SITE-002');
    expect(affectedSite.siteName).toBeDefined();
    expect(typeof affectedSite.delayRiskScore).toBe('number');
    expect(affectedSite.delayRiskScore).toBe(72);
    expect(affectedSite.delayRiskScore).toBeGreaterThanOrEqual(input.delayRiskThreshold);
    expect(typeof affectedSite.currentProgressRate).toBe('number');
    expect(affectedSite.currentProgressRate).toBe(60);
    expect(affectedSite.currentProgressRate).toBeGreaterThanOrEqual(0);
    expect(affectedSite.currentProgressRate).toBeLessThanOrEqual(100);
    expect(typeof affectedSite.plannedProgressRate).toBe('number');
    expect(typeof affectedSite.progressGapPercentage).toBe('number');
    expect(affectedSite.estimatedDeliveryDate).toBeDefined();
    expect(affectedSite.plannedDeliveryDate).toBeDefined();
    expect(typeof affectedSite.remainingDays).toBe('number');
    expect(Array.isArray(affectedSite.affectedTeams)).toBe(true);

    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(result.recommendedAdjustments.length).toBeGreaterThanOrEqual(1);

    const personnelAddition = result.recommendedAdjustments.find(
      (adj) => adj.adjustmentType === 'personnel_addition' && adj.siteId === 'SITE-002'
    );
    expect(personnelAddition).toBeDefined();
    expect(personnelAddition!.adjustmentDescription).toBeDefined();
    expect(typeof personnelAddition!.adjustmentDescription).toBe('string');
    expect(personnelAddition!.adjustmentDescription.length).toBeGreaterThan(0);
    expect(typeof personnelAddition!.estimatedImpactOnDelivery).toBe('number');
    expect(personnelAddition!.urgencyLevel).toBeDefined();
    const validUrgencyLevels = ['critical', 'high', 'medium', 'low'];
    expect(validUrgencyLevels).toContain(personnelAddition!.urgencyLevel);
    expect(personnelAddition!.recommendedExecutionDate).toBeDefined();
    expect(typeof personnelAddition!.requiredPersonnelCount).toBe('number');
    expect(personnelAddition!.requiredPersonnelCount).toBe(2);

    const priorityReordering = result.recommendedAdjustments.find(
      (adj) => adj.adjustmentType === 'priority_reordering' && adj.siteId === 'SITE-002'
    );
    expect(priorityReordering).toBeDefined();
    expect(Array.isArray(priorityReordering!.priorityWorkTypes)).toBe(true);
    expect(priorityReordering!.adjustmentDescription).toBeDefined();

    const workDifficultyAdjustment = result.recommendedAdjustments.find(
      (adj) => adj.adjustmentType === 'work_difficulty_adjustment' && adj.siteId === 'SITE-002'
    );
    expect(workDifficultyAdjustment).toBeDefined();
    expect(workDifficultyAdjustment!.adjustmentDescription).toBeDefined();

    expect(typeof result.overallDelayRiskScore).toBe('number');
    expect(result.overallDelayRiskScore).toBe(59);
    expect(result.overallDelayRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.overallDelayRiskScore).toBeLessThanOrEqual(100);

    expect(typeof result.notificationSent).toBe('boolean');
    expect(result.notificationSent).toBe(true);

    if (result.analysisDetails) {
      expect(result.analysisDetails.analysisStartDate).toBeDefined();
      expect(result.analysisDetails.analysisEndDate).toBeDefined();
      expect(typeof result.analysisDetails.totalSitesMonitored).toBe('number');
      expect(result.analysisDetails.totalSitesMonitored).toBe(2);
      expect(typeof result.analysisDetails.sitesWithDelayRisk).toBe('number');
      expect(result.analysisDetails.sitesWithDelayRisk).toBe(1);
      expect(result.analysisDetails.sitesWithDelayRisk).toBeGreaterThan(0);
      expect(typeof result.analysisDetails.averageProgressRate).toBe('number');
      expect(typeof result.analysisDetails.dataQualityScore).toBe('number');
      expect(result.analysisDetails.analysisReliability).toBeDefined();
    }
  });
});