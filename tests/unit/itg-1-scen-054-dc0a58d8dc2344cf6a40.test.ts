import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import type {
  Tx3Imp1AgentInput,
  Tx3Imp1AgentOutput,
  DelayRiskJudgmentResult,
  AllocationPlanProposal,
  WorkerAssignment,
} from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-054: 正常系：配置案が自動承認基準外で承認者に通知されてapprovalStatusがpending_approvalになる', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockGetWorkerWithProficiencyAndProductivity: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockNotifyApprover: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    mockMonitorAndJudgeDelayRisk = jest.fn().mockResolvedValue({
      delayRiskJudgmentResults: [
        {
          riskJudgmentId: 'risk-001',
          facilityId: 'fac-001',
          teamId: 'team-001',
          workInstructionId: 'wi-001',
          riskLevel: 'high',
          riskScore: 78,
          delayPredictionDays: 2,
          currentProgressRate: 45,
          plannedProgressRate: 65,
          delayReasonClassification: 'personnel_shortage',
        } as DelayRiskJudgmentResult,
      ],
    });

    const workerAssignment: WorkerAssignment = {
      workerId: 'worker-001',
      workerName: 'Worker A',
      proficiencyLevel: 'intermediate',
      assignedTaskDifficulty: 'medium',
      allocatedWorkHours: 8,
      expectedProductivityRate: 85,
    };

    mockGetWorkerWithProficiencyAndProductivity = jest.fn().mockResolvedValue({
      workers: [workerAssignment],
    });

    const allocationPlan: AllocationPlanProposal = {
      allocationPlanId: 'plan-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      workInstructionId: 'wi-001',
      proposedWorkerAssignments: [workerAssignment],
      expectedCompletionDate: '2024-12-31T00:00:00Z',
      feasibilityScore: 72,
      recommendationReason: 'High risk detected, personnel assignment recommended',
      proficiencyAdjustmentApplied: true,
    };

    mockGenerateAllocationPlans = jest.fn().mockResolvedValue({
      generatedAllocationPlans: [allocationPlan, { ...allocationPlan, allocationPlanId: 'plan-002', feasibilityScore: 68 }],
    });

    mockJudgeAllocationPlanApprovalWithCriteria = jest.fn().mockResolvedValue({
      isAutoApproved: false,
      requiresApproverJudgment: true,
      approvalReason: 'Feasibility score below auto-approval threshold',
    });

    mockNotifyApprover = jest.fn().mockResolvedValue({
      notificationId: 'notif-001',
      sentTimestamp: new Date().toISOString(),
    });

    mockSaveAllocationPlan = jest.fn().mockResolvedValue({
      saved: true,
      planIds: ['plan-001', 'plan-002'],
    });

    mockDeliverAllocationPlanAndWorkInstructions = jest.fn().mockResolvedValue({
      deliveryResults: [],
    });

    mockRecordOperationAudit = jest.fn().mockResolvedValue(true);

    jest.spyOn(global, 'crypto', 'get').mockReturnValue({
      randomUUID: () => 'exec-id-12345',
    } as any);
  });

  it('should return approvalStatus as pending_approval when allocation plan fails auto-approval criteria', async () => {
    const input: Tx3Imp1AgentInput = {
      userId: 'user-A001',
      facilityIds: ['fac-001'],
      teamIds: ['team-001'],
      riskThresholdScore: 75,
      approverUserId: 'approver-B001',
      executionContext: 'manual_trigger',
    };

    const aiClient = {
      authorize: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      notifyApprover: mockNotifyApprover,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    };

    const result: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input, aiClient);

    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');

    expect(result.delayRiskJudgmentResults).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);
    expect(result.delayRiskJudgmentResults.length).toBeGreaterThan(0);
    expect(result.delayRiskJudgmentResults[0].riskScore).toBe(78);
    expect(result.delayRiskJudgmentResults[0].riskLevel).toBe('high');

    expect(result.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(result.generatedAllocationPlans)).toBe(true);
    expect(result.generatedAllocationPlans.length).toBeGreaterThan(0);

    expect(result.approvalStatus).toBe('pending_approval');

    expect(result.deliveryResults).toBeDefined();
    expect(Array.isArray(result.deliveryResults)).toBe(true);
    expect(result.deliveryResults.length).toBe(0);

    expect(result.executionStatus).toBe('success');

    expect(result.errorDetails).toBeDefined();
    expect(Array.isArray(result.errorDetails)).toBe(true);
    expect(result.errorDetails.length).toBe(0);

    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');

    expect(mockAuthorizeOperation).toHaveBeenCalledWith('user-A001');
    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalled();
    expect(mockGetWorkerWithProficiencyAndProductivity).toHaveBeenCalled();
    expect(mockGenerateAllocationPlans).toHaveBeenCalled();
    expect(mockJudgeAllocationPlanApprovalWithCriteria).toHaveBeenCalled();
    expect(mockNotifyApprover).toHaveBeenCalledWith('approver-B001', expect.any(Object));
    expect(mockSaveAllocationPlan).toHaveBeenCalled();
    expect(mockDeliverAllocationPlanAndWorkInstructions).not.toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });
});