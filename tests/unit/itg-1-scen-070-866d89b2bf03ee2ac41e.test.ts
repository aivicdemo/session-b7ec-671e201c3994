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

describe('SCEN-070: monitoringIntervalMinutes デフォルト値適用テスト', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue({ authorized: true });

    const mockDelayRiskJudgments: DelayRiskJudgmentResult[] = [
      {
        workInstructionId: 'wi-001',
        riskLevel: 'high',
        delayedDays: 2,
        recommendedAction: 'Increase staffing',
      },
    ];

    mockMonitorAndJudgeDelayRisk = jest
      .fn()
      .mockResolvedValue(mockDelayRiskJudgments);

    const mockAllocationPlans: AllocationPlanProposal[] = [
      {
        allocationPlanId: 'plan-001',
        proposedAllocations: [
          {
            workerId: 'worker-001',
            workerName: 'Test Worker',
            proficiencyLevel: 'intermediate',
            assignedWorkType: 'assembly',
            allocatedHours: 8,
            productivityRate: 85,
          },
        ],
        expectedCompletionDate: '2024-12-31T18:00:00Z',
        feasibilityScore: 92,
        recommendationRank: 1,
      },
    ];

    mockGenerateAllocationPlans = jest
      .fn()
      .mockResolvedValue(mockAllocationPlans);

    const mockApprovalResults: AllocationPlanApprovalResult[] = [
      {
        allocationPlanId: 'plan-001',
        approvalStatus: 'auto_approved',
        approvalReason: 'Meets auto-approval criteria',
        approverUserId: null,
        approvalTimestamp: '2024-12-24T10:00:00Z',
      },
    ];

    mockJudgeAllocationPlanApprovalWithCriteria = jest
      .fn()
      .mockResolvedValue(mockApprovalResults);

    const mockDeliveredInstructions: DeliveredWorkInstruction[] = [
      {
        workInstructionId: 'wi-001',
        deliveryMethod: 'handy_terminal',
        deliveredToFieldLeaderId: 'leader-001',
        deliveryTimestamp: '2024-12-24T10:05:00Z',
        deliveryStatus: 'delivered',
      },
    ];

    mockDeliverAllocationPlanAndWorkInstructions = jest
      .fn()
      .mockResolvedValue(mockDeliveredInstructions);

    mockRecordOperationAudit = jest.fn().mockResolvedValue({ success: true });

    // グローバルにモック関数を登録
    (global as any).authorizeOperation = mockAuthorizeOperation;
    (global as any).monitorAndJudgeDelayRisk = mockMonitorAndJudgeDelayRisk;
    (global as any).generateAllocationPlans = mockGenerateAllocationPlans;
    (global as any).judgeAllocationPlanApprovalWithCriteria =
      mockJudgeAllocationPlanApprovalWithCriteria;
    (global as any).deliverAllocationPlanAndWorkInstructions =
      mockDeliverAllocationPlanAndWorkInstructions;
    (global as any).recordOperationAudit = mockRecordOperationAudit;
  });

  afterEach(() => {
    delete (global as any).authorizeOperation;
    delete (global as any).monitorAndJudgeDelayRisk;
    delete (global as any).generateAllocationPlans;
    delete (global as any).judgeAllocationPlanApprovalWithCriteria;
    delete (global as any).deliverAllocationPlanAndWorkInstructions;
    delete (global as any).recordOperationAudit;
  });

  it('monitoringIntervalMinutes が未指定の場合、デフォルト値 15 分が適用される', async () => {
    const input: Tx4Imp1AgentInput = {
      userId: 'test-user-001',
      facilityIds: ['FAC-001', 'FAC-002'],
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const output: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    });

    expect(output.executionId).toBeTruthy();
    expect(typeof output.executionId).toBe('string');

    expect(output.monitoringTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    expect(output.delayRiskJudgments).toEqual([
      {
        workInstructionId: 'wi-001',
        riskLevel: 'high',
        delayedDays: 2,
        recommendedAction: 'Increase staffing',
      },
    ]);

    expect(output.identifiedFacilities).toBeDefined();
    expect(Array.isArray(output.identifiedFacilities)).toBe(true);

    expect(output.generatedAllocationPlans).toEqual([
      {
        allocationPlanId: 'plan-001',
        proposedAllocations: [
          {
            workerId: 'worker-001',
            workerName: 'Test Worker',
            proficiencyLevel: 'intermediate',
            assignedWorkType: 'assembly',
            allocatedHours: 8,
            productivityRate: 85,
          },
        ],
        expectedCompletionDate: '2024-12-31T18:00:00Z',
        feasibilityScore: 92,
        recommendationRank: 1,
      },
    ]);

    expect(output.approvalResults).toEqual([
      {
        allocationPlanId: 'plan-001',
        approvalStatus: 'auto_approved',
        approvalReason: 'Meets auto-approval criteria',
        approverUserId: null,
        approvalTimestamp: '2024-12-24T10:00:00Z',
      },
    ]);

    expect(output.deliveredInstructions).toEqual([
      {
        workInstructionId: 'wi-001',
        deliveryMethod: 'handy_terminal',
        deliveredToFieldLeaderId: 'leader-001',
        deliveryTimestamp: '2024-12-24T10:05:00Z',
        deliveryStatus: 'delivered',
      },
    ]);

    expect(output.executionStatus).toBe('completed');
    expect(output.errorSummary).toBeNull();

    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalled();
    const callArgs = mockMonitorAndJudgeDelayRisk.mock.calls[0];
    expect(callArgs).toBeDefined();
    if (callArgs && callArgs[0]) {
      expect(callArgs[0].monitoringIntervalMinutes).toBe(15);
    }
  });
});