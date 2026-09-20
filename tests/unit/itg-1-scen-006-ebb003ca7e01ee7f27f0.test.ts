import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';

class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

describe('SCEN-006: エラー系 - 権限なしでのエージェント実行', () => {
  it('実行ユーザーが当該拠点へのエージェント実行権限を持たない場合、AuthorizationErrorが発生する', async () => {
    const mockAuthorizeOperation = jest.fn().mockImplementation(() => {
      throw new AuthorizationError('このエージェント実行に必要な権限がありません。');
    });

    const mockRecordOperationAudit = jest.fn();
    const mockMonitorAndJudgeDelayRisk = jest.fn();
    const mockGenerateAllocationPlans = jest.fn();
    const mockJudgeAllocationPlanApprovalWithCriteria = jest.fn();
    const mockDeliverAllocationPlanAndWorkInstructions = jest.fn();

    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
    };

    const input = {
      executorUserId: 'user-unauthorized',
      targetFacilityIds: ['facility-A'],
      targetTeamIds: undefined,
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    let caughtError: Error | null = null;

    try {
      await runTx1Imp1Agent(input, mockAiClient as any);
    } catch (error) {
      caughtError = error as Error;
    }

    expect(caughtError).toBeInstanceOf(AuthorizationError);
    expect(caughtError?.message).toBe('このエージェント実行に必要な権限がありません。');
    expect(mockRecordOperationAudit).not.toHaveBeenCalled();
    expect(mockMonitorAndJudgeDelayRisk).not.toHaveBeenCalled();
    expect(mockGenerateAllocationPlans).not.toHaveBeenCalled();
    expect(mockJudgeAllocationPlanApprovalWithCriteria).not.toHaveBeenCalled();
    expect(mockDeliverAllocationPlanAndWorkInstructions).not.toHaveBeenCalled();
  });
});