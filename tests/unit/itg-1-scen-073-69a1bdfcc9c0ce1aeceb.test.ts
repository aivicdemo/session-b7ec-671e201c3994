import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type { Tx4Imp1AgentInput, Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-073: autoApprovalEnabled=false で承認待ち状態を確認', () => {
  it('autoApprovalEnabled が false の場合、すべての配置案が承認待ち状態で返される', async () => {
    // テスト入力値を準備
    const input: Tx4Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['facility-A', 'facility-B'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    // モック実装: authorizeOperation
    const mockAuthorizeOperation = jest.fn().mockResolvedValue(true);

    // モック実装: monitorAndJudgeDelayRisk
    const mockMonitorAndJudgeDelayRisk = jest.fn().mockResolvedValue([
      {
        facilityId: 'facility-A',
        facilityName: 'Facility A',
        riskPriority: 1,
        highestRiskScore: 70,
        affectedTeamCount: 1,
        affectedWorkInstructionCount: 2,
      },
    ]);

    // モック実装: generateAllocationPlans
    const mockGenerateAllocationPlans = jest.fn().mockResolvedValue([
      {
        allocationPlanId: 'plan-001',
        facilityId: 'facility-A',
        proposedWorkerCount: 2,
        expectedCompletionDays: 1,
        feasibilityScore: 85,
        recommendationRank: 1,
        workerAllocations: [
          {
            workerId: 'worker-001',
            workerName: 'Worker One',
            proficiencyLevel: 'intermediate',
            assignedWorkType: 'assembly',
            allocatedHours: 8,
            productivityRate: 85,
          },
        ],
      },
    ]);

    // モック実装: judgeAllocationPlanApprovalWithCriteria
    // autoApprovalEnabled=false のため、すべて pending_approval を返す
    const mockJudgeAllocationPlanApprovalWithCriteria = jest
      .fn()
      .mockResolvedValue([
        {
          allocationPlanId: 'plan-001',
          approvalStatus: 'pending_approval',
          approvalReason:
            'Manual approval required as auto-approval is disabled',
          approverUserId: null,
          approvalTimestamp: new Date().toISOString(),
        },
      ]);

    // モック実装: deliverAllocationPlanAndWorkInstructions
    const mockDeliverAllocationPlanAndWorkInstructions = jest
      .fn()
      .mockResolvedValue([
        {
          workInstructionId: 'instr-001',
          deliveryMethod: 'system_notification',
          deliveredToFieldLeaderId: 'leader-001',
          deliveryTimestamp: new Date().toISOString(),
          deliveryStatus: 'delivered',
        },
      ]);

    // モック実装: recordOperationAudit
    const mockRecordOperationAudit = jest.fn().mockResolvedValue(true);

    // AI クライアントモック
    const mockAiClient: Tx4Imp1AiClient = {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    };

    // エージェント実行
    const result = await runTx4Imp1Agent(input, mockAiClient);

    // executionId が文字列で返されることを検証
    expect(typeof result.executionId).toBe('string');
    expect(result.executionId.length).toBeGreaterThan(0);

    // monitoringTimestamp が ISO 8601形式で返されることを検証
    expect(typeof result.monitoringTimestamp).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.monitoringTimestamp)).toBe(
      true,
    );

    // delayRiskJudgments 配列が1件以上含まれることを検証
    expect(Array.isArray(result.delayRiskJudgments)).toBe(true);
    expect(result.delayRiskJudgments.length).toBeGreaterThanOrEqual(1);

    // identifiedFacilities 配列が1件以上含まれることを検証
    expect(Array.isArray(result.identifiedFacilities)).toBe(true);
    expect(result.identifiedFacilities.length).toBeGreaterThanOrEqual(1);

    // generatedAllocationPlans 配列が1件以上含まれることを検証
    expect(Array.isArray(result.generatedAllocationPlans)).toBe(true);
    expect(result.generatedAllocationPlans.length).toBeGreaterThanOrEqual(1);

    // approvalResults 配列が返されることを検証
    expect(Array.isArray(result.approvalResults)).toBe(true);

    // approvalResults の要素数が generatedAllocationPlans と等しいことを確認
    expect(result.approvalResults.length).toBe(
      result.generatedAllocationPlans.length,
    );

    // approvalResults 配列内のすべての要素について、承認ステータスが 'pending_approval' であることを検証
    result.approvalResults.forEach((approval) => {
      expect(approval.approvalStatus).toBe('pending_approval');
      expect(typeof approval.allocationPlanId).toBe('string');
      expect(typeof approval.approvalReason).toBe('string');
      expect(approval.approverUserId).toBeNull();
      expect(typeof approval.approvalTimestamp).toBe('string');
    });

    // deliveredInstructions 配列が返されることを検証
    expect(Array.isArray(result.deliveredInstructions)).toBe(true);

    // executionStatus が 'completed' または 'partial_completion' のいずれかであることを検証
    expect(['completed', 'partial_completion']).toContain(
      result.executionStatus,
    );

    // errorSummary が null であることを検証（正常完了のため）
    expect(result.errorSummary).toBeNull();
  });
});