import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { Tx5Imp1AgentInput, Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-063: 推定習熟日数が負数またはNaNの場合、InitialAssignmentGenerationFailureErrorが発生する', () => {
  const validInput: Tx5Imp1AgentInput = {
    newAssigneeWorkerId: 'worker-001',
    jobClassification: 'assembly',
    assignedSiteId: 'site-001',
    assignedTeamId: 'team-001',
    assignedDepartmentId: 'dept-001',
    assignmentStartDate: '2024-01-15T00:00:00Z',
    executingUserId: 'admin-001',
    historicalDataLookbackDays: 90,
  };

  it('should return failure when estimatedProficiencyDays is negative', async () => {
    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(validInput, {
      authenticateUser: async () => ({ isValid: true }),
      authorizeUserAction: async () => ({ hasPermission: true }),
      validateInputData: async () => ({ isValid: true }),
      findWorkersByClassificationAndSite: async () => [
        { workerId: 'existing-001', classification: 'assembly', siteId: 'site-001' },
      ],
      findProductivityDataByWorkerIds: async () => [
        { workerId: 'existing-001', productivity: 85, date: '2024-01-01' },
      ],
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: async () => ({
        estimatedProficiencyDays: -5,
        patterns: [],
      }),
      notifyApprover: async () => ({ sent: false }),
      saveInitialAssignment: async () => null,
    });

    expect(result.success).toBe(false);
    expect(result.initialAssignmentId).toBeNull();
    expect(result.errorDetails).toContain('初期割当案の生成に失敗しました');
    expect(result.errorDetails).toContain('入力データと分析ロジックを確認してください');
    expect(result.estimatedProficiencyDays).toBeUndefined();
  });

  it('should return failure when estimatedProficiencyDays is NaN', async () => {
    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(validInput, {
      authenticateUser: async () => ({ isValid: true }),
      authorizeUserAction: async () => ({ hasPermission: true }),
      validateInputData: async () => ({ isValid: true }),
      findWorkersByClassificationAndSite: async () => [
        { workerId: 'existing-001', classification: 'assembly', siteId: 'site-001' },
      ],
      findProductivityDataByWorkerIds: async () => [
        { workerId: 'existing-001', productivity: 85, date: '2024-01-01' },
      ],
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: async () => ({
        estimatedProficiencyDays: NaN,
        patterns: [],
      }),
      notifyApprover: async () => ({ sent: false }),
      saveInitialAssignment: async () => null,
    });

    expect(result.success).toBe(false);
    expect(result.initialAssignmentId).toBeNull();
    expect(result.errorDetails).toContain('初期割当案の生成に失敗しました');
    expect(result.errorDetails).toContain('入力データと分析ロジックを確認してください');
    expect(result.estimatedProficiencyDays).toBeUndefined();
  });

  it('should throw InitialAssignmentGenerationFailureError with proper error message', async () => {
    try {
      await runTx5Imp1Agent(validInput, {
        authenticateUser: async () => ({ isValid: true }),
        authorizeUserAction: async () => ({ hasPermission: true }),
        validateInputData: async () => ({ isValid: true }),
        findWorkersByClassificationAndSite: async () => [
          { workerId: 'existing-001', classification: 'assembly', siteId: 'site-001' },
        ],
        findProductivityDataByWorkerIds: async () => [
          { workerId: 'existing-001', productivity: 85, date: '2024-01-01' },
        ],
        analyzeOnboardingContextAndExtractPeerPerformancePatterns: async () => ({
          estimatedProficiencyDays: -10,
          patterns: [],
        }),
        notifyApprover: async () => ({ sent: false }),
        saveInitialAssignment: async () => null,
      });

      fail('Expected an error to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('InitialAssignmentGenerationFailureError');
      expect(error.message).toContain('初期割当案の生成に失敗しました');
      expect(error.message).toContain('入力データと分析ロジックを確認してください');
    }
  });
});