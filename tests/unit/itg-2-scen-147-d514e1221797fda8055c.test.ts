import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';
import * as progressMonitoring from '../../src/logic/progress-monitoring';

jest.mock('../../src/logic/progress-monitoring', () => ({
  ...jest.requireActual('../../src/logic/progress-monitoring'),
}));

describe('SCEN-147: monitorProgressAndDetectDelayRisk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect delay risk and provide site-specific adjustment recommendations', async () => {
    const now = new Date();
    const executedAt = now.toISOString();

    jest.spyOn(progressMonitoring, 'monitorProgressAndDetectDelayRisk').mockResolvedValue({
      monitoringExecutedAt: executedAt,
      delayRiskDetected: true,
      affectedSites: [
        {
          siteId: 'site-A',
          siteName: 'Site A',
          delayRiskScore: 35,
          currentProgressRate: 75,
          plannedProgressRate: 75,
          progressGapPercentage: 0,
          estimatedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          plannedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          remainingDays: 10,
          affectedTeams: ['team-A1'],
          averageProductivityRate: 85,
        },
        {
          siteId: 'site-B',
          siteName: 'Site B',
          delayRiskScore: 72,
          currentProgressRate: 45,
          plannedProgressRate: 65,
          progressGapPercentage: 20,
          estimatedDeliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          plannedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          remainingDays: 10,
          affectedTeams: ['team-B1', 'team-B2'],
          averageProductivityRate: 65,
        },
      ],
      recommendedAdjustments: [
        {
          siteId: 'site-B',
          adjustmentType: 'personnel_addition',
          adjustmentDescription: 'Add 3 workers to accelerate completion',
          requiredPersonnelCount: 3,
          requiredSkillLevel: 'intermediate',
          priorityWorkTypes: ['packing', 'inspection'],
          estimatedImpactOnDelivery: 7.5,
          urgencyLevel: 'high',
          recommendedExecutionDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      overallDelayRiskScore: 54,
      notificationSent: true,
      analysisDetails: {
        analysisStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        analysisEndDate: executedAt,
        totalSitesMonitored: 2,
        sitesWithDelayRisk: 1,
        averageProgressRate: 60,
        averageProductivityRate: 75,
        dataQualityScore: 95,
        analysisReliability: 'high',
      },
    });

    const result = await monitorProgressAndDetectDelayRisk({
      userId: 'user-001',
      siteIds: ['site-A', 'site-B'],
      monitoringPeriodDays: 7,
      delayRiskThreshold: 60,
      includeProductivityAnalysis: true,
    });

    expect(result.monitoringExecutedAt).toBeDefined();
    expect(typeof result.monitoringExecutedAt).toBe('string');
    expect(new Date(result.monitoringExecutedAt).getTime()).toBeLessThanOrEqual(Date.now());

    expect(result.delayRiskDetected).toBe(true);

    expect(result.affectedSites).toBeDefined();
    expect(Array.isArray(result.affectedSites)).toBe(true);
    expect(result.affectedSites.length).toBeGreaterThanOrEqual(1);

    const siteBDetails = result.affectedSites.find(site => site.siteId === 'site-B');
    expect(siteBDetails).toBeDefined();
    expect(siteBDetails!.siteName).toBe('Site B');
    expect(siteBDetails!.delayRiskScore).toBe(72);
    expect(siteBDetails!.currentProgressRate).toBe(45);
    expect(siteBDetails!.plannedProgressRate).toBe(65);
    expect(siteBDetails!.progressGapPercentage).toBe(20);
    expect(siteBDetails!.remainingDays).toBe(10);
    expect(siteBDetails!.affectedTeams).toEqual(expect.arrayContaining(['team-B1', 'team-B2']));

    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(result.recommendedAdjustments.length).toBeGreaterThanOrEqual(1);

    const siteBAdj = result.recommendedAdjustments.find(adj => adj.siteId === 'site-B');
    expect(siteBAdj).toBeDefined();
    expect(siteBAdj!.siteId).toBe('site-B');
    expect(siteBAdj!.adjustmentType).toBe('personnel_addition');
    expect(siteBAdj!.requiredPersonnelCount).toBe(3);
    expect(siteBAdj!.estimatedImpactOnDelivery).toBe(7.5);
    expect(siteBAdj!.urgencyLevel).toBe('high');
    expect(siteBAdj!.priorityWorkTypes).toBeDefined();
    expect(Array.isArray(siteBAdj!.priorityWorkTypes)).toBe(true);
    expect(siteBAdj!.priorityWorkTypes).toContain('packing');
    expect(siteBAdj!.priorityWorkTypes).toContain('inspection');

    expect(result.overallDelayRiskScore).toBe(54);

    expect(result.notificationSent).toBe(true);

    expect(result.analysisDetails).toBeDefined();
    expect(result.analysisDetails!.totalSitesMonitored).toBe(2);
    expect(result.analysisDetails!.sitesWithDelayRisk).toBe(1);
    expect(result.analysisDetails!.analysisReliability).toBe('high');
    expect(result.analysisDetails!.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.analysisDetails!.dataQualityScore).toBeLessThanOrEqual(100);
    expect(result.analysisDetails!.averageProgressRate).toBeDefined();
    expect(result.analysisDetails!.averageProductivityRate).toBeDefined();
  });
});