import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";
import { Tx4Imp1AgentInput, Tx4Imp1AgentOutput } from "../../src/agents/tx-4-imp-1/orchestrator";

describe("SCEN-072: autoApprovalEnabled が true の場合の自動承認と配置指示配信", () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue({
      authorized: true,
      userId: "user-001",
    });

    mockMonitorAndJudgeDelayRisk = jest.fn().mockResolvedValue({
      delayRiskJudgments: [
        {
          workInstructionId: "instr-001",
          riskLevel: "high",
          riskScore: 65,
          delayPredictionDays: 2,
          recommendedAction: "Increase staffing",
        },
        {
          workInstructionId: "instr-002",
          riskLevel: "high",
          riskScore: 72,
          delayPredictionDays: 3,
          recommendedAction: "Expedite priority",
        },
        {
          workInstructionId: "instr-003",
          riskLevel: "medium",
          riskScore: 58,
          delayPredictionDays: 1,
          recommendedAction: "Monitor closely",
        },
      ],
    });

    mockGenerateAllocationPlans = jest
      .fn()
      .mockResolvedValue({
        allocationPlans: [
          {
            allocationPlanId: "plan-001",
            facilityId: "fac-001",
            teamId: "team-001",
            workerAllocations: [
              {
                workerId: "worker-001",
                workerName: "Worker A",
                proficiencyLevel: "intermediate",
                assignedWorkType: "assembly",
                allocatedHours: 8,
                productivityRate: 85,
              },
            ],
            feasibilityScore: 0.85,
            expectedCompletionDate: "2024-12-20",
            estimatedCost: 5000,
          },
          {
            allocationPlanId: "plan-002",
            facilityId: "fac-001",
            teamId: "team-002",
            workerAllocations: [
              {
                workerId: "worker-002",
                workerName: "Worker B",
                proficiencyLevel: "advanced",
                assignedWorkType: "inspection",
                allocatedHours: 6,
                productivityRate: 92,
              },
            ],
            feasibilityScore: 0.92,
            expectedCompletionDate: "2024-12-19",
            estimatedCost: 4500,
          },
          {
            allocationPlanId: "plan-003",
            facilityId: "fac-002",
            teamId: "team-003",
            workerAllocations: [
              {
                workerId: "worker-003",
                workerName: "Worker C",
                proficiencyLevel: "beginner",
                assignedWorkType: "packing",
                allocatedHours: 10,
                productivityRate: 85,
              },
            ],
            feasibilityScore: 0.85,
            expectedCompletionDate: "2024-12-21",
            estimatedCost: 5500,
          },
          {
            allocationPlanId: "plan-004",
            facilityId: "fac-002",
            teamId: "team-004",
            workerAllocations: [
              {
                workerId: "worker-004",
                workerName: "Worker D",
                proficiencyLevel: "expert",
                assignedWorkType: "assembly",
                allocatedHours: 8,
                productivityRate: 92,
              },
            ],
            feasibilityScore: 0.92,
            expectedCompletionDate: "2024-12-18",
            estimatedCost: 6000,
          },
        ],
      });

    mockJudgeAllocationPlanApprovalWithCriteria = jest
      .fn()
      .mockResolvedValue({
        approvalResults: [
          {
            allocationPlanId: "plan-001",
            approvalStatus: "auto_approved",
            approvalReason: "Plan meets auto-approval criteria",
            approverUserId: null,
            approvalTimestamp: new Date().toISOString(),
          },
          {
            allocationPlanId: "plan-002",
            approvalStatus: "auto_approved",
            approvalReason: "Plan meets auto-approval criteria",
            approverUserId: null,
            approvalTimestamp: new Date().toISOString(),
          },
          {
            allocationPlanId: "plan-003",
            approvalStatus: "auto_approved",
            approvalReason: "Plan meets auto-approval criteria",
            approverUserId: null,
            approvalTimestamp: new Date().toISOString(),
          },
          {
            allocationPlanId: "plan-004",
            approvalStatus: "auto_approved",
            approvalReason: "Plan meets auto-approval criteria",
            approverUserId: null,
            approvalTimestamp: new Date().toISOString(),
          },
        ],
      });

    mockDeliverAllocationPlanAndWorkInstructions = jest
      .fn()
      .mockResolvedValue({
        deliveredInstructions: [
          {
            workInstructionId: "winstr-001",
            deliveryMethod: "handy_terminal",
            deliveredToFieldLeaderId: "leader-001",
            deliveryTimestamp: new Date().toISOString(),
            deliveryStatus: "delivered",
          },
          {
            workInstructionId: "winstr-002",
            deliveryMethod: "email",
            deliveredToFieldLeaderId: "leader-001",
            deliveryTimestamp: new Date().toISOString(),
            deliveryStatus: "delivered",
          },
          {
            workInstructionId: "winstr-003",
            deliveryMethod: "handy_terminal",
            deliveredToFieldLeaderId: "leader-002",
            deliveryTimestamp: new Date().toISOString(),
            deliveryStatus: "delivered",
          },
          {
            workInstructionId: "winstr-004",
            deliveryMethod: "system_notification",
            deliveredToFieldLeaderId: "leader-002",
            deliveryTimestamp: new Date().toISOString(),
            deliveryStatus: "delivered",
          },
        ],
      });

    mockRecordOperationAudit = jest.fn().mockResolvedValue({
      auditId: "audit-001",
      success: true,
    });
  });

  test("should auto-approve all allocation plans and deliver instructions when autoApprovalEnabled is true", async () => {
    const input: Tx4Imp1AgentInput = {
      userId: "user-001",
      facilityIds: ["fac-001", "fac-002"],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: true,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    };

    const output: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, aiClient);

    // Verify authorization was called
    expect(mockAuthorizeOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-001",
      })
    );

    // Verify delay risk monitoring was called
    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalled();

    // Verify allocation plans were generated
    expect(mockGenerateAllocationPlans).toHaveBeenCalled();

    // Verify approval judgment was called with autoApprovalEnabled=true and 4 allocation plans
    expect(mockJudgeAllocationPlanApprovalWithCriteria).toHaveBeenCalledWith(
      expect.objectContaining({
        autoApprovalEnabled: true,
        allocationPlans: expect.arrayContaining([
          expect.objectContaining({ allocationPlanId: "plan-001" }),
          expect.objectContaining({ allocationPlanId: "plan-002" }),
          expect.objectContaining({ allocationPlanId: "plan-003" }),
          expect.objectContaining({ allocationPlanId: "plan-004" }),
        ]),
      })
    );

    // Verify delivery was called
    expect(mockDeliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();

    // Verify audit logging was called
    expect(mockRecordOperationAudit).toHaveBeenCalled();

    // Verify output structure
    expect(output).toBeDefined();
    expect(output.executionId).toBeDefined();
    expect(typeof output.executionId).toBe("string");
    expect(output.executionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    expect(output.monitoringTimestamp).toBeDefined();
    expect(typeof output.monitoringTimestamp).toBe("string");
    expect(() => new Date(output.monitoringTimestamp)).not.toThrow();

    // Verify delay risk judgments
    expect(output.delayRiskJudgments).toHaveLength(3);
    expect(output.delayRiskJudgments[0].riskScore).toBe(65);
    expect(output.delayRiskJudgments[1].riskScore).toBe(72);
    expect(output.delayRiskJudgments[2].riskScore).toBe(58);

    // Verify identified facilities (only those with risk score >= 60)
    expect(output.identifiedFacilities).toHaveLength(2);
    expect(output.identifiedFacilities[0].highestRiskScore).toBeGreaterThanOrEqual(
      60
    );
    expect(output.identifiedFacilities[1].highestRiskScore).toBeGreaterThanOrEqual(
      60
    );
    // Verify priority ranking (lower number = higher priority)
    expect(output.identifiedFacilities[0].riskPriority).toBeLessThan(
      output.identifiedFacilities[1].riskPriority
    );

    // Verify allocation plans
    expect(output.generatedAllocationPlans).toHaveLength(4);
    expect(output.generatedAllocationPlans[0].allocationPlanId).toBe("plan-001");
    expect(output.generatedAllocationPlans[1].allocationPlanId).toBe("plan-002");
    expect(output.generatedAllocationPlans[2].allocationPlanId).toBe("plan-003");
    expect(output.generatedAllocationPlans[3].allocationPlanId).toBe("plan-004");

    // Verify approval results: ALL must be auto-approved
    expect(output.approvalResults).toHaveLength(4);
    output.approvalResults.forEach((approval) => {
      expect(approval.approvalStatus).toBe("auto_approved");
      expect(approval.approverUserId).toBeNull();
      expect(approval.approvalTimestamp).toBeDefined();
      expect(typeof approval.approvalTimestamp).toBe("string");
      expect(() => new Date(approval.approvalTimestamp)).not.toThrow();
    });

    // Verify delivered instructions
    expect(output.deliveredInstructions).toHaveLength(4);
    output.deliveredInstructions.forEach((instruction) => {
      expect(instruction.workInstructionId).toBeDefined();
      expect(instruction.deliveryStatus).toBe("delivered");
      expect(instruction.deliveryTimestamp).toBeDefined();
      expect(typeof instruction.deliveryTimestamp).toBe("string");
      expect(() => new Date(instruction.deliveryTimestamp)).not.toThrow();
    });

    // Verify execution status
    expect(output.executionStatus).toBe("completed");
    expect(output.errorSummary).toBeNull();
  });
});