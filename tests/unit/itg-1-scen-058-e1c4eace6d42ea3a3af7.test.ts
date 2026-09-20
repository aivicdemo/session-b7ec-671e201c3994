import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-058: エラー系：配信失敗時に部分成功状態でexecutionStatusがpartial_successになる', () => {
  it('配置指示配信が一部失敗した場合、executionStatusはpartial_successで、deliveryResultsとerrorDetailsが正しく設定される', async () => {
    // テスト用スタブの初期化
    const mockAuthOperation = jest.fn().mockResolvedValue(true);
    const mockDelayRiskJudgment = jest.fn().mockResolvedValue({
      riskJudgmentId: 'risk-1',
      facilityId: 'fac1',
      teamId: 'team1',
      workInstructionId: 'work-1',
      riskLevel: 'high',
      riskScore: 85,
      delayPredictionDays: 2,
      currentProgressRate: 45,
      plannedProgressRate: 60,
      delayReasonClassification: 'personnel_shortage',
    });

    const mockAllocationPlans = jest.fn().mockResolvedValue([
      {
        allocationPlanId: 'plan-1',
        facilityId: 'fac1',
        teamId: 'team1',
        workInstructionId: 'work-1',
        proposedWorkerAssignments: [
          {
            workerId: 'worker-1',
            workerName: 'Taro Yamada',
            proficiencyLevel: 'intermediate',
            assignedTaskDifficulty: 'medium',
            allocatedWorkHours: 8,
            expectedProductivityRate: 85,
          },
        ],
        expectedCompletionDate: '2024-12-25',
        feasibilityScore: 90,
        recommendationReason: 'Personnel shortage detected',
        proficiencyAdjustmentApplied: true,
      },
      {
        allocationPlanId: 'plan-2',
        facilityId: 'fac2',
        teamId: 'team1',
        workInstructionId: 'work-2',
        proposedWorkerAssignments: [
          {
            workerId: 'worker-2',
            workerName: 'Hanako Sato',
            proficiencyLevel: 'advanced',
            assignedTaskDifficulty: 'hard',
            allocatedWorkHours: 6,
            expectedProductivityRate: 92,
          },
        ],
        expectedCompletionDate: '2024-12-26',
        feasibilityScore: 88,
        recommendationReason: 'Load balancing',
        proficiencyAdjustmentApplied: true,
      },
    ]);

    const mockApprovalCriteria = jest.fn().mockResolvedValue('auto_approved');

    // 配信を一部失敗させる（2件中1件成功、1件失敗）
    const mockDelivery = jest.fn().mockResolvedValue([
      {
        deliveryId: 'delivery-1',
        allocationPlanId: 'plan-1',
        status: 'success',
        deliveredTo: 'leader-1',
        deliveredTimestamp: new Date().toISOString(),
      },
      {
        deliveryId: 'delivery-2',
        allocationPlanId: 'plan-2',
        status: 'failure',
        reason: '配置指示の配信に失敗しました。現場リーダーへの通知状況を確認してください。',
        deliveredTimestamp: new Date().toISOString(),
      },
    ]);

    // AIクライアントスタブ
    const mockAiClient = {
      authorizeOperation: mockAuthOperation,
      monitorAndJudgeDelayRisk: mockDelayRiskJudgment,
      generateAllocationPlans: mockAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockApprovalCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDelivery,
    };

    // runTx3Imp1Agent を呼び出す
    const result = await runTx3Imp1Agent(
      {
        userId: 'user123',
        facilityIds: ['fac1', 'fac2'],
        teamIds: ['team1'],
        riskThresholdScore: 70,
        approverUserId: 'approver1',
        executionContext: 'manual_trigger',
      },
      mockAiClient
    );

    // 検証
    expect(result.executionStatus).toBe('partial_success');

    expect(result.deliveryResults).toHaveLength(2);
    expect(result.deliveryResults[0]).toMatchObject({
      status: 'success',
      allocationPlanId: 'plan-1',
    });
    expect(result.deliveryResults[1]).toMatchObject({
      status: 'failure',
      reason: '配置指示の配信に失敗しました。現場リーダーへの通知状況を確認してください。',
    });

    expect(result.errorDetails).toHaveLength(1);
    expect(result.errorDetails[0]).toMatchObject({
      errorCode: 'DeliveryFailure',
      errorMessage: '配置指示の配信に失敗しました。現場リーダーへの通知状況を確認してください。',
    });

    expect(result.delayRiskJudgmentResults).toHaveLength(1);
    expect(result.delayRiskJudgmentResults[0].riskJudgmentId).toBe('risk-1');

    expect(result.generatedAllocationPlans).toHaveLength(2);
    expect(result.generatedAllocationPlans[0].allocationPlanId).toBe('plan-1');
    expect(result.generatedAllocationPlans[1].allocationPlanId).toBe('plan-2');

    expect(result.approvalStatus).toBe('auto_approved');

    expect(result.executionId).toBeDefined();
    expect(result.executionTimestamp).toBeDefined();
  });
});