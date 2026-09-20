import { runTx5Imp2Agent } from '../../src/agents/tx-5-imp-2/orchestrator';
import { Tx5Imp2AgentInput, Tx5Imp2AgentOutput } from '../../src/agents/tx-5-imp-2/orchestrator';

describe('SCEN-079: 初期割当推奨の実行直後、実績データ自動収集を開始して習熟度監視フェーズに遷移する', () => {
  let input: Tx5Imp2AgentInput;

  beforeEach(() => {
    const now = new Date();
    const assignmentStartDate = now.toISOString();

    input = {
      newAssigneeId: 'worker-001',
      aptitudeTestResult: {
        score: 85,
        strongAreas: ['組立', '検査'],
        recommendedRoles: ['初級組立工'],
        weakAreas: ['梱包'],
      },
      assignmentStartDate: assignmentStartDate,
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'manual_onboarding',
    };
  });

  it('初期割当推奨直後、習熟度監視フェーズへ遷移し、実績データ自動収集を開始する', async () => {
    const result: Tx5Imp2AgentOutput = await runTx5Imp2Agent(
      { performanceDataRepository: {} as any },
      {
        validateInputData: async () => ({ isValid: true }),
        findWorkerById: async () => ({
          id: 'worker-001',
          name: 'テスト作業者',
        }),
        analyzeOnboardingContextAndExtractPeerPerformancePatterns: async () => ({
          peerPatterns: [
            {
              workTypeId: 'wt-001',
              workTypeName: '組立',
              averageProductivityRate: 75,
              averageQualityScore: 85,
              averageTimeToThreshold: 20,
            },
          ],
        }),
        analyzeInitialAssignmentPerformance: async () => ({
          recommendedWorkTypeId: 'wt-001',
          recommendedWorkTypeName: '組立',
          recommendedDepartmentId: 'dept-001',
          recommendationReason: '過去類似者の適性分析に基づき、組立業務の初期割当を推奨',
          peerPerformancePatterns: [
            {
              workTypeId: 'wt-001',
              workTypeName: '組立',
              averageProductivityRate: 75,
              averageQualityScore: 85,
              averageTimeToThreshold: 20,
            },
          ],
          expectedProficiencyReachDays: 20,
        }),
        sendInitialAssignmentPerformanceAnalysisToLeader: async () => ({
          notificationSent: true,
        }),
        aggregatePerformanceDataByPeriod: async () => ({
          currentProficiencyLevel: 45,
          proficiencyTrendPercentage: 0,
          daysIntoMonitoring: 0,
          projectedThresholdReachDate: new Date(
            Date.now() + 20 * 24 * 60 * 60 * 1000
          ).toISOString(),
          recentPerformanceMetrics: [],
        }),
        notifyAdminAndLeaderOfMonitoringStart: async () => ({
          notificationSent: true,
        }),
      } as any
    );

    expect(result.phase).toBe('monitoring_in_progress');
    expect(result.initialAssignmentRecommendation).toBeNull();
    expect(result.monitoringStatus).not.toBeNull();
    expect(result.monitoringStatus?.currentProficiencyLevel).toBeDefined();
    expect(result.monitoringStatus?.daysIntoMonitoring).toBeDefined();
    expect(result.difficultyAdjustmentRecommendation).toBeNull();
    expect(result.monitoringCompletionSummary).toBeNull();
    expect(result.notificationSent).toBe(true);
    expect(result.executionTimestamp).toBeDefined();
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
    expect(result.errors).toBeUndefined();
  });

  it('monitoringStatusに実績データ自動収集の初期状態が含まれる', async () => {
    const result: Tx5Imp2AgentOutput = await runTx5Imp2Agent(
      { performanceDataRepository: {} as any },
      {
        validateInputData: async () => ({ isValid: true }),
        findWorkerById: async () => ({
          id: 'worker-001',
          name: 'テスト作業者',
        }),
        analyzeOnboardingContextAndExtractPeerPerformancePatterns: async () => ({
          peerPatterns: [],
        }),
        analyzeInitialAssignmentPerformance: async () => ({
          recommendedWorkTypeId: 'wt-001',
          recommendedWorkTypeName: '組立',
          recommendedDepartmentId: 'dept-001',
          recommendationReason: '初期割当推奨',
          peerPerformancePatterns: [],
          expectedProficiencyReachDays: 20,
        }),
        sendInitialAssignmentPerformanceAnalysisToLeader: async () => ({
          notificationSent: true,
        }),
        aggregatePerformanceDataByPeriod: async () => ({
          currentProficiencyLevel: 40,
          proficiencyTrendPercentage: 0,
          daysIntoMonitoring: 0,
          projectedThresholdReachDate: new Date(
            Date.now() + 20 * 24 * 60 * 60 * 1000
          ).toISOString(),
          recentPerformanceMetrics: [],
        }),
        notifyAdminAndLeaderOfMonitoringStart: async () => ({
          notificationSent: true,
        }),
      } as any
    );

    expect(result.monitoringStatus).not.toBeNull();
    if (result.monitoringStatus) {
      expect(result.monitoringStatus.currentProficiencyLevel).toBeGreaterThanOrEqual(0);
      expect(result.monitoringStatus.currentProficiencyLevel).toBeLessThanOrEqual(100);
      expect(result.monitoringStatus.daysIntoMonitoring).toBe(0);
      expect(result.monitoringStatus.proficiencyTrendPercentage).toBeDefined();
      expect(result.monitoringStatus.projectedThresholdReachDate).toBeDefined();
      expect(result.monitoringStatus.recentPerformanceMetrics).toBeDefined();
      expect(Array.isArray(result.monitoringStatus.recentPerformanceMetrics)).toBe(true);
    }
  });

  it('通知送信フラグがtrueである', async () => {
    const result: Tx5Imp2AgentOutput = await runTx5Imp2Agent(
      { performanceDataRepository: {} as any },
      {
        validateInputData: async () => ({ isValid: true }),
        findWorkerById: async () => ({
          id: 'worker-001',
          name: 'テスト作業者',
        }),
        analyzeOnboardingContextAndExtractPeerPerformancePatterns: async () => ({
          peerPatterns: [],
        }),
        analyzeInitialAssignmentPerformance: async () => ({
          recommendedWorkTypeId: 'wt-001',
          recommendedWorkTypeName: '組立',
          recommendedDepartmentId: 'dept-001',
          recommendationReason: '初期割当推奨',
          peerPerformancePatterns: [],
          expectedProficiencyReachDays: 20,
        }),
        sendInitialAssignmentPerformanceAnalysisToLeader: async () => ({
          notificationSent: true,
        }),
        aggregatePerformanceDataByPeriod: async () => ({
          currentProficiencyLevel: 45,
          proficiencyTrendPercentage: 0,
          daysIntoMonitoring: 0,
          projectedThresholdReachDate: new Date(
            Date.now() + 20 * 24 * 60 * 60 * 1000
          ).toISOString(),
          recentPerformanceMetrics: [],
        }),
        notifyAdminAndLeaderOfMonitoringStart: async () => ({
          notificationSent: true,
        }),
      } as any
    );

    expect(result.notificationSent).toBe(true);
  });

  it('executionTimestampが有効なISO 8601形式である', async () => {
    const result: Tx5Imp2AgentOutput = await runTx5Imp2Agent(
      { performanceDataRepository: {} as any },
      {
        validateInputData: async () => ({ isValid: true }),
        findWorkerById: async () => ({
          id: 'worker-001',
          name: 'テスト作業者',
        }),
        analyzeOnboardingContextAndExtractPeerPerformancePatterns: async () => ({
          peerPatterns: [],
        }),
        analyzeInitialAssignmentPerformance: async () => ({
          recommendedWorkTypeId: 'wt-001',
          recommendedWorkTypeName: '組立',
          recommendedDepartmentId: 'dept-001',
          recommendationReason: '初期割当推奨',
          peerPerformancePatterns: [],
          expectedProficiencyReachDays: 20,
        }),
        sendInitialAssignmentPerformanceAnalysisToLeader: async () => ({
          notificationSent: true,
        }),
        aggregatePerformanceDataByPeriod: async () => ({
          currentProficiencyLevel: 50,
          proficiencyTrendPercentage: 0,
          daysIntoMonitoring: 0,
          projectedThresholdReachDate: new Date(
            Date.now() + 20 * 24 * 60 * 60 * 1000
          ).toISOString(),
          recentPerformanceMetrics: [],
        }),
        notifyAdminAndLeaderOfMonitoringStart: async () => ({
          notificationSent: true,
        }),
      } as any
    );

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.executionTimestamp).toMatch(isoDateRegex);
    expect(() => new Date(result.executionTimestamp)).not.toThrow();
  });

  it('エラーフィールドが存在しないか空配列である', async () => {
    const result: Tx5Imp2AgentOutput = await runTx5Imp2Agent(
      { performanceDataRepository: {} as any },
      {
        validateInputData: async () => ({ isValid: true }),
        findWorkerById: async () => ({
          id: 'worker-001',
          name: 'テスト作業者',
        }),
        analyzeOnboardingContextAndExtractPeerPerformancePatterns: async () => ({
          peerPatterns: [],
        }),
        analyzeInitialAssignmentPerformance: async () => ({
          recommendedWorkTypeId: 'wt-001',
          recommendedWorkTypeName: '組立',
          recommendedDepartmentId: 'dept-001',
          recommendationReason: '初期割当推奨',
          peerPerformancePatterns: [],
          expectedProficiencyReachDays: 20,
        }),
        sendInitialAssignmentPerformanceAnalysisToLeader: async () => ({
          notificationSent: true,
        }),
        aggregatePerformanceDataByPeriod: async () => ({
          currentProficiencyLevel: 50,
          proficiencyTrendPercentage: 0,
          daysIntoMonitoring: 0,
          projectedThresholdReachDate: new Date(
            Date.now() + 20 * 24 * 60 * 60 * 1000
          ).toISOString(),
          recentPerformanceMetrics: [],
        }),
        notifyAdminAndLeaderOfMonitoringStart: async () => ({
          notificationSent: true,
        }),
      } as any
    );

    if (result.errors !== undefined) {
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors.length).toBe(0);
    }
  });
});