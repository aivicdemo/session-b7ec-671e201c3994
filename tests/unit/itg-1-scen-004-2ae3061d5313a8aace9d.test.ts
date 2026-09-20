import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';

class AllocationPlanGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AllocationPlanGenerationError';
  }
}

describe('SCEN-004: エラー系 - AllocationPlanGenerationError', () => {
  it('人員配置案の生成に失敗した場合、AllocationPlanGenerationErrorが発生する', async () => {
    const mockAuthorizeOperation = jest.fn().mockResolvedValue(undefined);
    const mockMonitorAndJudgeDelayRisk = jest.fn().mockResolvedValue({
      detectionTimestamp: new Date().toISOString(),
      delayDetected: true,
      affectedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: '拠点A',
          riskScore: 75,
          riskRank: 1,
          delayReasons: ['insufficient_personnel'],
          affectedTeams: [
            {
              teamId: 'team-1',
              teamName: 'チーム1',
              progressRate: 40,
              plannedProgressRate: 60,
              delayDays: 2,
              qualityScore: 85,
            },
          ],
        },
      ],
      qualityVarianceDetected: false,
      overallRiskScore: 75,
    });

    const allocationPlanGenerationError = new AllocationPlanGenerationError(
      '人員配置案の生成に失敗しました。入力データを確認してください。'
    );
    const mockGenerateAllocationPlans = jest
      .fn()
      .mockRejectedValue(allocationPlanGenerationError);

    const mockRecordOperationAudit = jest.fn().mockResolvedValue(undefined);

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      recordOperationAudit: mockRecordOperationAudit,
    };

    const input = {
      executorUserId: 'user-001',
      targetFacilityIds: ['facility-A'],
      targetTeamIds: ['team-1'],
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    let caughtError: Error | undefined;
    let output: any;
    try {
      output = await runTx1Imp1Agent(input, aiClient);
    } catch (error) {
      caughtError = error as Error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError?.name).toBe('AllocationPlanGenerationError');
    expect(caughtError?.message).toBe(
      '人員配置案の生成に失敗しました。入力データを確認してください。'
    );
    expect(caughtError?.stack).toContain('generateAllocationPlans');
    
    // 出力型が返却されないことを確認
    expect(output).toBeUndefined();

    expect(mockAuthorizeOperation).toHaveBeenCalled();
    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalled();
    expect(mockGenerateAllocationPlans).toHaveBeenCalled();
    
    // recordOperationAudit の呼び出しと AllocationPlanGenerationError エラー記録を検証
    expect(mockRecordOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        executorUserId: 'user-001',
        operationStatus: 'failed',
        errorCode: 'AllocationPlanGenerationError',
        errorMessage:
          '人員配置案の生成に失敗しました。入力データを確認してください。',
      })
    );
  });
});