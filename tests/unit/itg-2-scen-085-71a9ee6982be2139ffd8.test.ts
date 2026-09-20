import { runTx5Imp2Agent, Tx5Imp2AgentInput } from '../../src/agents/tx-5-imp-2/orchestrator';

describe('SCEN-085: 推奨された初期割当業務が実行不可能な場合のエラー処理', () => {
  it('推奨された初期割当業務が実行不可能な場合、別の業務を検討するよう指示するエラーを返す', async () => {
    // テストケースの前提条件を設定
    const newAssigneeId = 'NEW-001';
    const testInput: Tx5Imp2AgentInput = {
      newAssigneeId,
      aptitudeTestResult: {
        score: 85,
        strongAreas: ['作業タイプA', '作業タイプB'],
        recommendedPositions: ['初級', '中級'],
        testDate: '2024-01-15',
      },
      assignmentStartDate: new Date().toISOString(),
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'manual_onboarding',
    };

    // runTx5Imp2Agentを呼び出す
    // 第2パラメータはTx5Imp2AiClientの構造を持つオブジェクト（仕様で要求される型構造）
    const result = await runTx5Imp2Agent(testInput, {
      validateInputData: async () => ({ valid: true }),
      findWorkerById: async () => ({
        workerId: 'NEW-001',
        workerName: '新配属者',
        department: 'DEP-001',
        skillLevel: 1,
      }),
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: async () => ({
        recommendedWorkTypeId: 'DISCONTINUED_TASK_TYPE',
        recommendedWorkTypeName: '廃止済み作業タイプ',
        recommendedDepartmentId: 'CLOSED_DIVISION',
        recommendationReason: '過去類似者の実績から推奨',
        peerPerformancePatterns: [
          {
            workTypeId: 'DISCONTINUED_TASK_TYPE',
            workTypeName: '廃止済み作業タイプ',
            averageProductivityRate: 80,
            averageQualityScore: 85,
            averageTimeToThreshold: 15,
          },
        ],
        expectedProficiencyReachDays: 15,
      }),
      analyzeInitialAssignmentPerformance: async () => ({
        recommendedWorkTypeId: 'DISCONTINUED_TASK_TYPE',
        recommendedWorkTypeName: '廃止済み作業タイプ',
        recommendedDepartmentId: 'CLOSED_DIVISION',
        recommendationReason: '過去類似者の実績から推奨',
        peerPerformancePatterns: [
          {
            workTypeId: 'DISCONTINUED_TASK_TYPE',
            workTypeName: '廃止済み作業タイプ',
            averageProductivityRate: 80,
            averageQualityScore: 85,
            averageTimeToThreshold: 15,
          },
        ],
        expectedProficiencyReachDays: 15,
      }),
      validateAssignmentFeasibility: async (recommendation) => {
        // 実行可能性チェック：廃止済み作業タイプまたは閉鎖部門の場合は不可能と判定
        const isFeasible = !(
          recommendation.recommendedWorkTypeId === 'DISCONTINUED_TASK_TYPE' ||
          recommendation.recommendedDepartmentId === 'CLOSED_DIVISION'
        );
        return { feasible: isFeasible };
      },
      collectPerformanceMetrics: async () => ({
        currentProficiencyLevel: 50,
        proficiencyTrendPercentage: 5,
        daysIntoMonitoring: 7,
        projectedThresholdReachDate: null,
        recentPerformanceMetrics: [],
      }),
      notifyAdministrator: async () => undefined,
    } as any);

    // 戻り値のphaseが'initial_assignment_recommendation'であることを確認
    expect(result.phase).toBe('initial_assignment_recommendation');

    // 戻り値のerrorsフィールドに設計済みエラー'InvalidInitialAssignmentError'が含まれていることを確認
    expect(result.errors).toBeDefined();
    expect(result.errors).not.toHaveLength(0);
    const invalidAssignmentError = result.errors?.find(
      (error) => error.code === 'InvalidInitialAssignmentError'
    );
    expect(invalidAssignmentError).toBeDefined();

    // エラーオブジェクトのcodeフィールドが'InvalidInitialAssignmentError'であることを確認
    expect(invalidAssignmentError?.code).toBe('InvalidInitialAssignmentError');

    // エラーオブジェクトのmessageフィールドが期待される文言と一致することを確認
    expect(invalidAssignmentError?.message).toBe(
      '推奨された初期割当業務が実行できません。別の業務を検討してください。'
    );

    // initialAssignmentRecommendationがnullではなく、推奨業務情報を保持していることを確認
    expect(result.initialAssignmentRecommendation).not.toBeNull();
    expect(result.initialAssignmentRecommendation?.recommendedWorkTypeId).toBe(
      'DISCONTINUED_TASK_TYPE'
    );
    expect(result.initialAssignmentRecommendation?.recommendedDepartmentId).toBe(
      'CLOSED_DIVISION'
    );

    // notificationSentがfalseであることを確認（管理者への通知は送信されない）
    expect(result.notificationSent).toBe(false);
  });
});