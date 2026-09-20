import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import {
  Tx1Imp1AgentInput,
  Tx1Imp1AgentOutput,
  DelayDetectionResult,
  GeneratedAllocationPlan,
  ApprovedAllocationPlan,
  DeliveryResult,
  AffectedFacility,
  AffectedTeam,
  ProposedAllocation,
} from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-014: autoApprovalEnabledがtrueの場合、承認基準内の配置案は自動承認されて配信される', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;
  let mockDeliverAllocationInstructionToFieldLeader: jest.Mock;

  const executorUserId = 'user123';
  const targetFacilityIds = ['facility-A', 'facility-B'];
  const delayRiskThreshold = 60;
  const qualityVarianceThreshold = 15;

  beforeEach(() => {
    jest.clearAllMocks();

    // Stub: authorizeOperation - 権限検証成功
    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);

    // Stub: monitorAndJudgeDelayRisk - 遅延リスク検知
    const delayDetectionResult: DelayDetectionResult = {
      detectionTimestamp: new Date().toISOString(),
      delayDetected: true,
      qualityVarianceDetected: true,
      overallRiskScore: 75,
      affectedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: '拠点A',
          riskScore: 80,
          riskRank: 1,
          delayReasons: ['insufficient_personnel', 'low_productivity'],
          affectedTeams: [
            {
              teamId: 'team-A1',
              teamName: 'チームA1',
              progressRate: 45,
              plannedProgressRate: 60,
              delayDays: 2,
              qualityScore: 72,
            },
          ],
        },
        {
          facilityId: 'facility-B',
          facilityName: '拠点B',
          riskScore: 65,
          riskRank: 2,
          delayReasons: ['priority_misalignment'],
          affectedTeams: [
            {
              teamId: 'team-B1',
              teamName: 'チームB1',
              progressRate: 55,
              plannedProgressRate: 70,
              delayDays: 1,
              qualityScore: 78,
            },
          ],
        },
      ],
    };
    mockMonitorAndJudgeDelayRisk = jest.fn().mockResolvedValue(delayDetectionResult);

    // Stub: generateAllocationPlans - 複数の配置案を生成
    const generatedPlans: GeneratedAllocationPlan[] = [
      {
        planId: 'plan-001',
        facilityId: 'facility-A',
        teamId: 'team-A1',
        workInstructionId: 'work-001',
        proposedAllocations: [
          {
            workerId: 'worker-001',
            workerName: '作業者001',
            assignedWorkType: 'assembly',
            proficiencyLevel: 'intermediate',
            adjustedDifficulty: 'normal',
            estimatedWorkHours: 8,
            productivityRate: 95,
          },
          {
            workerId: 'worker-002',
            workerName: '作業者002',
            assignedWorkType: 'assembly',
            proficiencyLevel: 'beginner',
            adjustedDifficulty: 'easy',
            estimatedWorkHours: 6,
            productivityRate: 75,
          },
        ],
        feasibilityScore: 85,
        recommendationRank: 1,
        estimatedCompletionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        proficiencyAdjustmentApplied: true,
      },
      {
        planId: 'plan-002',
        facilityId: 'facility-B',
        teamId: 'team-B1',
        workInstructionId: 'work-002',
        proposedAllocations: [
          {
            workerId: 'worker-003',
            workerName: '作業者003',
            assignedWorkType: 'inspection',
            proficiencyLevel: 'advanced',
            adjustedDifficulty: 'normal',
            estimatedWorkHours: 7,
            productivityRate: 98,
          },
        ],
        feasibilityScore: 82,
        recommendationRank: 1,
        estimatedCompletionDate: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString(),
        proficiencyAdjustmentApplied: true,
      },
    ];
    mockGenerateAllocationPlans = jest.fn().mockResolvedValue(generatedPlans);

    // Stub: judgeAllocationPlanApprovalWithCriteria - autoApprovalEnabled=trueで全案が承認基準を満たす
    const approvedPlans: ApprovedAllocationPlan[] = [
      {
        planId: 'plan-001',
        approvalStatus: 'auto_approved',
        approvalTimestamp: new Date().toISOString(),
        approverUserId: undefined,
      },
      {
        planId: 'plan-002',
        approvalStatus: 'auto_approved',
        approvalTimestamp: new Date().toISOString(),
        approverUserId: undefined,
      },
    ];
    mockJudgeAllocationPlanApprovalWithCriteria = jest.fn().mockResolvedValue(approvedPlans);

    // Stub: deliverAllocationPlanAndWorkInstructions - 配置案の配信成功
    const deliveryResults: DeliveryResult[] = [
      {
        deliveryId: 'delivery-001',
        planId: 'plan-001',
        targetFieldLeaderId: 'fieldleader-A',
        deliveryStatus: 'delivered',
        deliveryTimestamp: new Date().toISOString(),
        receptionConfirmed: true,
        receptionConfirmationTimestamp: new Date(Date.now() + 30000).toISOString(),
        executionStarted: true,
        executionStartTimestamp: new Date(Date.now() + 60000).toISOString(),
      },
      {
        deliveryId: 'delivery-002',
        planId: 'plan-002',
        targetFieldLeaderId: 'fieldleader-B',
        deliveryStatus: 'delivered',
        deliveryTimestamp: new Date().toISOString(),
        receptionConfirmed: true,
        receptionConfirmationTimestamp: new Date(Date.now() + 25000).toISOString(),
        executionStarted: true,
        executionStartTimestamp: new Date(Date.now() + 55000).toISOString(),
      },
    ];
    mockDeliverAllocationPlanAndWorkInstructions = jest.fn().mockResolvedValue(deliveryResults);

    // Stub: recordOperationAudit - 監査ログ記録
    mockRecordOperationAudit = jest.fn().mockResolvedValue({
      auditId: 'audit-001',
      executorUserId,
      targetFacilityIds,
      executionTimestamp: new Date().toISOString(),
      processingContent: 'Automated delay detection and staffing plan delivery',
    });

    // Stub: deliverAllocationInstructionToFieldLeader - フィールドリーダーへの配置指示配信
    mockDeliverAllocationInstructionToFieldLeader = jest.fn().mockResolvedValue({
      notificationId: 'notif-001',
      status: 'sent',
    });
  });

  it('autoApprovalEnabledがtrueの場合、承認基準内の配置案は自動承認されて配信される', async () => {
    // Arrange
    const input: Tx1Imp1AgentInput = {
      executorUserId,
      targetFacilityIds,
      targetTeamIds: undefined,
      monitoringWindowMinutes: 60,
      delayRiskThreshold,
      qualityVarianceThreshold,
      autoApprovalEnabled: true, // 自動承認を有効化
    };

    // Act
    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
    } as any);

    // Assert: executionStatus が 'completed' であること
    expect(result.executionStatus).toBe('completed');

    // Assert: delayDetectionResult が遅延検知を確認
    expect(result.delayDetectionResult.delayDetected).toBe(true);
    expect(result.delayDetectionResult.qualityVarianceDetected).toBe(true);
    expect(result.delayDetectionResult.affectedFacilities.length).toBeGreaterThan(0);

    // Assert: generatedAllocationPlans が生成されていること
    expect(result.generatedAllocationPlans).toBeDefined();
    expect(result.generatedAllocationPlans.length).toBeGreaterThan(0);

    // Assert: approvedAllocationPlans が空配列でなく、全案が自動承認されていること
    expect(result.approvedAllocationPlans).toBeDefined();
    expect(result.approvedAllocationPlans.length).toBeGreaterThan(0);
    result.approvedAllocationPlans.forEach((plan) => {
      expect(plan.approvalStatus).toBe('auto_approved');
      expect(plan.approvalTimestamp).toBeDefined();
      // 自動承認の場合、approverUserIdは未定義またはnull
      expect(plan.approverUserId).toBeUndefined();
    });

    // Assert: deliveryResults が空配列でなく、各配置案に対する配信が成功していること
    expect(result.deliveryResults).toBeDefined();
    expect(result.deliveryResults.length).toBeGreaterThan(0);
    result.deliveryResults.forEach((delivery) => {
      expect(delivery.deliveryStatus).toBe('delivered');
      expect(delivery.deliveryTimestamp).toBeDefined();
      expect(delivery.receptionConfirmed).toBe(true);
      expect(delivery.receptionConfirmationTimestamp).toBeDefined();
      expect(delivery.executionStarted).toBe(true);
      expect(delivery.executionStartTimestamp).toBeDefined();
    });

    // Assert: executionErrors が空配列であること
    expect(result.executionErrors).toEqual([]);

    // Assert: 記録されたauditログに実行ユーザー、拠点情報、実行完了タイムスタンプが含まれていること
    expect(mockRecordOperationAudit).toHaveBeenCalled();
    const auditCall = mockRecordOperationAudit.mock.calls[0][0];
    expect(auditCall.executorUserId).toBe(executorUserId);
    expect(auditCall.targetFacilityIds).toEqual(targetFacilityIds);
    expect(auditCall.executionTimestamp).toBeDefined();

    // Assert: executionTimestamp が設定されていること
    expect(result.executionTimestamp).toBeDefined();
    expect(new Date(result.executionTimestamp).getTime()).toBeLessThanOrEqual(Date.now());

    // Assert: autoApprovalEnabled=trueの場合、承認基準内の配置案は承認者を経由せず自動承認されている
    const approvedPlanCount = result.approvedAllocationPlans.filter(
      (p) => p.approvalStatus === 'auto_approved'
    ).length;
    expect(approvedPlanCount).toBe(result.approvedAllocationPlans.length);
  });

  it('autoApprovalEnabledがtrueでも承認基準を超える配置案は配信されない', async () => {
    // Arrange
    const input: Tx1Imp1AgentInput = {
      executorUserId,
      targetFacilityIds,
      targetTeamIds: undefined,
      monitoringWindowMinutes: 60,
      delayRiskThreshold,
      qualityVarianceThreshold,
      autoApprovalEnabled: true,
    };

    // 承認基準を超える配置案を設定
    const nonApprovedPlans: ApprovedAllocationPlan[] = [];
    mockJudgeAllocationPlanApprovalWithCriteria.mockResolvedValue(nonApprovedPlans);

    // Act
    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
    } as any);

    // Assert: 承認基準を超える場合、approvedAllocationPlans は空配列
    expect(result.approvedAllocationPlans.length).toBe(0);

    // Assert: 配信が行われない（配信結果は空配列または配信なし）
    expect(result.deliveryResults.length).toBe(0);

    // Assert: executionStatus は partial_failure または failed
    expect(['partial_failure', 'failed']).toContain(result.executionStatus);
  });

  it('権限検証に失敗する場合、実行は中止される', async () => {
    // Arrange
    const input: Tx1Imp1AgentInput = {
      executorUserId,
      targetFacilityIds,
      targetTeamIds: undefined,
      monitoringWindowMinutes: 60,
      delayRiskThreshold,
      qualityVarianceThreshold,
      autoApprovalEnabled: true,
    };

    // 権限検証失敗を設定
    mockAuthorizeOperation.mockResolvedValue(false);

    // Act
    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
    } as any);

    // Assert: executionStatus は 'failed'
    expect(result.executionStatus).toBe('failed');

    // Assert: executionErrors に権限エラーが含まれている
    expect(result.executionErrors.length).toBeGreaterThan(0);
    expect(result.executionErrors[0].errorCode).toContain('Authorization');

    // Assert: generatedAllocationPlans と approvedAllocationPlans は空配列
    expect(result.generatedAllocationPlans.length).toBe(0);
    expect(result.approvedAllocationPlans.length).toBe(0);
    expect(result.deliveryResults.length).toBe(0);
  });

  it('遅延検知が成功し、配置案が生成・承認・配信される一連のフロー', async () => {
    // Arrange
    const input: Tx1Imp1AgentInput = {
      executorUserId,
      targetFacilityIds,
      targetTeamIds: ['team-A1', 'team-B1'],
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    // Act
    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
    } as any);

    // Assert: 実行IDが設定されている
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.executionId.length).toBeGreaterThan(0);

    // Assert: 遅延検知結果が返されている
    expect(result.delayDetectionResult).toBeDefined();
    expect(result.delayDetectionResult.detectionTimestamp).toBeDefined();
    expect(result.delayDetectionResult.overallRiskScore).toBeGreaterThan(0);

    // Assert: 全フロー成功時に executionStatus は 'completed'
    expect(result.executionStatus).toBe('completed');

    // Assert: 生成・承認・配信がすべて実行されている
    expect(result.generatedAllocationPlans.length).toBeGreaterThan(0);
    expect(result.approvedAllocationPlans.length).toBeGreaterThan(0);
    expect(result.deliveryResults.length).toBeGreaterThan(0);

    // Assert: deliveryResults の各配信が成功している
    result.deliveryResults.forEach((delivery) => {
      expect(['delivered', 'pending_reception']).toContain(delivery.deliveryStatus);
      expect(delivery.planId).toBeDefined();
      expect(delivery.targetFieldLeaderId).toBeDefined();
    });
  });
});