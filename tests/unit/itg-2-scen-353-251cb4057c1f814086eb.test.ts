import { analyzeBusyPeriodProductivityAndProposePlacement } from '../../src/logic/busy-period-productivity-analysis';
import * as module from '../../src/logic/busy-period-productivity-analysis';

// Mock the internal functions
jest.mock('../../src/logic/busy-period-productivity-analysis', () => {
  const actual = jest.requireActual('../../src/logic/busy-period-productivity-analysis');
  return {
    ...actual,
    aggregateMultiTeamProgressAndProductivityData: jest.fn(),
    analyzeProductivityPatternsByWorkerAndWorkType: jest.fn(),
    calculateProgressDelayRiskForMultipleTeams: jest.fn(),
    generateOptimalPlacementProposalForBusyPeriod: jest.fn(),
    generateWorkDifficultyAdjustmentRecommendation: jest.fn(),
    sendBusyPeriodPlacementProposal: jest.fn(),
    analyzeBusyPeriodProductivityAndProposePlacement: actual.analyzeBusyPeriodProductivityAndProposePlacement,
  };
});

describe('SCEN-353: ProductivityPatternAnalysisFailureError発生時の動作', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('作業者個人の生産性パターン分析に失敗した場合、ProductivityPatternAnalysisFailureErrorが発生する', async () => {
    // ステップ1: 入力データを準備
    const input = {
      targetTeamIds: ['TEAM001', 'TEAM002'],
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      currentProgressDataSnapshot: {
        teams: [
          {
            teamId: 'TEAM001',
            progressRate: 45,
            completedCount: 100,
            delayRiskLevel: 'high',
            activeWorkerCount: 5,
          },
          {
            teamId: 'TEAM002',
            progressRate: 60,
            completedCount: 150,
            delayRiskLevel: 'medium',
            activeWorkerCount: 6,
          },
        ],
      },
      requestedByUserId: 'USER123',
    };

    // ステップ2: aggregateMultiTeamProgressAndProductivityData をスタブ設定
    const aggregateResult = {
      teamProgressSummary: [
        {
          teamId: 'TEAM001',
          progressRate: 45,
          completedCount: 100,
          delayRiskLevel: 'high',
          activeWorkerCount: 5,
        },
        {
          teamId: 'TEAM002',
          progressRate: 60,
          completedCount: 150,
          delayRiskLevel: 'medium',
          activeWorkerCount: 6,
        },
      ],
      workerProductivityData: [
        {
          workerId: 'WORKER001',
          teamId: 'TEAM001',
          averageProductivityRate: 85,
          qualityScore: 90,
          proficiencyLevel: 'intermediate',
          workTypeDistribution: { 'WORK001': 10 },
        },
        {
          workerId: 'WORKER002',
          teamId: 'TEAM001',
          averageProductivityRate: 75,
          qualityScore: 85,
          proficiencyLevel: 'beginner',
          workTypeDistribution: { 'WORK001': 8 },
        },
      ],
      aggregatedAt: '2024-01-31T23:59:59Z',
    };

    (module.aggregateMultiTeamProgressAndProductivityData as jest.Mock).mockResolvedValue(
      aggregateResult
    );

    // ステップ3: analyzeProductivityPatternsByWorkerAndWorkType を例外発生に設定
    const analysisError = new Error('生産性パターン分析に失敗しました。データの整合性を確認してください。');
    Object.defineProperty(analysisError, 'name', {
      value: 'ProductivityPatternAnalysisFailureError',
      writable: false,
    });

    (module.analyzeProductivityPatternsByWorkerAndWorkType as jest.Mock).mockRejectedValue(
      analysisError
    );

    // ステップ4: その他のスタブを正常系に設定（呼ばれない想定だが念のため）
    (module.calculateProgressDelayRiskForMultipleTeams as jest.Mock).mockResolvedValue({
      results: [],
    });
    (module.generateOptimalPlacementProposalForBusyPeriod as jest.Mock).mockResolvedValue({
      placementProposals: [],
      proposalGeneratedAt: '2024-01-31T23:59:59Z',
      expectedProductivityImprovement: 0,
      riskMitigationLevel: 'low',
    });
    (module.generateWorkDifficultyAdjustmentRecommendation as jest.Mock).mockResolvedValue({
      recommendations: [],
    });
    (module.sendBusyPeriodPlacementProposal as jest.Mock).mockResolvedValue(true);

    // ステップ5: 関数を呼び出す
    let caughtError: any;
    let result: any;
    try {
      result = await analyzeBusyPeriodProductivityAndProposePlacement(input);
    } catch (error) {
      caughtError = error;
    }

    // ステップ6: 発生した例外を検証
    expect(caughtError).toBeDefined();
    expect(caughtError.name).toBe('ProductivityPatternAnalysisFailureError');
    expect(caughtError.message).toBe(
      '生産性パターン分析に失敗しました。データの整合性を確認してください。'
    );

    // 戻り値が返されていないことを確認（例外で終了）
    expect(result).toBeUndefined();
    expect(caughtError).toBeInstanceOf(Error);
  });
});