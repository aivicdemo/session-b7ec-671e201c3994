import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type {
  Tx4Imp1AgentInput,
  Tx4Imp1AgentOutput,
  DelayRiskJudgmentResult,
  IdentifiedFacilityForAction,
  AllocationPlanProposal,
  AllocationPlanApprovalResult,
  DeliveredWorkInstruction,
} from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-078: 正常完了時、errorSummary は null となる', () => {
  it('should return null errorSummary and completed status when all operations succeed', async () => {
    // ステップ1: 入力パラメータを準備する
    const input: Tx4Imp1AgentInput = {
      userId: 'user123',
      facilityIds: ['fac-001', 'fac-002'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    // ステップ2: authorizeOperation スタブを準備する
    const mockDelayRiskJudgments: DelayRiskJudgmentResult[] = [
      {
        facilityId: 'fac-001',
        teamId: 'team-001',
        riskLevel: 'high',
        delayPredictionDays: 2,
        recommendedAction: 'Increase staffing',
      },
    ];

    const mockIdentifiedFacilities: IdentifiedFacilityForAction[] = [
      {
        facilityId: 'fac-001',
        facilityName: 'Facility A',
        riskPriority: 1,
        highestRiskScore: 75,
        affectedTeamCount: 1,
        affectedWorkInstructionCount: 5,
      },
    ];

    const mockAllocationPlans: AllocationPlanProposal[] = [
      {
        allocationPlanId: 'plan-001',
        targetFacilityId: 'fac-001',
        targetTeamId: 'team-001',
        workerAllocations: [
          {
            workerId: 'worker-001',
            workerName: 'Worker A',
            proficiencyLevel: 'intermediate',
            assignedWorkType: 'assembly',
            allocatedHours: 8,
            productivityRate: 85,
          },
        ],
        expectedCompletionDate: '2025-01-15T17:00:00Z',
        feasibilityScore: 92,
        recommendedRank: 1,
      },
    ];

    const mockApprovalResults: AllocationPlanApprovalResult[] = [
      {
        allocationPlanId: 'plan-001',
        approvalStatus: 'pending_approval',
        approvalReason: 'Awaiting manager review',
        approverUserId: null,
        approvalTimestamp: new Date().toISOString(),
      },
    ];

    const mockDeliveredInstructions: DeliveredWorkInstruction[] = [
      {
        workInstructionId: 'instr-001',
        deliveryMethod: 'handy_terminal',
        deliveredToFieldLeaderId: 'leader-001',
        deliveryTimestamp: new Date().toISOString(),
        deliveryStatus: 'delivered',
      },
    ];

    // ステップ3-7: AIクライアント実装をモック化
    const mockAiClient = {
      authorizeOperation: jest.fn().mockResolvedValue({ authorized: true }),
      monitorAndJudgeDelayRisk: jest.fn().mockResolvedValue(mockDelayRiskJudgments),
      generateAllocationPlans: jest.fn().mockResolvedValue(mockAllocationPlans),
      judgeAllocationPlanApprovalWithCriteria: jest.fn().mockResolvedValue(mockApprovalResults),
      deliverAllocationPlanAndWorkInstructions: jest.fn().mockResolvedValue(mockDeliveredInstructions),
      recordOperationAudit: jest.fn().mockResolvedValue({ recorded: true }),
    };

    // ステップ8: runTx4Imp1Agent に入力パラメータとAIクライアントを渡して呼び出す
    const output = await runTx4Imp1Agent(input, mockAiClient as any);

    // ステップ9: 返却された Tx4Imp1AgentOutput を検証する
    expect(output.errorSummary).toBeNull();
    expect(output.executionStatus).toBe('completed');
    expect(output.executionId).toBeDefined();
    expect(typeof output.executionId).toBe('string');
    expect(output.executionId.length).toBeGreaterThan(0);

    expect(output.monitoringTimestamp).toBeDefined();
    expect(typeof output.monitoringTimestamp).toBe('string');
    // ISO 8601形式の検証
    expect(() => new Date(output.monitoringTimestamp)).not.toThrow();
    expect(output.monitoringTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );

    expect(output.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(output.delayRiskJudgments)).toBe(true);
    expect(output.delayRiskJudgments.length).toBeGreaterThanOrEqual(1);
    output.delayRiskJudgments.forEach((judgment) => {
      expect(judgment).toHaveProperty('facilityId');
      expect(judgment).toHaveProperty('teamId');
      expect(judgment).toHaveProperty('riskLevel');
    });

    expect(output.identifiedFacilities).toBeDefined();
    expect(Array.isArray(output.identifiedFacilities)).toBe(true);
    expect(output.identifiedFacilities.length).toBeGreaterThanOrEqual(1);
    output.identifiedFacilities.forEach((facility) => {
      expect(facility).toHaveProperty('facilityId');
      expect(facility).toHaveProperty('facilityName');
      expect(facility).toHaveProperty('riskPriority');
      expect(facility).toHaveProperty('highestRiskScore');
    });

    expect(output.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(output.generatedAllocationPlans)).toBe(true);
    expect(output.generatedAllocationPlans.length).toBeGreaterThanOrEqual(1);
    output.generatedAllocationPlans.forEach((plan) => {
      expect(plan).toHaveProperty('allocationPlanId');
      expect(plan).toHaveProperty('workerAllocations');
    });

    expect(output.approvalResults).toBeDefined();
    expect(Array.isArray(output.approvalResults)).toBe(true);
    expect(output.approvalResults.length).toBeGreaterThanOrEqual(1);
    expect(
      output.approvalResults.some(
        (result) => result.approvalStatus === 'pending_approval'
      )
    ).toBe(true);
    output.approvalResults.forEach((result) => {
      expect(result).toHaveProperty('allocationPlanId');
      expect(result).toHaveProperty('approvalStatus');
      expect(result).toHaveProperty('approvalReason');
      expect(result).toHaveProperty('approvalTimestamp');
    });

    expect(output.deliveredInstructions).toBeDefined();
    expect(Array.isArray(output.deliveredInstructions)).toBe(true);
    expect(output.deliveredInstructions.length).toBeGreaterThanOrEqual(1);
    output.deliveredInstructions.forEach((instruction) => {
      expect(instruction).toHaveProperty('workInstructionId');
      expect(instruction).toHaveProperty('deliveryMethod');
      expect(instruction).toHaveProperty('deliveredToFieldLeaderId');
      expect(instruction).toHaveProperty('deliveryTimestamp');
      expect(instruction).toHaveProperty('deliveryStatus');
    });
  });
});