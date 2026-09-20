import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import {
  Tx4Imp1AgentInput,
  Tx4Imp1AgentOutput,
  DelayRiskJudgmentResult,
  IdentifiedFacilityForAction,
  AllocationPlanProposal,
  AllocationPlanApprovalResult,
  DeliveredWorkInstruction,
} from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-074: delayRiskJudgments複数件時のidentifiedFacilitiesリスク優先度ランク付け', () => {
  it('複数のリスク判定結果が含まれる場合、identifiedFacilitiesはリスク優先度でランク付けされて出力される', async () => {
    // テスト用パラメータ準備
    const userId = 'test-user-001';
    const facilityIds = ['facility-001', 'facility-002', 'facility-003'];
    const monitoringIntervalMinutes = 15;
    const riskThresholdScore = 60;

    const input: Tx4Imp1AgentInput = {
      userId,
      facilityIds,
      monitoringIntervalMinutes,
      riskThresholdScore,
      autoApprovalEnabled: false,
    };

    // モック用のDelayRiskJudgmentResult配列（異なるリスクスコア）
    const mockDelayRiskJudgments: DelayRiskJudgmentResult[] = [
      {
        facilityId: 'facility-001',
        facilityName: 'Facility A',
        riskLevel: 'HIGH',
        riskScore: 85,
        delayPredictionDays: 3,
        currentProgressRate: 45,
        plannedProgressRate: 65,
        recommendedAction: 'Increase staffing',
      },
      {
        facilityId: 'facility-002',
        facilityName: 'Facility B',
        riskLevel: 'MEDIUM',
        riskScore: 72,
        delayPredictionDays: 2,
        currentProgressRate: 55,
        plannedProgressRate: 70,
        recommendedAction: 'Reallocate resources',
      },
      {
        facilityId: 'facility-003',
        facilityName: 'Facility C',
        riskLevel: 'MEDIUM',
        riskScore: 65,
        delayPredictionDays: 1,
        currentProgressRate: 60,
        plannedProgressRate: 75,
        recommendedAction: 'Monitor closely',
      },
    ];

    // モック用のAllocationPlanProposal配列
    const mockAllocationPlans: AllocationPlanProposal[] = [
      {
        allocationPlanId: 'plan-001',
        facilityId: 'facility-001',
        allocatedWorkers: [],
        proposedStartTime: new Date().toISOString(),
        proposedEndTime: new Date(Date.now() + 86400000).toISOString(),
        feasibilityScore: 85,
        recommendationRank: 1,
      },
      {
        allocationPlanId: 'plan-002',
        facilityId: 'facility-002',
        allocatedWorkers: [],
        proposedStartTime: new Date().toISOString(),
        proposedEndTime: new Date(Date.now() + 86400000).toISOString(),
        feasibilityScore: 75,
        recommendationRank: 2,
      },
      {
        allocationPlanId: 'plan-003',
        facilityId: 'facility-003',
        allocatedWorkers: [],
        proposedStartTime: new Date().toISOString(),
        proposedEndTime: new Date(Date.now() + 86400000).toISOString(),
        feasibilityScore: 70,
        recommendationRank: 3,
      },
    ];

    // モック用のAllocationPlanApprovalResult配列
    const mockApprovalResults: AllocationPlanApprovalResult[] = [
      {
        allocationPlanId: 'plan-001',
        approvalStatus: 'pending_approval',
        approvalReason: 'Awaiting human review',
        approverUserId: null,
        approvalTimestamp: new Date().toISOString(),
      },
      {
        allocationPlanId: 'plan-002',
        approvalStatus: 'pending_approval',
        approvalReason: 'Awaiting human review',
        approverUserId: null,
        approvalTimestamp: new Date().toISOString(),
      },
      {
        allocationPlanId: 'plan-003',
        approvalStatus: 'pending_approval',
        approvalReason: 'Awaiting human review',
        approverUserId: null,
        approvalTimestamp: new Date().toISOString(),
      },
    ];

    // モック用のDeliveredWorkInstruction配列
    const mockDeliveredInstructions: DeliveredWorkInstruction[] = [
      {
        workInstructionId: 'instr-001',
        deliveryMethod: 'system_notification',
        deliveredToFieldLeaderId: 'leader-001',
        deliveryTimestamp: new Date().toISOString(),
        deliveryStatus: 'delivered',
      },
      {
        workInstructionId: 'instr-002',
        deliveryMethod: 'system_notification',
        deliveredToFieldLeaderId: 'leader-002',
        deliveryTimestamp: new Date().toISOString(),
        deliveryStatus: 'delivered',
      },
      {
        workInstructionId: 'instr-003',
        deliveryMethod: 'system_notification',
        deliveredToFieldLeaderId: 'leader-003',
        deliveryTimestamp: new Date().toISOString(),
        deliveryStatus: 'delivered',
      },
    ];

    // 実装側でモックを設定（アクチュアルな実装に従う）
    // ここではrunTx4Imp1Agentが直接返す値を想定
    const expectedOutput: Tx4Imp1AgentOutput = {
      executionId: 'exec-' + Date.now(),
      monitoringTimestamp: new Date().toISOString(),
      delayRiskJudgments: mockDelayRiskJudgments,
      identifiedFacilities: [
        {
          facilityId: 'facility-001',
          facilityName: 'Facility A',
          riskPriority: 1,
          highestRiskScore: 85,
          affectedTeamCount: 2,
          affectedWorkInstructionCount: 5,
        },
        {
          facilityId: 'facility-002',
          facilityName: 'Facility B',
          riskPriority: 2,
          highestRiskScore: 72,
          affectedTeamCount: 1,
          affectedWorkInstructionCount: 3,
        },
        {
          facilityId: 'facility-003',
          facilityName: 'Facility C',
          riskPriority: 3,
          highestRiskScore: 65,
          affectedTeamCount: 1,
          affectedWorkInstructionCount: 2,
        },
      ],
      generatedAllocationPlans: mockAllocationPlans,
      approvalResults: mockApprovalResults,
      deliveredInstructions: mockDeliveredInstructions,
      executionStatus: 'completed',
      errorSummary: null,
    };

    // 実装がモック・スタブを受け取る場合のテスト
    // 注：実装がDIで依存を受け取る場合、以下のようにモック化
    const output = await runTx4Imp1Agent(input, {
      authorizeOperation: jest
        .fn()
        .mockResolvedValue({ authorized: true }),
      monitorAndJudgeDelayRisk: jest
        .fn()
        .mockResolvedValue(mockDelayRiskJudgments),
      generateAllocationPlans: jest
        .fn()
        .mockResolvedValue(mockAllocationPlans),
      judgeAllocationPlanApprovalWithCriteria: jest
        .fn()
        .mockResolvedValue(mockApprovalResults),
      deliverAllocationPlanAndWorkInstructions: jest
        .fn()
        .mockResolvedValue(mockDeliveredInstructions),
      recordOperationAudit: jest.fn().mockResolvedValue({ recorded: true }),
    });

    // 期待結果の検証
    expect(output.executionStatus).toBe('completed');
    expect(output.executionId).toBeDefined();
    expect(output.monitoringTimestamp).toBeDefined();
    expect(output.errorSummary).toBeNull();

    // identifiedFacilitiesがリスク優先度でソートされているか確認
    expect(output.identifiedFacilities).toHaveLength(3);
    expect(output.identifiedFacilities[0].riskPriority).toBe(1);
    expect(output.identifiedFacilities[0].highestRiskScore).toBe(85);
    expect(output.identifiedFacilities[0].facilityId).toBe('facility-001');

    expect(output.identifiedFacilities[1].riskPriority).toBe(2);
    expect(output.identifiedFacilities[1].highestRiskScore).toBe(72);
    expect(output.identifiedFacilities[1].facilityId).toBe('facility-002');

    expect(output.identifiedFacilities[2].riskPriority).toBe(3);
    expect(output.identifiedFacilities[2].highestRiskScore).toBe(65);
    expect(output.identifiedFacilities[2].facilityId).toBe('facility-003');

    // 出力される配列が全て存在すること
    expect(output.delayRiskJudgments).toHaveLength(3);
    expect(output.generatedAllocationPlans).toHaveLength(3);
    expect(output.approvalResults).toHaveLength(3);
    expect(output.deliveredInstructions).toHaveLength(3);
  });
});