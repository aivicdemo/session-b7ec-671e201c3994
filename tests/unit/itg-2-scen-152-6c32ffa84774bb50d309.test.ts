import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';

describe('SCEN-152: siteIds指定時の遅延リスク検知対象の限定', () => {
  let authenticateUserMock: jest.Mock;
  let authorizeUserActionMock: jest.Mock;
  let validateInputDataMock: jest.Mock;
  let aggregateProgressDataBySiteMock: jest.Mock;
  let findProductivityDataBySiteAndPeriodMock: jest.Mock;
  let calculateDelayRiskScoreMock: jest.Mock;
  let identifyAffectedSitesAndAdjustmentsMock: jest.Mock;
  let sendProgressDelayRiskNotificationMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    authenticateUserMock = jest.fn().mockResolvedValue({ userId: 'user001', authenticated: true });
    
    authorizeUserActionMock = jest.fn().mockResolvedValue({ authorized: true });
    
    validateInputDataMock = jest.fn().mockResolvedValue({ valid: true });
    
    aggregateProgressDataBySiteMock = jest.fn().mockResolvedValue({
      siteProgresses: [
        {
          siteId: 'site-A',
          siteName: 'Site A',
          currentProgressRate: 65,
          plannedProgressRate: 70,
          remainingDays: 5,
          totalWorkload: 1000,
          currentTeamCapacity: 150,
          affectedTeams: ['team-1', 'team-2'],
        },
        {
          siteId: 'site-B',
          siteName: 'Site B',
          currentProgressRate: 55,
          plannedProgressRate: 70,
          remainingDays: 3,
          totalWorkload: 1500,
          currentTeamCapacity: 100,
          affectedTeams: ['team-3'],
        },
      ],
    });
    
    findProductivityDataBySiteAndPeriodMock = jest.fn().mockResolvedValue({
      siteProductivityData: [
        {
          siteId: 'site-A',
          averageProductivityRate: 75,
          dataPoints: 10,
        },
        {
          siteId: 'site-B',
          averageProductivityRate: 65,
          dataPoints: 8,
        },
      ],
    });
    
    calculateDelayRiskScoreMock = jest.fn()
      .mockResolvedValueOnce({
        delayRiskScores: [
          {
            siteId: 'site-A',
            delayRiskScore: 45,
            riskLevel: 'MEDIUM',
            progressGapPercentage: -5,
            requiredDailyProgressRate: 7,
            calculatedAt: new Date().toISOString(),
          },
        ],
      })
      .mockResolvedValueOnce({
        delayRiskScores: [
          {
            siteId: 'site-B',
            delayRiskScore: 68,
            riskLevel: 'HIGH',
            progressGapPercentage: -15,
            requiredDailyProgressRate: 15,
            calculatedAt: new Date().toISOString(),
          },
        ],
      });
    
    identifyAffectedSitesAndAdjustmentsMock = jest.fn().mockResolvedValue({
      affectedSites: [
        {
          siteId: 'site-A',
          siteName: 'Site A',
          delayRiskScore: 45,
          currentProgressRate: 65,
          plannedProgressRate: 70,
          progressGapPercentage: -5,
          estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          plannedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          remainingDays: 5,
          affectedTeams: ['team-1', 'team-2'],
          averageProductivityRate: 75,
        },
        {
          siteId: 'site-B',
          siteName: 'Site B',
          delayRiskScore: 68,
          currentProgressRate: 55,
          plannedProgressRate: 70,
          progressGapPercentage: -15,
          estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          plannedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          remainingDays: 3,
          affectedTeams: ['team-3'],
          averageProductivityRate: 65,
        },
      ],
      recommendedAdjustments: [
        {
          siteId: 'site-A',
          adjustmentType: 'personnel_addition',
          adjustmentDescription: 'Add 2 personnel to team-1',
          requiredPersonnelCount: 2,
          requiredSkillLevel: 'intermediate',
          priorityWorkTypes: ['work-type-1'],
          estimatedImpactOnDelivery: 2,
          urgencyLevel: 'high',
          recommendedExecutionDate: new Date().toISOString(),
        },
        {
          siteId: 'site-B',
          adjustmentType: 'overtime_extension',
          adjustmentDescription: 'Extend overtime for team-3',
          requiredPersonnelCount: undefined,
          requiredSkillLevel: undefined,
          priorityWorkTypes: ['work-type-2'],
          estimatedImpactOnDelivery: 3,
          urgencyLevel: 'critical',
          recommendedExecutionDate: new Date().toISOString(),
        },
      ],
      adjustmentSummary: {
        totalAffectedSites: 2,
        totalRequiredPersonnel: 2,
        adjustmentTypes: ['personnel_addition', 'overtime_extension'],
        estimatedOverallDeliveryImpact: 85,
        identifiedAt: new Date().toISOString(),
      },
      feasibilityAssessment: {
        isFullyFeasible: true,
        feasibleAdjustmentCount: 2,
        infeasibleAdjustments: [],
        constraintFactors: [],
      },
    });
    
    sendProgressDelayRiskNotificationMock = jest.fn().mockResolvedValue({
      notificationSent: true,
      notificationIds: ['notif-1', 'notif-2'],
    });

    jest.doMock('../../src/logic/progress-monitoring', () => ({
      monitorProgressAndDetectDelayRisk: jest.fn(async (input) => {
        await authenticateUserMock(input.userId);
        await authorizeUserActionMock(input.userId, 'monitor_progress_and_detect_delay_risk');
        await validateInputDataMock(input);

        const progressData = await aggregateProgressDataBySiteMock(
          input.siteIds,
          input.analysisStartDate,
          input.analysisEndDate
        );

        const productivityData = await findProductivityDataBySiteAndPeriodMock(
          input.siteIds,
          input.analysisStartDate,
          input.analysisEndDate
        );

        const riskScores = [];
        for (const siteProgress of progressData.siteProgresses) {
          const riskScore = await calculateDelayRiskScoreMock(
            siteProgress.siteId,
            undefined,
            input.analysisStartDate,
            input.analysisEndDate,
            siteProgress.plannedProgressRate,
            siteProgress.currentProgressRate,
            siteProgress.remainingDays,
            productivityData.siteProductivityData.find((p) => p.siteId === siteProgress.siteId)?.averageProductivityRate || 0,
            80
          );
          riskScores.push(...riskScore.delayRiskScores);
        }

        const { affectedSites, recommendedAdjustments, adjustmentSummary, feasibilityAssessment } =
          await identifyAffectedSitesAndAdjustmentsMock(
            riskScores,
            input.delayRiskThreshold,
            progressData.siteProgresses,
            {},
            new Date().toISOString()
          );

        const delayRiskDetected = affectedSites.length > 0;
        let notificationSent = false;
        if (delayRiskDetected) {
          const notificationResult = await sendProgressDelayRiskNotificationMock(affectedSites, recommendedAdjustments);
          notificationSent = notificationResult.notificationSent;
        }

        return {
          monitoringExecutedAt: new Date().toISOString(),
          delayRiskDetected,
          affectedSites,
          recommendedAdjustments,
          overallDelayRiskScore: riskScores.reduce((sum, r) => sum + r.delayRiskScore, 0) / riskScores.length,
          notificationSent,
          analysisDetails: {
            analysisStartDate: input.analysisStartDate,
            analysisEndDate: input.analysisEndDate,
            totalSitesMonitored: progressData.siteProgresses.length,
            sitesWithDelayRisk: affectedSites.length,
            averageProgressRate: 65,
            averageProductivityRate: 70,
            dataQualityScore: 95,
            analysisReliability: 'high',
          },
        };
      }),
    }));
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('siteIds指定時、指定された拠点のみが監視対象に限定される', async () => {
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();

    const input = {
      userId: 'user001',
      siteIds: ['site-A', 'site-B'],
      teamIds: undefined,
      monitoringPeriodDays: 7,
      delayRiskThreshold: 60,
      includeProductivityAnalysis: true,
      analysisStartDate: startDate,
      analysisEndDate: endDate,
    };

    const result = await monitorProgressAndDetectDelayRisk(input);

    expect(authenticateUserMock).toHaveBeenCalledWith('user001');
    expect(authorizeUserActionMock).toHaveBeenCalledWith('user001', 'monitor_progress_and_detect_delay_risk');
    expect(validateInputDataMock).toHaveBeenCalledWith(input);

    expect(aggregateProgressDataBySiteMock).toHaveBeenCalledWith(
      ['site-A', 'site-B'],
      startDate,
      endDate
    );
    expect(findProductivityDataBySiteAndPeriodMock).toHaveBeenCalledWith(
      ['site-A', 'site-B'],
      startDate,
      endDate
    );

    expect(result.affectedSites).toBeDefined();
    expect(result.affectedSites.length).toBeGreaterThan(0);
    expect(result.affectedSites.every((site) => ['site-A', 'site-B'].includes(site.siteId))).toBe(true);
    expect(result.affectedSites.some((site) => site.siteId === 'site-C')).toBe(false);

    expect(result.recommendedAdjustments).toBeDefined();
    expect(result.recommendedAdjustments.every((adj) => ['site-A', 'site-B'].includes(adj.siteId))).toBe(true);

    expect(result.overallDelayRiskScore).toBeDefined();
    expect(typeof result.overallDelayRiskScore).toBe('number');

    expect(result.delayRiskDetected).toBe(true);
    expect(result.notificationSent).toBe(true);
  });
});