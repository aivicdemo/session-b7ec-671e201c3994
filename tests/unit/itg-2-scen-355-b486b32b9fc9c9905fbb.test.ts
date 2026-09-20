import { analyzeBusyPeriodProductivityAndProposePlacement } from '../../src/logic/busy-period-productivity-analysis';
import * as busyPeriodModule from '../../src/logic/busy-period-productivity-analysis';

describe('SCEN-355: 最適人員配置案の生成に失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should propagate PlacementProposalGenerationError when optimal placement proposal generation fails', async () => {
    // Arrange
    const targetTeamIds = ['team-001', 'team-002'];
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-31T23:59:59Z';
    const currentProgressDataSnapshot = {
      orders: {
        total: 1000,
        completed: 500,
      },
      inventory: {
        current: 2000,
        reserved: 1500,
      },
      shipments: {
        scheduled: 800,
        completed: 400,
      },
    };
    const requestedByUserId = 'user-admin-001';

    const placementProposalGenerationError = new Error('配置案の生成に失敗しました。スキルマッチ度や作業負荷データを確認してください。');
    (placementProposalGenerationError as any).name = 'PlacementProposalGenerationError';

    // Mock aggregateMultiTeamProgressAndProductivityData - called once for multiple teams
    jest.spyOn(busyPeriodModule, 'aggregateMultiTeamProgressAndProductivityData' as any).mockResolvedValue({
      teamProgressSummary: [
        {
          teamId: 'team-001',
          progressRate: 45,
          completedCount: 450,
          delayRiskLevel: 'high',
          activeWorkerCount: 5,
        },
        {
          teamId: 'team-002',
          progressRate: 50,
          completedCount: 500,
          delayRiskLevel: 'medium',
          activeWorkerCount: 6,
        },
      ],
      workerProductivityData: [
        {
          workerId: 'worker-001',
          teamId: 'team-001',
          averageProductivityRate: 85,
          qualityScore: 90,
          proficiencyLevel: 'intermediate',
          workTypeDistribution: { 'work-type-001': 50 },
        },
        {
          workerId: 'worker-002',
          teamId: 'team-001',
          averageProductivityRate: 75,
          qualityScore: 85,
          proficiencyLevel: 'beginner',
          workTypeDistribution: { 'work-type-001': 40 },
        },
        {
          workerId: 'worker-003',
          teamId: 'team-002',
          averageProductivityRate: 80,
          qualityScore: 88,
          proficiencyLevel: 'intermediate',
          workTypeDistribution: { 'work-type-002': 60 },
        },
      ],
      aggregatedAt: new Date().toISOString(),
    });

    // Mock analyzeProductivityPatternsByWorkerAndWorkType for all workers
    jest.spyOn(busyPeriodModule, 'analyzeProductivityPatternsByWorkerAndWorkType' as any).mockResolvedValue({
      workerId: 'worker-001',
      analysisExecutedAt: new Date().toISOString(),
      workTypePatterns: [
        {
          workTypeId: 'work-type-001',
          workTypeName: '組立',
          averageProcessingTimeMinutes: 30,
          averageCompletionCount: 20,
          averageErrorRate: 0.05,
          proficiencyDegree: 'proficient',
          executionCount: 15,
        },
      ],
      overallProductivityTrend: {
        trendDirection: 'stable',
        changePercentage: 0,
        averageProductivityRate: 0.85,
      },
      strengthWorkTypes: ['work-type-001'],
      comparisonBasis: {
        standardProcessingTimeMinutes: 30,
        expectedDailyCompletionCount: 20,
        acceptableErrorRateThreshold: 0.05,
      },
      dataQualityIndicator: 'sufficient',
    });

    // Mock calculateProgressDelayRiskForMultipleTeams
    jest.spyOn(busyPeriodModule, 'calculateProgressDelayRiskForMultipleTeams' as any).mockResolvedValue([
      {
        teamId: 'team-001',
        siteId: 'site-001',
        currentProgressRate: 45,
        remainingTimeHours: 240,
        requiredProgressRatePerHour: 2.3,
        delayRiskScore: 75,
        delayRiskLevel: 'HIGH',
        responseUrgency: 'URGENT',
        calculatedAt: new Date().toISOString(),
      },
      {
        teamId: 'team-002',
        siteId: 'site-001',
        currentProgressRate: 50,
        remainingTimeHours: 240,
        requiredProgressRatePerHour: 2.08,
        delayRiskScore: 65,
        delayRiskLevel: 'MEDIUM',
        responseUrgency: 'URGENT',
        calculatedAt: new Date().toISOString(),
      },
    ]);

    // Mock generateOptimalPlacementProposalForBusyPeriod to throw PlacementProposalGenerationError
    const generateOptimalPlacementProposalSpy = jest.spyOn(busyPeriodModule, 'generateOptimalPlacementProposalForBusyPeriod' as any).mockRejectedValue(placementProposalGenerationError);

    // Act & Assert
    await expect(analyzeBusyPeriodProductivityAndProposePlacement({
      targetTeamIds,
      analysisStartDate,
      analysisEndDate,
      currentProgressDataSnapshot,
      requestedByUserId,
    })).rejects.toMatchObject({
      name: 'PlacementProposalGenerationError',
      message: '配置案の生成に失敗しました。スキルマッチ度や作業負荷データを確認してください。',
    });

    // Verify that generateOptimalPlacementProposalForBusyPeriod stub was called
    expect(generateOptimalPlacementProposalSpy).toHaveBeenCalled();
  });
});