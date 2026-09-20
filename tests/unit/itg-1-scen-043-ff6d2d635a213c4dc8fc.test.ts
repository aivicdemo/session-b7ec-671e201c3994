import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import type { Tx3Imp1AgentInput, Tx3Imp1AgentOutput, Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-043: 進捗遅延リスク自動検知から配置指示配信までの一貫実行', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常系：権限検証を通過し、リスク判定・配置案生成・承認・配信が完了して成功状態で終了する', async () => {
    // Arrange: 入力値を準備
    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['facility-A'],
      teamIds: ['team-1'],
      riskThresholdScore: 70,
      approverUserId: 'approver-001',
      executionContext: 'manual_trigger',
    };

    // モック依存関数の準備
    const mockAiClient: Tx3Imp1AiClient = {
      authorizeOperation: jest.fn().mockResolvedValue({
        userId: 'user-001',
        authorized: true,
      }),
      monitorAndJudgeDelayRisk: jest.fn().mockResolvedValue([
        {
          riskJudgmentId: 'risk-001',
          facilityId: 'facility-A',
          teamId: 'team-1',
          workInstructionId: 'work-inst-001',
          riskLevel: 'high',
          riskScore: 75,
          delayPredictionDays: 2,
          currentProgressRate: 45,
          plannedProgressRate: 60,
          delayReasonClassification: 'personnel_shortage',
        },
      ]),
      getWorkerWithProficiencyAndProductivity: jest.fn().mockResolvedValue([
        {
          workerId: 'worker-001',
          workerName: 'Taro Yamada',
          proficiencyLevel: 'intermediate',
          currentProductivityRate: 85,
        },
      ]),
      generateAllocationPlans: jest.fn().mockResolvedValue([
        {
          allocationPlanId: 'plan-001',
          facilityId: 'facility-A',
          teamId: 'team-1',
          workInstructionId: 'work-inst-001',
          proposedWorkerAssignments: [
            {
              workerId: 'worker-001',
              workerName: 'Taro Yamada',
              proficiencyLevel: 'intermediate',
              assignedTaskDifficulty: 'medium',
              allocatedWorkHours: 8,
              expectedProductivityRate: 85,
            },
          ],
          expectedCompletionDate: '2024-01-15T00:00:00Z',
          feasibilityScore: 92,
          recommendationReason: 'Personnel shortage resolved by assigning intermediate worker',
          proficiencyAdjustmentApplied: true,
        },
      ]),
      judgeAllocationPlanApprovalWithCriteria: jest.fn().mockResolvedValue({
        approvalStatus: 'auto_approved',
        approverUserId: 'approver-001',
      }),
      deliverAllocationPlanAndWorkInstructions: jest.fn().mockResolvedValue([
        {
          deliveryId: 'delivery-001',
          allocationPlanId: 'plan-001',
          targetFacilityId: 'facility-A',
          targetTeamId: 'team-1',
          status: 'delivered',
          deliveryTimestamp: '2024-01-10T10:30:00Z',
          deliveryMethod: 'system_notification',
          recipientCount: 5,
          acknowledgedCount: 5,
        },
      ]),
      saveDelayRiskJudgment: jest.fn().mockResolvedValue(true),
      saveAllocationPlan: jest.fn().mockResolvedValue(true),
      recordOperationAudit: jest.fn().mockResolvedValue(true),
    };

    // Act: 関数を呼び出す
    const result = await runTx3Imp1Agent(input, mockAiClient);

    // Assert: 期待結果を検証
    expect(result).toBeDefined();
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.executionId.length).toBeGreaterThan(0);

    expect(result.delayRiskJudgmentResults).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);
    expect(result.delayRiskJudgmentResults.length).toBeGreaterThanOrEqual(1);
    expect(result.delayRiskJudgmentResults[0]).toMatchObject({
      riskJudgmentId: expect.any(String),
      facilityId: 'facility-A',
      teamId: 'team-1',
      workInstructionId: expect.any(String),
      riskLevel: expect.stringMatching(/^(high|medium|low)$/),
      riskScore: expect.any(Number),
      delayPredictionDays: expect.any(Number),
      currentProgressRate: expect.any(Number),
      plannedProgressRate: expect.any(Number),
      delayReasonClassification: expect.any(String),
    });

    expect(result.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(result.generatedAllocationPlans)).toBe(true);
    expect(result.generatedAllocationPlans.length).toBeGreaterThanOrEqual(1);
    expect(result.generatedAllocationPlans[0]).toMatchObject({
      allocationPlanId: expect.any(String),
      facilityId: 'facility-A',
      teamId: 'team-1',
      workInstructionId: expect.any(String),
      proposedWorkerAssignments: expect.any(Array),
      expectedCompletionDate: expect.any(String),
      feasibilityScore: expect.any(Number),
      recommendationReason: expect.any(String),
      proficiencyAdjustmentApplied: expect.any(Boolean),
    });
    expect(result.generatedAllocationPlans[0].proposedWorkerAssignments.length).toBeGreaterThanOrEqual(1);
    expect(result.generatedAllocationPlans[0].proposedWorkerAssignments[0]).toMatchObject({
      workerId: expect.any(String),
      workerName: expect.any(String),
      proficiencyLevel: expect.stringMatching(/^(beginner|intermediate|advanced)$/),
      assignedTaskDifficulty: expect.stringMatching(/^(easy|medium|hard)$/),
      allocatedWorkHours: expect.any(Number),
      expectedProductivityRate: expect.any(Number),
    });

    expect(result.approvalStatus).toBe('auto_approved');

    expect(result.deliveryResults).toBeDefined();
    expect(Array.isArray(result.deliveryResults)).toBe(true);
    expect(result.deliveryResults.length).toBeGreaterThanOrEqual(1);
    result.deliveryResults.forEach((delivery) => {
      expect(delivery).toMatchObject({
        status: 'delivered',
        deliveryTimestamp: expect.any(String),
      });
      expect(delivery.deliveryTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    expect(result.executionStatus).toBe('success');

    expect(result.errorDetails).toBeDefined();
    if (Array.isArray(result.errorDetails)) {
      expect(result.errorDetails.length).toBe(0);
    }

    expect(result.executionTimestamp).toBeDefined();
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 依存関数が正しいパラメータで呼び出されたことを検証
    expect(mockAiClient.authorizeOperation).toHaveBeenCalledWith('user-001');
    
    expect(mockAiClient.monitorAndJudgeDelayRisk).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityIds: ['facility-A'],
        teamIds: ['team-1'],
        riskThresholdScore: 70,
      })
    );

    expect(mockAiClient.getWorkerWithProficiencyAndProductivity).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityIds: ['facility-A'],
        teamIds: ['team-1'],
      })
    );

    expect(mockAiClient.judgeAllocationPlanApprovalWithCriteria).toHaveBeenCalledWith(
      expect.any(Object),
      'approver-001'
    );

    expect(mockAiClient.deliverAllocationPlanAndWorkInstructions).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        facilityIds: ['facility-A'],
      })
    );
  });
});