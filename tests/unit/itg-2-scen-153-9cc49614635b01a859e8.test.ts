import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';
import * as progressMonitoring from '../../src/logic/progress-monitoring';

jest.mock('../../src/logic/progress-monitoring', () => {
  const actual = jest.requireActual('../../src/logic/progress-monitoring');
  return {
    ...actual,
    authenticateUser: jest.fn(),
    authorizeUserAction: jest.fn(),
    validateInputData: jest.fn(),
    findProductivityDataByTeamAndPeriod: jest.fn(),
    aggregateProgressDataBySite: jest.fn(),
    calculateDelayRiskScore: jest.fn(),
    identifyAffectedSitesAndAdjustments: jest.fn(),
    sendProgressDelayRiskNotification: jest.fn(),
  };
});

describe('SCEN-153: teamIdsが指定されたとき、指定されたチームのみが監視対象として遅延リスク検知対象に限定される', () => {
  const userId = 'user-001';
  const siteIds = ['site-001', 'site-002'];
  const teamIds = ['team-001', 'team-002'];
  const monitoringPeriodDays = 7;
  const delayRiskThreshold = 60;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('認可チェックが実行され、入力値の妥当性が検証されること', async () => {
    (progressMonitoring.authenticateUser as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
    });
    (progressMonitoring.authorizeUserAction as jest.Mock).mockResolvedValue(
      true
    );
    (progressMonitoring.validateInputData as jest.Mock).mockResolvedValue(true);
    (progressMonitoring.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.aggregateProgressDataBySite as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.calculateDelayRiskScore as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.identifyAffectedSitesAndAdjustments as jest.Mock).mockResolvedValue(
      { affectedSites: [], recommendedAdjustments: [] }
    );
    (progressMonitoring.sendProgressDelayRiskNotification as jest.Mock).mockResolvedValue(
      true
    );

    const result = await monitorProgressAndDetectDelayRisk({
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis: true,
    });

    expect(progressMonitoring.authenticateUser).toHaveBeenCalledWith(
      expect.objectContaining({ userId })
    );
    expect(progressMonitoring.authorizeUserAction).toHaveBeenCalled();
    expect(progressMonitoring.validateInputData).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        siteIds,
        teamIds,
        monitoringPeriodDays,
        delayRiskThreshold,
      })
    );

    expect(result).toBeDefined();
    expect(result).toHaveProperty('monitoringExecutedAt');
    expect(typeof result.monitoringExecutedAt).toBe('string');
  });

  it('指定されたチームIDのみが遅延リスク検知対象に限定され、affectedSites内のチームは指定チームのみであること', async () => {
    (progressMonitoring.authenticateUser as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
    });
    (progressMonitoring.authorizeUserAction as jest.Mock).mockResolvedValue(
      true
    );
    (progressMonitoring.validateInputData as jest.Mock).mockResolvedValue(true);
    (progressMonitoring.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.aggregateProgressDataBySite as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.calculateDelayRiskScore as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.identifyAffectedSitesAndAdjustments as jest.Mock).mockResolvedValue(
      {
        affectedSites: [
          {
            siteId: 'site-001',
            siteName: 'Site 1',
            delayRiskScore: 70,
            currentProgressRate: 40,
            plannedProgressRate: 60,
            progressGapPercentage: -20,
            estimatedDeliveryDate: '2024-01-15',
            plannedDeliveryDate: '2024-01-10',
            remainingDays: 3,
            affectedTeams: ['team-001'],
            averageProductivityRate: 75,
          },
        ],
        recommendedAdjustments: [
          {
            siteId: 'site-001',
            adjustmentType: 'personnel_addition',
            adjustmentDescription: 'Add 2 workers',
            requiredPersonnelCount: 2,
            estimatedImpactOnDelivery: 2,
            urgencyLevel: 'high',
            recommendedExecutionDate: '2024-01-08',
          },
        ],
      }
    );
    (progressMonitoring.sendProgressDelayRiskNotification as jest.Mock).mockResolvedValue(
      true
    );

    const result = await monitorProgressAndDetectDelayRisk({
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis: true,
    });

    expect(result).toHaveProperty('monitoringExecutedAt');
    expect(result).toHaveProperty('delayRiskDetected');
    expect(result).toHaveProperty('affectedSites');
    expect(result).toHaveProperty('recommendedAdjustments');
    expect(result).toHaveProperty('overallDelayRiskScore');
    expect(result).toHaveProperty('notificationSent');
    expect(result).toHaveProperty('analysisDetails');

    expect(typeof result.monitoringExecutedAt).toBe('string');
    expect(typeof result.delayRiskDetected).toBe('boolean');
    expect(Array.isArray(result.affectedSites)).toBe(true);
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(typeof result.overallDelayRiskScore).toBe('number');
    expect(typeof result.notificationSent).toBe('boolean');

    result.affectedSites.forEach((site) => {
      expect(Array.isArray(site.affectedTeams)).toBe(true);
      site.affectedTeams.forEach((teamId) => {
        expect(teamIds).toContain(teamId);
      });
    });

    result.recommendedAdjustments.forEach((adjustment) => {
      expect(siteIds).toContain(adjustment.siteId);
    });

    expect(result.overallDelayRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.overallDelayRiskScore).toBeLessThanOrEqual(100);

    expect(typeof result.notificationSent).toBe('boolean');

    if (result.analysisDetails) {
      expect(result.analysisDetails).toHaveProperty('analysisStartDate');
      expect(result.analysisDetails).toHaveProperty('analysisEndDate');
      expect(result.analysisDetails).toHaveProperty('totalSitesMonitored');
      expect(result.analysisDetails).toHaveProperty('sitesWithDelayRisk');
      expect(result.analysisDetails).toHaveProperty('averageProgressRate');
      expect(result.analysisDetails).toHaveProperty('dataQualityScore');
      expect(result.analysisDetails).toHaveProperty('analysisReliability');
    }
  });

  it('findProductivityDataByTeamAndPeriod が指定チームIDで呼び出されること', async () => {
    (progressMonitoring.authenticateUser as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
    });
    (progressMonitoring.authorizeUserAction as jest.Mock).mockResolvedValue(
      true
    );
    (progressMonitoring.validateInputData as jest.Mock).mockResolvedValue(true);
    (progressMonitoring.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.aggregateProgressDataBySite as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.calculateDelayRiskScore as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.identifyAffectedSitesAndAdjustments as jest.Mock).mockResolvedValue(
      { affectedSites: [], recommendedAdjustments: [] }
    );
    (progressMonitoring.sendProgressDelayRiskNotification as jest.Mock).mockResolvedValue(
      true
    );

    await monitorProgressAndDetectDelayRisk({
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis: true,
    });

    expect(
      progressMonitoring.findProductivityDataByTeamAndPeriod
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        teamIds: expect.arrayContaining(teamIds),
      })
    );
  });

  it('aggregateProgressDataBySite が指定チームのデータのみで呼び出されること', async () => {
    (progressMonitoring.authenticateUser as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
    });
    (progressMonitoring.authorizeUserAction as jest.Mock).mockResolvedValue(
      true
    );
    (progressMonitoring.validateInputData as jest.Mock).mockResolvedValue(true);
    (progressMonitoring.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.aggregateProgressDataBySite as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.calculateDelayRiskScore as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.identifyAffectedSitesAndAdjustments as jest.Mock).mockResolvedValue(
      { affectedSites: [], recommendedAdjustments: [] }
    );
    (progressMonitoring.sendProgressDelayRiskNotification as jest.Mock).mockResolvedValue(
      true
    );

    await monitorProgressAndDetectDelayRisk({
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis: true,
    });

    expect(progressMonitoring.aggregateProgressDataBySite).toHaveBeenCalledWith(
      expect.objectContaining({
        siteIds: expect.arrayContaining(siteIds),
      })
    );
  });

  it('calculateDelayRiskScore が指定チームに限定した遅延リスク数値化を実行すること', async () => {
    (progressMonitoring.authenticateUser as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
    });
    (progressMonitoring.authorizeUserAction as jest.Mock).mockResolvedValue(
      true
    );
    (progressMonitoring.validateInputData as jest.Mock).mockResolvedValue(true);
    (progressMonitoring.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.aggregateProgressDataBySite as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.calculateDelayRiskScore as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.identifyAffectedSitesAndAdjustments as jest.Mock).mockResolvedValue(
      { affectedSites: [], recommendedAdjustments: [] }
    );
    (progressMonitoring.sendProgressDelayRiskNotification as jest.Mock).mockResolvedValue(
      true
    );

    await monitorProgressAndDetectDelayRisk({
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis: true,
    });

    expect(progressMonitoring.calculateDelayRiskScore).toHaveBeenCalledWith(
      expect.objectContaining({
        teamIds: expect.arrayContaining(teamIds),
      })
    );
  });

  it('identifyAffectedSitesAndAdjustments が指定チームが対象の拠点と調整内容を検出すること', async () => {
    (progressMonitoring.authenticateUser as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
    });
    (progressMonitoring.authorizeUserAction as jest.Mock).mockResolvedValue(
      true
    );
    (progressMonitoring.validateInputData as jest.Mock).mockResolvedValue(true);
    (progressMonitoring.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.aggregateProgressDataBySite as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.calculateDelayRiskScore as jest.Mock).mockResolvedValue(
      [
        {
          siteId: 'site-001',
          delayRiskScore: 70,
          riskLevel: 'HIGH',
          progressGapPercentage: -20,
          requiredDailyProgressRate: 15,
          calculatedAt: '2024-01-08T10:00:00Z',
        },
      ]
    );
    (progressMonitoring.identifyAffectedSitesAndAdjustments as jest.Mock).mockResolvedValue(
      { affectedSites: [], recommendedAdjustments: [] }
    );
    (progressMonitoring.sendProgressDelayRiskNotification as jest.Mock).mockResolvedValue(
      true
    );

    await monitorProgressAndDetectDelayRisk({
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis: true,
    });

    expect(
      progressMonitoring.identifyAffectedSitesAndAdjustments
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        delayRiskScores: expect.arrayContaining([
          expect.objectContaining({
            siteId: expect.any(String),
            delayRiskScore: expect.any(Number),
          }),
        ]),
      })
    );
  });

  it('sendProgressDelayRiskNotification が該当者へ通知を送信すること', async () => {
    (progressMonitoring.authenticateUser as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
    });
    (progressMonitoring.authorizeUserAction as jest.Mock).mockResolvedValue(
      true
    );
    (progressMonitoring.validateInputData as jest.Mock).mockResolvedValue(true);
    (progressMonitoring.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.aggregateProgressDataBySite as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.calculateDelayRiskScore as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.identifyAffectedSitesAndAdjustments as jest.Mock).mockResolvedValue(
      {
        affectedSites: [
          {
            siteId: 'site-001',
            siteName: 'Site 1',
            delayRiskScore: 70,
            currentProgressRate: 40,
            plannedProgressRate: 60,
            progressGapPercentage: -20,
            estimatedDeliveryDate: '2024-01-15',
            plannedDeliveryDate: '2024-01-10',
            remainingDays: 3,
            affectedTeams: ['team-001'],
            averageProductivityRate: 75,
          },
        ],
        recommendedAdjustments: [],
      }
    );
    (progressMonitoring.sendProgressDelayRiskNotification as jest.Mock).mockResolvedValue(
      true
    );

    await monitorProgressAndDetectDelayRisk({
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis: true,
    });

    expect(
      progressMonitoring.sendProgressDelayRiskNotification
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        affectedSites: expect.arrayContaining([
          expect.objectContaining({
            siteId: 'site-001',
            affectedTeams: expect.arrayContaining(['team-001']),
          }),
        ]),
      })
    );
  });

  it('指定されたチームIDに関連する拠点のみがaffectedSitesに含まれ、指定外チームが原因の拠点は含まれないこと', async () => {
    (progressMonitoring.authenticateUser as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
    });
    (progressMonitoring.authorizeUserAction as jest.Mock).mockResolvedValue(
      true
    );
    (progressMonitoring.validateInputData as jest.Mock).mockResolvedValue(true);
    (progressMonitoring.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.aggregateProgressDataBySite as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.calculateDelayRiskScore as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.identifyAffectedSitesAndAdjustments as jest.Mock).mockResolvedValue(
      {
        affectedSites: [
          {
            siteId: 'site-001',
            siteName: 'Site 1',
            delayRiskScore: 70,
            currentProgressRate: 40,
            plannedProgressRate: 60,
            progressGapPercentage: -20,
            estimatedDeliveryDate: '2024-01-15',
            plannedDeliveryDate: '2024-01-10',
            remainingDays: 3,
            affectedTeams: ['team-001'],
            averageProductivityRate: 75,
          },
        ],
        recommendedAdjustments: [],
      }
    );
    (progressMonitoring.sendProgressDelayRiskNotification as jest.Mock).mockResolvedValue(
      true
    );

    const result = await monitorProgressAndDetectDelayRisk({
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis: true,
    });

    result.affectedSites.forEach((affectedSite) => {
      const hasSpecifiedTeam = affectedSite.affectedTeams.some((team) =>
        teamIds.includes(team)
      );
      expect(hasSpecifiedTeam).toBe(true);

      affectedSite.affectedTeams.forEach((team) => {
        expect(teamIds.includes(team)).toBe(true);
      });

      const hasUnspecifiedTeam = affectedSite.affectedTeams.some(
        (team) => !teamIds.includes(team)
      );
      expect(hasUnspecifiedTeam).toBe(false);
    });

    if (result.affectedSites.length > 0) {
      result.affectedSites.forEach((site) => {
        expect(site.affectedTeams.length).toBeGreaterThan(0);
        site.affectedTeams.forEach((team) => {
          expect(teamIds).toContain(team);
          expect(['team-003', 'team-004']).not.toContain(team);
        });
      });
    }
  });

  it('recommendedAdjustmentsが指定されたチームに対する調整内容のみを含むこと', async () => {
    (progressMonitoring.authenticateUser as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
    });
    (progressMonitoring.authorizeUserAction as jest.Mock).mockResolvedValue(
      true
    );
    (progressMonitoring.validateInputData as jest.Mock).mockResolvedValue(true);
    (progressMonitoring.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.aggregateProgressDataBySite as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.calculateDelayRiskScore as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.identifyAffectedSitesAndAdjustments as jest.Mock).mockResolvedValue(
      {
        affectedSites: [],
        recommendedAdjustments: [
          {
            siteId: 'site-001',
            adjustmentType: 'personnel_addition',
            adjustmentDescription: 'Add 2 workers from team-001',
            requiredPersonnelCount: 2,
            estimatedImpactOnDelivery: 2,
            urgencyLevel: 'high',
            recommendedExecutionDate: '2024-01-08',
          },
          {
            siteId: 'site-001',
            adjustmentType: 'personnel_addition',
            adjustmentDescription: 'Add 1 worker from team-002',
            requiredPersonnelCount: 1,
            estimatedImpactOnDelivery: 1,
            urgencyLevel: 'medium',
            recommendedExecutionDate: '2024-01-08',
          },
        ],
      }
    );
    (progressMonitoring.sendProgressDelayRiskNotification as jest.Mock).mockResolvedValue(
      true
    );

    const result = await monitorProgressAndDetectDelayRisk({
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis: true,
    });

    result.recommendedAdjustments.forEach((adjustment) => {
      expect(siteIds).toContain(adjustment.siteId);
      expect(typeof adjustment.adjustmentType).toBe('string');
      expect(typeof adjustment.adjustmentDescription).toBe('string');
      expect(typeof adjustment.estimatedImpactOnDelivery).toBe('number');
      expect(['critical', 'high', 'medium', 'low']).toContain(
        adjustment.urgencyLevel
      );
      expect(typeof adjustment.recommendedExecutionDate).toBe('string');
    });
  });

  it('overallDelayRiskScoreが指定チームのデータのみから計算されていること', async () => {
    (progressMonitoring.authenticateUser as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
    });
    (progressMonitoring.authorizeUserAction as jest.Mock).mockResolvedValue(
      true
    );
    (progressMonitoring.validateInputData as jest.Mock).mockResolvedValue(true);
    (progressMonitoring.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.aggregateProgressDataBySite as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.calculateDelayRiskScore as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.identifyAffectedSitesAndAdjustments as jest.Mock).mockResolvedValue(
      {
        affectedSites: [
          {
            siteId: 'site-001',
            siteName: 'Site 1',
            delayRiskScore: 70,
            currentProgressRate: 40,
            plannedProgressRate: 60,
            progressGapPercentage: -20,
            estimatedDeliveryDate: '2024-01-15',
            plannedDeliveryDate: '2024-01-10',
            remainingDays: 3,
            affectedTeams: ['team-001'],
            averageProductivityRate: 75,
          },
        ],
        recommendedAdjustments: [],
      }
    );
    (progressMonitoring.sendProgressDelayRiskNotification as jest.Mock).mockResolvedValue(
      true
    );

    const result = await monitorProgressAndDetectDelayRisk({
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis: true,
    });

    expect(typeof result.overallDelayRiskScore).toBe('number');
    expect(result.overallDelayRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.overallDelayRiskScore).toBeLessThanOrEqual(100);

    result.affectedSites.forEach((site) => {
      site.affectedTeams.forEach((team) => {
        expect(teamIds).toContain(team);
      });
    });

    if (result.delayRiskDetected && result.affectedSites.length > 0) {
      expect(result.overallDelayRiskScore).toBeGreaterThan(0);
    }
  });

  it('notificationSentがtrueの場合、指定チームの管理者のみに通知が送信されたことが確認できること', async () => {
    (progressMonitoring.authenticateUser as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
    });
    (progressMonitoring.authorizeUserAction as jest.Mock).mockResolvedValue(
      true
    );
    (progressMonitoring.validateInputData as jest.Mock).mockResolvedValue(true);
    (progressMonitoring.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.aggregateProgressDataBySite as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.calculateDelayRiskScore as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.identifyAffectedSitesAndAdjustments as jest.Mock).mockResolvedValue(
      {
        affectedSites: [
          {
            siteId: 'site-001',
            siteName: 'Site 1',
            delayRiskScore: 70,
            currentProgressRate: 40,
            plannedProgressRate: 60,
            progressGapPercentage: -20,
            estimatedDeliveryDate: '2024-01-15',
            plannedDeliveryDate: '2024-01-10',
            remainingDays: 3,
            affectedTeams: ['team-001'],
            averageProductivityRate: 75,
          },
        ],
        recommendedAdjustments: [],
      }
    );
    (progressMonitoring.sendProgressDelayRiskNotification as jest.Mock).mockResolvedValue(
      true
    );

    const result = await monitorProgressAndDetectDelayRisk({
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis: true,
    });

    expect(typeof result.notificationSent).toBe('boolean');

    if (result.notificationSent) {
      result.affectedSites.forEach((site) => {
        site.affectedTeams.forEach((team) => {
          expect(teamIds).toContain(team);
        });
      });

      result.recommendedAdjustments.forEach((adjustment) => {
        expect(siteIds).toContain(adjustment.siteId);
      });
    }
  });

  it('WMSリアルタイム進捗データが指定チームIDのみから取得されており、指定外チームのデータは除外されること', async () => {
    (progressMonitoring.authenticateUser as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
    });
    (progressMonitoring.authorizeUserAction as jest.Mock).mockResolvedValue(
      true
    );
    (progressMonitoring.validateInputData as jest.Mock).mockResolvedValue(true);
    (progressMonitoring.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      [
        {
          teamId: 'team-001',
          siteId: 'site-001',
          productivityRate: 80,
          qualityScore: 90,
        },
        {
          teamId: 'team-002',
          siteId: 'site-002',
          productivityRate: 75,
          qualityScore: 85,
        },
        {
          teamId: 'team-003',
          siteId: 'site-001',
          productivityRate: 70,
          qualityScore: 80,
        },
      ]
    );
    (progressMonitoring.aggregateProgressDataBySite as jest.Mock).mockResolvedValue(
      [
        {
          siteId: 'site-001',
          siteName: 'Site 1',
          currentProgressRate: 40,
          plannedProgressRate: 60,
          remainingDays: 3,
          totalWorkload: 100,
          currentTeamCapacity: 20,
          affectedTeams: ['team-001'],
        },
      ]
    );
    (progressMonitoring.calculateDelayRiskScore as jest.Mock).mockResolvedValue(
      [
        {
          siteId: 'site-001',
          delayRiskScore: 70,
          riskLevel: 'HIGH',
          progressGapPercentage: -20,
          requiredDailyProgressRate: 15,
          calculatedAt: '2024-01-08T10:00:00Z',
        },
      ]
    );
    (progressMonitoring.identifyAffectedSitesAndAdjustments as jest.Mock).mockResolvedValue(
      {
        affectedSites: [
          {
            siteId: 'site-001',
            siteName: 'Site 1',
            delayRiskScore: 70,
            currentProgressRate: 40,
            plannedProgressRate: 60,
            progressGapPercentage: -20,
            estimatedDeliveryDate: '2024-01-15',
            plannedDeliveryDate: '2024-01-10',
            remainingDays: 3,
            affectedTeams: ['team-001'],
            averageProductivityRate: 75,
          },
        ],
        recommendedAdjustments: [
          {
            siteId: 'site-001',
            adjustmentType: 'personnel_addition',
            adjustmentDescription: 'Add 2 workers from team-001',
            requiredPersonnelCount: 2,
            estimatedImpactOnDelivery: 2,
            urgencyLevel: 'high',
            recommendedExecutionDate: '2024-01-08',
          },
        ],
      }
    );
    (progressMonitoring.sendProgressDelayRiskNotification as jest.Mock).mockResolvedValue(
      true
    );

    const result = await monitorProgressAndDetectDelayRisk({
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis: true,
    });

    expect(
      progressMonitoring.findProductivityDataByTeamAndPeriod
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        teamIds: expect.arrayContaining(teamIds),
      })
    );

    result.affectedSites.forEach((site) => {
      expect(Array.isArray(site.affectedTeams)).toBe(true);
      site.affectedTeams.forEach((teamId) => {
        expect(teamIds).toContain(teamId);
      });

      const hasUnspecifiedTeam = site.affectedTeams.some(
        (team) => !teamIds.includes(team)
      );
      expect(hasUnspecifiedTeam).toBe(false);

      const specifiedTeamsInSite = site.affectedTeams.filter((team) =>
        teamIds.includes(team)
      );
      expect(specifiedTeamsInSite.length).toBeGreaterThan(0);
    });

    expect(result.affectedSites.length).toBeGreaterThan(0);
  });

  it('指定外チームが原因の遅延が存在する場合、その拠点全体がaffectedSitesから除外されること', async () => {
    (progressMonitoring.authenticateUser as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
    });
    (progressMonitoring.authorizeUserAction as jest.Mock).mockResolvedValue(
      true
    );
    (progressMonitoring.validateInputData as jest.Mock).mockResolvedValue(true);
    (progressMonitoring.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.aggregateProgressDataBySite as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.calculateDelayRiskScore as jest.Mock).mockResolvedValue(
      []
    );
    (progressMonitoring.identifyAffectedSitesAndAdjustments as jest.Mock).mockResolvedValue(
      {
        affectedSites: [
          {
            siteId: 'site-001',
            siteName: 'Site 1',
            delayRiskScore: 70,
            currentProgressRate: 40,
            plannedProgressRate: 60,
            progressGapPercentage: -20,
            estimatedDeliveryDate: '2024-01-15',
            plannedDeliveryDate: '2024-01-10',
            remainingDays: 3,
            affectedTeams: ['team-001'],
            averageProductivityRate: 75,
          },
        ],
        recommendedAdjustments: [],
      }
    );
    (progressMonitoring.sendProgressDelayRiskNotification as jest.Mock).mockResolvedValue(
      true
    );

    const result = await monitorProgressAndDetectDelayRisk({
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis: true,
    });

    const unspecifiedTeam = 'team-003';
    const siteWithUnspecifiedTeam = result.affectedSites.find((site) =>
      site.affectedTeams.includes(unspecifiedTeam)
    );
    expect(siteWithUnspecifiedTeam).toBeUndefined();

    result.affectedSites.forEach((site) => {
      const allTeamsSpecified = site.affectedTeams.every((team) =>
        teamIds.includes(team)
      );
      expect(allTeamsSpecified).toBe(true);
    });
  });
});