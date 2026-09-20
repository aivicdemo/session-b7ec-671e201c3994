import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { Tx3Imp1AgentOutput, Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-059: 進捗遅延リスク自動検知から配置指示配信までの一貫実行', () => {
  let mockAiClient: jest.Mocked<Tx3Imp1AiClient>;

  beforeEach(() => {
    mockAiClient = {
      authorizeOperation: jest.fn().mockResolvedValue({ authorized: true }),
      monitorAndJudgeDelayRisk: jest.fn().mockResolvedValue([
        {
          riskJudgmentId: 'risk-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          workInstructionId: 'work-001',
          riskLevel: 'high',
          riskScore: 85,
          delayPredictionDays: 2,
          currentProgressRate: 45,
          plannedProgressRate: 60,
          delayReasonClassification: 'personnel_shortage',
        },
      ]),
      getWorkerWithProficiencyAndProductivity: jest.fn().mockResolvedValue([
        {
          workerId: 'worker-001',
          workerName: 'John Doe',
          proficiencyLevel: 'intermediate',
          assignedTaskDifficulty: 'medium',
          allocatedWorkHours: 8,
          expectedProductivityRate: 85,
        },
      ]),
      generateAllocationPlans: jest.fn().mockResolvedValue([
        {
          allocationPlanId: 'plan-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          workInstructionId: 'work-001',
          proposedWorkerAssignments: [
            {
              workerId: 'worker-001',
              workerName: 'John Doe',
              proficiencyLevel: 'intermediate',
              assignedTaskDifficulty: 'medium',
              allocatedWorkHours: 8,
              expectedProductivityRate: 85,
            },
          ],
          expectedCompletionDate: '2024-12-31T18:00:00Z',
          feasibilityScore: 92,
          recommendationReason: 'Optimal allocation based on proficiency and productivity',
          proficiencyAdjustmentApplied: true,
        },
      ]),
      judgeAllocationPlanApprovalWithCriteria: jest.fn().mockResolvedValue({
        approvalStatus: 'auto_approved',
        approverUserId: 'approver-001',
        judgmentReason: 'Within auto-approval criteria',
        judgmentTimestamp: new Date().toISOString(),
      }),
      deliverAllocationPlanAndWorkInstructions: jest.fn().mockResolvedValue([
        {
          deliveryId: 'delivery-001',
          allocationPlanId: 'plan-001',
          recipientId: 'leader-001',
          deliveryMethod: 'notification',
          deliveryStatus: 'delivered',
          deliveryTimestamp: new Date().toISOString(),
          receivedAt: new Date().toISOString(),
        },
      ]),
      saveDelayRiskJudgment: jest.fn().mockResolvedValue({ success: true }),
      saveAllocationPlan: jest.fn().mockResolvedValue({ success: true }),
      recordOperationAudit: jest.fn().mockResolvedValue({ success: true }),
    } as unknown as jest.Mocked<Tx3Imp1AiClient>;
  });

  it('正常系：実行完了時にexecutionIdが一意に割り当てられる', async () => {
    // モック化された認可・監視・最適化・承認・配信処理を準備している（beforeEachで実施）

    // runTx3Imp1Agent を呼び出す
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      teamIds: undefined,
      riskThresholdScore: undefined,
      approverUserId: undefined,
      executionContext: undefined,
    };

    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input, mockAiClient);

    // executionId フィールドが存在し、空文字列でなく、UUID形式またはシステムで一意と判定できる値を持つこと
    expect(output.executionId).toBeDefined();
    expect(output.executionId).not.toBe('');
    expect(output.executionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // executionStatus が 'success' であること
    expect(output.executionStatus).toBe('success');

    // delayRiskJudgmentResults、generatedAllocationPlans、deliveryResults がそれぞれ1件以上の配列
    expect(Array.isArray(output.delayRiskJudgmentResults)).toBe(true);
    expect(output.delayRiskJudgmentResults.length).toBeGreaterThanOrEqual(1);

    expect(Array.isArray(output.generatedAllocationPlans)).toBe(true);
    expect(output.generatedAllocationPlans.length).toBeGreaterThanOrEqual(1);

    expect(Array.isArray(output.deliveryResults)).toBe(true);
    expect(output.deliveryResults.length).toBeGreaterThanOrEqual(1);

    // approvalStatus が 'auto_approved'
    expect(output.approvalStatus).toBe('auto_approved');

    // executionTimestamp が ISO 8601形式のタイムスタンプ文字列
    expect(output.executionTimestamp).toBeDefined();
    expect(typeof output.executionTimestamp).toBe('string');
    expect(new Date(output.executionTimestamp).toISOString()).toBeDefined();

    // 同一入力で複数回呼び出した場合、返される executionId は毎回異なることを確認
    const output2: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input, mockAiClient);
    expect(output2.executionId).toBeDefined();
    expect(output2.executionId).not.toBe(output.executionId);
  });
});