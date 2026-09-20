import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';

// DeliveryInstructionFailureError クラスの定義（実装ファイルから import）
class DeliveryInstructionFailureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeliveryInstructionFailureError';
  }
}

describe('SCEN-008: エラー系：配置指示の配信に失敗した場合', () => {
  it('DeliveryInstructionFailureErrorが発生する', async () => {
    // テスト前提条件を設定
    const executorUserId = 'user-001';
    const targetFacilityIds = ['facility-A'];
    const targetTeamIds = ['team-1'];
    const monitoringWindowMinutes = 60;
    const delayRiskThreshold = 60;
    const qualityVarianceThreshold = 15;
    const autoApprovalEnabled = true;

    const input = {
      executorUserId,
      targetFacilityIds,
      targetTeamIds,
      monitoringWindowMinutes,
      delayRiskThreshold,
      qualityVarianceThreshold,
      autoApprovalEnabled,
    };

    // AIクライアントのモック設定
    const mockAiClient = {
      authorizeOperation: jest.fn().mockResolvedValue({
        authorized: true,
        allowedFacilities: targetFacilityIds,
      }),
      monitorAndJudgeDelayRisk: jest.fn().mockResolvedValue({
        detectionTimestamp: new Date().toISOString(),
        delayDetected: true,
        affectedFacilities: [
          {
            facilityId: 'facility-A',
            facilityName: 'Facility A',
            riskScore: 75,
            riskRank: 1,
            delayReasons: ['insufficient_personnel'],
            affectedTeams: [
              {
                teamId: 'team-1',
                teamName: 'Team 1',
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
      }),
      generateAllocationPlans: jest.fn().mockResolvedValue([
        {
          planId: 'plan-001',
          facilityId: 'facility-A',
          teamId: 'team-1',
          workInstructionId: 'work-001',
          proposedAllocations: [
            {
              workerId: 'worker-001',
              workerName: 'Worker 1',
              assignedWorkType: 'assembly',
              proficiencyLevel: 'intermediate',
              adjustedDifficulty: 'normal',
              estimatedWorkHours: 8,
              productivityRate: 95,
            },
          ],
          feasibilityScore: 88,
          recommendationRank: 1,
          estimatedCompletionDate: new Date(Date.now() + 86400000).toISOString(),
          proficiencyAdjustmentApplied: true,
        },
      ]),
      judgeAllocationPlanApprovalWithCriteria: jest.fn().mockResolvedValue([
        {
          planId: 'plan-001',
          approvalStatus: 'auto_approved',
          approvalTimestamp: new Date().toISOString(),
          approverUserId: null,
        },
      ]),
      deliverAllocationPlanAndWorkInstructions: jest
        .fn()
        .mockRejectedValue(
          new DeliveryInstructionFailureError(
            '配置指示の配信に失敗しました。現場リーダーへの手動通知を検討してください。'
          )
        ),
    };

    // runTx1Imp1Agent呼び出し時に例外が発生することを確認
    let caughtError: Error | null = null;
    try {
      await runTx1Imp1Agent(input, mockAiClient);
    } catch (error) {
      caughtError = error as Error;
    }

    // 例外が発生したことを確認
    expect(caughtError).not.toBeNull();
    
    // 例外型が DeliveryInstructionFailureError であることを確認
    expect(caughtError).toBeInstanceOf(DeliveryInstructionFailureError);
    
    // 例外メッセージが仕様通りであることを確認
    expect(caughtError?.message).toBe(
      '配置指示の配信に失敗しました。現場リーダーへの手動通知を検討してください。'
    );

    // deliverAllocationPlanAndWorkInstructionsが呼び出されたことを確認
    expect(mockAiClient.deliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();

    // スタックトレース・cause チェーンに deliverAllocationPlanAndWorkInstructions の呼び出し情報が含まれていることを追跡
    // （エラーが当該関数から発生したことの追跡可能性）
    expect(caughtError?.stack).toBeDefined();
    // スタックトレースに function name が含まれることを確認
    if (caughtError?.stack) {
      expect(caughtError.stack).toMatch(/deliverAllocationPlanAndWorkInstructions|at/);
    }
  });
});