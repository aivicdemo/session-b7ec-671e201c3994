import { runTx5Imp2Agent } from '../../src/agents/tx-5-imp-2/orchestrator';
import { Tx5Imp2AgentInput, Tx5Imp2AgentOutput } from '../../src/agents/tx-5-imp-2/orchestrator';

describe('SCEN-088: トリガーが manual_onboarding の場合、初期割当推奨フェーズから開始する', () => {
  it('manual_onboarding トリガーで初期割当推奨フェーズが返される', async () => {
    // Arrange: 新配属者ID、適性テスト結果、配属開始日を含む入力データを準備する
    const input: Tx5Imp2AgentInput = {
      newAssigneeId: '550e8400-e29b-41d4-a716-446655440001',
      aptitudeTestResult: {
        score: 85,
        strongAreas: ['assembly', 'quality_control'],
        recommendedRoles: ['assembly_lead', 'quality_inspector'],
      },
      assignmentStartDate: '2024-01-15T00:00:00Z',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'manual_onboarding',
    };

    // Act: runTx5Imp2Agent処理に入力データを渡して実行する
    const result: Tx5Imp2AgentOutput = await runTx5Imp2Agent(input, {
      validateInputData: async () => true,
      findWorkerById: async () => ({
        workerId: input.newAssigneeId,
        workerName: 'Test Worker',
      }),
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: async () => ({
        peerPerformancePatterns: [
          {
            workTypeId: 'wt-001',
            workTypeName: 'Assembly Work',
            averageProductivityRate: 78,
            averageQualityScore: 82,
            averageTimeToThreshold: 28,
          },
          {
            workTypeId: 'wt-002',
            workTypeName: 'Quality Control',
            averageProductivityRate: 81,
            averageQualityScore: 85,
            averageTimeToThreshold: 25,
          },
        ],
      }),
      notifyManager: async () => true,
    });

    // Assert: 戻り値の出力型Tx5Imp2AgentOutputを検証する
    expect(result).toBeDefined();
    expect(result.phase).toBe('initial_assignment_recommendation');
    expect(result.initialAssignmentRecommendation).not.toBeNull();
    expect(result.initialAssignmentRecommendation).toHaveProperty('recommendedWorkTypeId');
    expect(result.initialAssignmentRecommendation).toHaveProperty('recommendedWorkTypeName');
    expect(result.initialAssignmentRecommendation).toHaveProperty('recommendedDepartmentId');
    expect(result.initialAssignmentRecommendation).toHaveProperty('recommendationReason');
    expect(result.initialAssignmentRecommendation).toHaveProperty('peerPerformancePatterns');
    expect(result.initialAssignmentRecommendation).toHaveProperty('expectedProficiencyReachDays');
    expect(result.notificationSent).toBe(true);
    expect(result.executionTimestamp).toBeDefined();
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.errors).toEqual([]);
    expect(result.monitoringStatus).toBeNull();
    expect(result.difficultyAdjustmentRecommendation).toBeNull();
    expect(result.monitoringCompletionSummary).toBeNull();
  });
});