import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';
import * as persistenceLayer from '../../src/persistence-layer';

jest.mock('../../src/persistence-layer');

describe('SCEN-993: リアルタイム進捗監視と遅延検知', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('定期実行の進捗監視ジョブが起動し、WMSとハンディターミナルからリアルタイムデータを収集して進捗遅延リスクを数値化する', async () => {
    const userId = 'U001';
    const siteIds = ['S001', 'S002'];
    const teamIds = ['T001'];
    const monitoringPeriodDays = 7;
    const delayRiskThreshold = 60;
    const includeProductivityAnalysis = true;

    // Mock the persistence layer functions
    (persistenceLayer.findProductivityDataBySiteAndPeriod as jest.Mock).mockResolvedValue([
      {
        siteId: 'S001',
        averageProductivityRate: 85,
        dataPoints: 20,
      },
      {
        siteId: 'S002',
        averageProductivityRate: 75,
        dataPoints: 18,
      },
    ]);

    (persistenceLayer.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue([
      {
        teamId: 'T001',
        averageProductivityRate: 80,
        dataPoints: 15,
      },
    ]);

    // Mock aggregation
    (persistenceLayer.aggregateProgressDataBySite as jest.Mock).mockResolvedValue({
      siteId: 'S001',
      currentProgressRate: 65,
      plannedProgressRate: 75,
      remainingDays: 5,
      totalWorkload: 500,
      currentTeamCapacity: 50,
      averageProductivityRate: 85,
    });

    // Mock delay risk score calculation
    (persistenceLayer.calculateDelayRiskScore as jest.Mock)
      .mockResolvedValueOnce({
        siteId: 'S001',
        delayRiskScore: 68,
        riskLevel: 'HIGH',
        progressGapPercentage: -10,
        requiredDailyProgressRate: 20,
        calculatedAt: new Date().toISOString(),
      })
      .mockResolvedValueOnce({
        siteId: 'S002',
        delayRiskScore: 55,
        riskLevel: 'MEDIUM',
        progressGapPercentage: -5,
        requiredDailyProgressRate: 18,
        calculatedAt: new Date().toISOString(),
      });

    // Mock affected sites and adjustments identification
    (persistenceLayer.identifyAffectedSitesAndAdjustments as jest.Mock).mockResolvedValue({
      affectedSites: [
        {
          siteId: 'S001',
          siteName: 'Site 001',
          delayRiskScore: 68,
          currentProgressRate: 65,
          plannedProgressRate: 75,
          progressGapPercentage: -10,
          estimatedDeliveryDate: '2024-01-20T18:00:00Z',
          plannedDeliveryDate: '2024-01-18T18:00:00Z',
          remainingDays: 5,
          affectedTeams: ['T001'],
          averageProductivityRate: 85,
        },
      ],
      recommendedAdjustments: [
        {
          siteId: 'S001',
          adjustmentType: 'personnel_addition',
          adjustmentDescription: '追加人員数3名、優先順位変更：高難度タスクを後回しにして単純作業を優先、作業難度調整：新人向けの簡易タスクに切り替え',
          requiredPersonnelCount: 3,
          requiredSkillLevel: 'beginner',
          priorityWorkTypes: ['task_type_simple'],
          estimatedImpactOnDelivery: 2,
          urgencyLevel: 'high',
          recommendedExecutionDate: new Date().toISOString(),
        },
      ],
      adjustmentSummary: {
        totalAffectedSites: 1,
        totalRequiredPersonnel: 3,
        adjustmentTypes: ['personnel_addition', 'priority_reordering'],
        estimatedOverallDeliveryImpact: 80,
        identifiedAt: new Date().toISOString(),
      },
      feasibilityAssessment: {
        isFullyFeasible: true,
        feasibleAdjustmentCount: 1,
        infeasibleAdjustments: [],
        constraintFactors: [],
      },
    });

    // Mock notification
    (persistenceLayer.sendProgressDelayRiskNotification as jest.Mock).mockResolvedValue({
      sent: true,
    });

    const input = {
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis,
    };

    const result = await monitorProgressAndDetectDelayRisk(input);

    // Assertions
    expect(result).toBeDefined();
    expect(result.monitoringExecutedAt).toBeDefined();
    expect(typeof result.monitoringExecutedAt).toBe('string');
    // Verify ISO 8601 format
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.monitoringExecutedAt)).toBe(true);

    expect(result.delayRiskDetected).toBe(true);

    expect(Array.isArray(result.affectedSites)).toBe(true);
    expect(result.affectedSites.length).toBeGreaterThanOrEqual(1);
    expect(result.affectedSites.some((site) => site.siteId === 'S001')).toBe(true);

    const s001Site = result.affectedSites.find((site) => site.siteId === 'S001');
    expect(s001Site).toBeDefined();
    expect(s001Site?.delayRiskScore).toBeGreaterThanOrEqual(60);
    expect(s001Site?.currentProgressRate).toBeLessThan(s001Site?.plannedProgressRate);

    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(result.recommendedAdjustments.length).toBeGreaterThanOrEqual(1);

    const s001Adjustment = result.recommendedAdjustments.find(
      (adj) => adj.siteId === 'S001'
    );
    expect(s001Adjustment).toBeDefined();
    expect(s001Adjustment?.adjustmentType).toMatch(/personnel_addition|priority_reordering|work_difficulty_adjustment/);
    expect(s001Adjustment?.adjustmentDescription).toContain('追加人員数3名');
    expect(s001Adjustment?.adjustmentDescription).toContain('優先順位変更');
    expect(s001Adjustment?.adjustmentDescription).toContain('作業難度調整');
    expect(s001Adjustment?.requiredPersonnelCount).toBe(3);
    expect(s001Adjustment?.urgencyLevel).toMatch(/critical|high|medium|low/);
    expect(s001Adjustment?.estimatedImpactOnDelivery).toBeGreaterThan(0);

    expect(result.overallDelayRiskScore).toBeGreaterThan(delayRiskThreshold);

    expect(result.notificationSent).toBe(true);

    expect(result.analysisDetails).toBeDefined();
    expect(result.analysisDetails?.totalSitesMonitored).toBeGreaterThanOrEqual(1);
    expect(result.analysisDetails?.sitesWithDelayRisk).toBeGreaterThanOrEqual(1);
    expect(typeof result.analysisDetails?.dataQualityScore).toBe('number');
    expect(result.analysisDetails?.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.analysisDetails?.dataQualityScore).toBeLessThanOrEqual(100);
  });
});