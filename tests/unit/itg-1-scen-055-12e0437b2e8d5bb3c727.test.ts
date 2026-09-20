import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { Tx3Imp1AgentInput, Tx3Imp1AgentOutput, DelayRiskJudgmentResult, AllocationPlanProposal, WorkerAssignment, DeliveryResult, Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-055: 正常系：複数の遅延リスク判定結果・配置案が生成されて全件出力される', () => {
  let mockAiClient: jest.Mocked<Tx3Imp1AiClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAiClient = {
      authorizeOperation: jest.fn().mockResolvedValue(true),
      monitorAndJudgeDelayRisk: jest.fn().mockResolvedValue([
        {
          riskJudgmentId: 'risk-001',
          facilityId: 'fac001',
          teamId: 'team001',
          workInstructionId: 'work-001',
          riskLevel: 'high',
          riskScore: 82,
          delayPredictionDays: 2,
          currentProgressRate: 45,
          plannedProgressRate: 65,
          delayReasonClassification: 'personnel_shortage',
        } as DelayRiskJudgmentResult,
        {
          riskJudgmentId: 'risk-002',
          facilityId: 'fac002',
          teamId: 'team002',
          workInstructionId: 'work-002',
          riskLevel: 'medium',
          riskScore: 78,
          delayPredictionDays: 1,
          currentProgressRate: 55,
          plannedProgressRate: 70,
          delayReasonClassification: 'efficiency_decline',
        } as DelayRiskJudgmentResult,
      ]),
      getWorkerWithProficiencyAndProductivity: jest.fn().mockResolvedValue({
        fac001_team001: [
          { workerId: 'worker002', proficiencyLevel: 'intermediate', productivity: 85 },
          { workerId: 'worker003', proficiencyLevel: 'beginner', productivity: 70 },
        ],
        fac002_team002: [
          { workerId: 'worker005', proficiencyLevel: 'advanced', productivity: 95 },
        ],
      }),
      generateAllocationPlans: jest.fn().mockResolvedValue([
        {
          allocationPlanId: 'plan-001',
          facilityId: 'fac001',
          teamId: 'team001',
          workInstructionId: 'work-001',
          proposedWorkerAssignments: [
            {
              workerId: 'worker002',
              workerName: 'Worker Two',
              proficiencyLevel: 'intermediate',
              assignedTaskDifficulty: 'medium',
              allocatedWorkHours: 8,
              expectedProductivityRate: 85,
            } as WorkerAssignment,
            {
              workerId: 'worker003',
              workerName: 'Worker Three',
              proficiencyLevel: 'beginner',
              assignedTaskDifficulty: 'easy',
              allocatedWorkHours: 6,
              expectedProductivityRate: 75,
            } as WorkerAssignment,
          ],
          expectedCompletionDate: '2025-12-20T18:00:00Z',
          feasibilityScore: 88,
          recommendationReason: 'Optimal allocation to address personnel shortage',
          proficiencyAdjustmentApplied: true,
        } as AllocationPlanProposal,
        {
          allocationPlanId: 'plan-002',
          facilityId: 'fac002',
          teamId: 'team002',
          workInstructionId: 'work-002',
          proposedWorkerAssignments: [
            {
              workerId: 'worker005',
              workerName: 'Worker Five',
              proficiencyLevel: 'advanced',
              assignedTaskDifficulty: 'hard',
              allocatedWorkHours: 10,
              expectedProductivityRate: 95,
            } as WorkerAssignment,
          ],
          expectedCompletionDate: '2025-12-18T18:00:00Z',
          feasibilityScore: 92,
          recommendationReason: 'High productivity expected with advanced worker',
          proficiencyAdjustmentApplied: true,
        } as AllocationPlanProposal,
      ]),
      judgeAllocationPlanApprovalWithCriteria: jest.fn().mockResolvedValue({
        approvalStatus: 'auto_approved',
      }),
      deliverAllocationPlanAndWorkInstructions: jest.fn().mockResolvedValue([
        {
          allocationPlanId: 'plan-001',
          facilityId: 'fac001',
          teamId: 'team001',
          currentLeaderId: 'leader001',
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
          acknowledgedAt: new Date().toISOString(),
        } as DeliveryResult,
        {
          allocationPlanId: 'plan-002',
          facilityId: 'fac002',
          teamId: 'team002',
          currentLeaderId: 'leader002',
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
          acknowledgedAt: new Date().toISOString(),
        } as DeliveryResult,
      ]),
      saveDelayRiskJudgment: jest.fn().mockResolvedValue(true),
      saveAllocationPlan: jest.fn().mockResolvedValue(true),
      recordOperationAudit: jest.fn().mockResolvedValue(true),
    } as jest.Mocked<Tx3Imp1AiClient>;
  });

  test('複数の遅延リスク判定結果と配置案が生成され、全件が出力される', async () => {
    // テスト前提条件を設定
    const userId = 'user001';
    const facilityIds = ['fac001', 'fac002'];
    const teamIds = ['team001', 'team002'];
    const riskThresholdScore = 75;
    const approverUserId = 'approver001';
    const executionContext = 'manual_trigger';

    // 入力データの構築
    const input: Tx3Imp1AgentInput = {
      userId,
      facilityIds,
      teamIds,
      riskThresholdScore,
      approverUserId,
      executionContext,
    };

    // runTx3Imp1Agentを呼び出し
    const result: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input, mockAiClient);

    // authorizeOperationの呼び出し確認
    expect(mockAiClient.authorizeOperation).toHaveBeenCalledWith(userId, 'runTx3Imp1Agent');

    // monitorAndJudgeDelayRiskの呼び出し確認
    expect(mockAiClient.monitorAndJudgeDelayRisk).toHaveBeenCalledWith(facilityIds, teamIds, riskThresholdScore);

    // getWorkerWithProficiencyAndProductivityの呼び出し確認
    expect(mockAiClient.getWorkerWithProficiencyAndProductivity).toHaveBeenCalledWith(facilityIds, teamIds);

    // generateAllocationPlansの呼び出し確認
    expect(mockAiClient.generateAllocationPlans).toHaveBeenCalled();

    // judgeAllocationPlanApprovalWithCriteriaの呼び出し確認
    expect(mockAiClient.judgeAllocationPlanApprovalWithCriteria).toHaveBeenCalled();

    // deliverAllocationPlanAndWorkInstructionsの呼び出し確認
    expect(mockAiClient.deliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();

    // saveDelayRiskJudgmentの呼び出し確認
    expect(mockAiClient.saveDelayRiskJudgment).toHaveBeenCalled();

    // saveAllocationPlanの呼び出し確認
    expect(mockAiClient.saveAllocationPlan).toHaveBeenCalled();

    // recordOperationAuditの呼び出し確認
    expect(mockAiClient.recordOperationAudit).toHaveBeenCalled();

    // executionIdの検証
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.executionId).toMatch(/^[a-f0-9-]{36}$|^[a-zA-Z0-9-]+$/);

    // delayRiskJudgmentResultsの検証
    expect(result.delayRiskJudgmentResults).toHaveLength(2);
    expect(result.delayRiskJudgmentResults[0].riskScore).toBe(82);
    expect(result.delayRiskJudgmentResults[0].riskScore).toBeGreaterThanOrEqual(riskThresholdScore);
    expect(result.delayRiskJudgmentResults[0].facilityId).toBe('fac001');
    expect(result.delayRiskJudgmentResults[0].teamId).toBe('team001');
    expect(result.delayRiskJudgmentResults[1].riskScore).toBe(78);
    expect(result.delayRiskJudgmentResults[1].riskScore).toBeGreaterThanOrEqual(riskThresholdScore);
    expect(result.delayRiskJudgmentResults[1].facilityId).toBe('fac002');
    expect(result.delayRiskJudgmentResults[1].teamId).toBe('team002');

    // generatedAllocationPlansの検証
    expect(result.generatedAllocationPlans).toHaveLength(2);
    expect(result.generatedAllocationPlans[0].facilityId).toBe('fac001');
    expect(result.generatedAllocationPlans[0].teamId).toBe('team001');
    expect(result.generatedAllocationPlans[0].proposedWorkerAssignments).toHaveLength(2);
    expect(result.generatedAllocationPlans[0].proposedWorkerAssignments[0].workerId).toBe('worker002');
    expect(result.generatedAllocationPlans[0].proposedWorkerAssignments[1].workerId).toBe('worker003');
    expect(result.generatedAllocationPlans[1].facilityId).toBe('fac002');
    expect(result.generatedAllocationPlans[1].teamId).toBe('team002');
    expect(result.generatedAllocationPlans[1].proposedWorkerAssignments).toHaveLength(1);
    expect(result.generatedAllocationPlans[1].proposedWorkerAssignments[0].workerId).toBe('worker005');

    // approvalStatusの検証
    expect(result.approvalStatus).toBe('auto_approved');

    // deliveryResultsの検証
    expect(result.deliveryResults).toHaveLength(2);
    expect(result.deliveryResults[0].status).toBe('delivered');
    expect(result.deliveryResults[0].currentLeaderId).toBe('leader001');
    expect(result.deliveryResults[1].status).toBe('delivered');
    expect(result.deliveryResults[1].currentLeaderId).toBe('leader002');

    // executionStatusの検証
    expect(result.executionStatus).toBe('success');

    // errorDetailsの検証
    expect(result.errorDetails).toHaveLength(0);

    // executionTimestampの検証
    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');
    const timestamp = new Date(result.executionTimestamp);
    expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 10000);
  });
});