import { runTx5Imp2Agent } from '../../src/agents/tx-5-imp-2/orchestrator';
import { Tx5Imp2AgentInput } from '../../src/agents/tx-5-imp-2/orchestrator';

describe('SCEN-075: 新配属者の基本情報・適性テスト結果・過去類似者パターンから初期割当業務を推奨し、管理者に通知する', () => {
  it('新配属者の基本情報・適性テスト結果・過去類似者パターンを分析して初期割当業務を推奨し、管理者に通知する', async () => {
    const input: Tx5Imp2AgentInput = {
      newAssigneeId: 'A001',
      aptitudeTestResult: {
        score: 85,
        得意分野: ['ピッキング', '検品'],
        推奨職務: 'warehouse_picker',
      },
      assignmentStartDate: '2025-01-15',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'manual_onboarding',
    };

    const result = await runTx5Imp2Agent(input, {
      validateInputData: async () => true,
      findWorkerById: async () => ({
        作業者ID: 'A001',
        作業者名: 'テスト太郎',
        拠点ID: 'site-001',
        チームID: 'team-001',
        職種: 'warehouse_picker',
        稼働状況: '稼働中',
      }),
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: async () => ({
        recommendedWorkTypeId: 'wt-001',
        recommendedWorkTypeName: 'ピッキング業務',
        recommendedDepartmentId: 'dept-001',
        recommendationReason: '適性テスト結果から得意分野がピッキング・検品であり、過去類似者のパターンと一致。初期段階ではピッキング業務から開始することが最適と判断',
        peerPerformancePatterns: [
          {
            workTypeId: 'wt-001',
            workTypeName: 'ピッキング業務',
            averageProductivityRate: 92,
            averageQualityScore: 88,
            averageTimeToThreshold: 14,
          },
          {
            workTypeId: 'wt-002',
            workTypeName: '検品業務',
            averageProductivityRate: 85,
            averageQualityScore: 91,
            averageTimeToThreshold: 18,
          },
        ],
        expectedProficiencyReachDays: 15,
      }),
      analyzeInitialAssignmentPerformance: async () => ({
        recommendedWorkTypeId: 'wt-001',
        recommendedWorkTypeName: 'ピッキング業務',
        recommendedDepartmentId: 'dept-001',
        recommendationReason: '適性テスト結果から得意分野がピッキング・検品であり、過去類似者のパターンと一致。初期段階ではピッキング業務から開始することが最適と判断',
        peerPerformancePatterns: [
          {
            workTypeId: 'wt-001',
            workTypeName: 'ピッキング業務',
            averageProductivityRate: 92,
            averageQualityScore: 88,
            averageTimeToThreshold: 14,
          },
        ],
        expectedProficiencyReachDays: 15,
      }),
      sendInitialAssignmentPerformanceAnalysisToLeader: async () => true,
      sendOnboardingAnalysisResultToManager: async () => true,
    });

    expect(result.phase).toBe('initial_assignment_recommendation');
    expect(result.initialAssignmentRecommendation).not.toBeNull();
    expect(result.initialAssignmentRecommendation?.recommendedWorkTypeId).toBe('wt-001');
    expect(result.initialAssignmentRecommendation?.recommendedWorkTypeName).toBe('ピッキング業務');
    expect(result.monitoringStatus).toBeNull();
    expect(result.difficultyAdjustmentRecommendation).toBeNull();
    expect(result.monitoringCompletionSummary).toBeNull();
    expect(result.notificationSent).toBe(true);
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );
    expect(result.errors).toEqual([]);
  });
});