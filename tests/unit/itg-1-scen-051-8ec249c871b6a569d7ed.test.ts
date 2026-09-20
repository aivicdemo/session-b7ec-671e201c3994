import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { Tx3Imp1AgentInput, Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-051: 境界値系：riskThresholdScoreがデフォルト値70で遅延リスク判定が実行される', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockGetWorkerWithProficiencyAndProductivity: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockSaveDelayRiskJudgment: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    mockAuthorizeOperation = jest.fn().mockResolvedValue({ authorized: true });

    mockMonitorAndJudgeDelayRisk = jest.fn().mockResolvedValue([
      {
        riskJudgmentId: 'risk-001',
        facilityId: 'facility-01',
        teamId: 'team-01',
        workInstructionId: 'work-001',
        riskLevel: 'high',
        riskScore: 75,
        delayPredictionDays: 2,
        currentProgressRate: 45,
        plannedProgressRate: 60,
        delayReasonClassification: 'personnel_shortage',
      },
    ]);

    mockGetWorkerWithProficiencyAndProductivity = jest.fn().mockResolvedValue([
      {
        workerId: 'worker-001',
        workerName: 'Worker A',
        proficiencyLevel: 'intermediate',
        currentProductivityRate: 85,
        availableHours: 8,
      },
      {
        workerId: 'worker-002',
        workerName: 'Worker B',
        proficiencyLevel: 'advanced',
        currentProductivityRate: 95,
        availableHours: 6,
      },
    ]);

    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([
      {
        allocationPlanId: 'plan-001',
        facilityId: 'facility-01',
        teamId: 'team-01',
        workInstructionId: 'work-001',
        proposedWorkerAssignments: [
          {
            workerId: 'worker-002',
            workerName: 'Worker B',
            proficiencyLevel: 'advanced',
            assignedTaskDifficulty: 'hard',
            allocatedWorkHours: 6,
            expectedProductivityRate: 92,
          },
        ],
        expectedCompletionDate: '2024-01-15T18:00:00Z',
        feasibilityScore: 88,
        recommendationReason: 'High-skilled worker assigned to accelerate completion',
        proficiencyAdjustmentApplied: true,
      },
    ]);

    mockJudgeAllocationPlanApprovalWithCriteria = jest
      .fn()
      .mockResolvedValue({ approvalStatus: 'auto_approved' });

    mockDeliverAllocationPlanAndWorkInstructions = jest.fn().mockResolvedValue([
      {
        deliveryId: 'delivery-001',
        planId: 'plan-001',
        recipientId: 'leader-001',
        deliveryStatus: 'delivered',
        deliveryTimestamp: '2024-01-14T10:05:00Z',
        receiptConfirmationTimestamp: '2024-01-14T10:06:00Z',
      },
    ]);

    mockSaveDelayRiskJudgment = jest.fn().mockResolvedValue({ success: true });
    mockSaveAllocationPlan = jest.fn().mockResolvedValue({ success: true });
    mockRecordOperationAudit = jest.fn().mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should execute delay risk judgment with default riskThresholdScore of 70 when not explicitly provided', async () => {
    const input: Tx3Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['facility-01'],
      teamIds: ['team-01'],
      approverUserId: 'approver-001',
      executionContext: 'manual_trigger',
      // riskThresholdScore is intentionally omitted to test default value of 70
    };

    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      saveDelayRiskJudgment: mockSaveDelayRiskJudgment,
      saveAllocationPlan: mockSaveAllocationPlan,
      recordOperationAudit: mockRecordOperationAudit,
    });

    expect(output).toBeDefined();
    expect(output.executionId).toBeDefined();
    expect(typeof output.executionId).toBe('string');
    expect(output.executionId.length).toBeGreaterThan(0);

    expect(output.delayRiskJudgmentResults).toBeDefined();
    expect(Array.isArray(output.delayRiskJudgmentResults)).toBe(true);
    expect(output.delayRiskJudgmentResults.length).toBeGreaterThanOrEqual(1);
    expect(output.delayRiskJudgmentResults[0]).toHaveProperty('riskJudgmentId');
    expect(output.delayRiskJudgmentResults[0]).toHaveProperty('riskLevel');
    expect(output.delayRiskJudgmentResults[0]).toHaveProperty('riskScore');

    expect(output.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(output.generatedAllocationPlans)).toBe(true);
    expect(output.generatedAllocationPlans.length).toBeGreaterThanOrEqual(1);
    expect(output.generatedAllocationPlans[0]).toHaveProperty('allocationPlanId');
    expect(output.generatedAllocationPlans[0]).toHaveProperty('proposedWorkerAssignments');

    expect(output.approvalStatus).toBe('auto_approved');

    expect(output.deliveryResults).toBeDefined();
    expect(Array.isArray(output.deliveryResults)).toBe(true);
    expect(output.deliveryResults.length).toBeGreaterThanOrEqual(1);
    expect(output.deliveryResults[0]).toHaveProperty('deliveryStatus');

    expect(output.executionStatus).toBe('success');

    expect(output.executionTimestamp).toBeDefined();
    expect(typeof output.executionTimestamp).toBe('string');
    const timestamp = new Date(output.executionTimestamp);
    expect(timestamp.getTime()).not.toBeNaN();

    if (output.errorDetails !== undefined) {
      expect(Array.isArray(output.errorDetails)).toBe(true);
      expect(output.errorDetails.length).toBe(0);
    }

    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalled();
    const monitorCall = mockMonitorAndJudgeDelayRisk.mock.calls[0];
    expect(monitorCall).toBeDefined();
    expect(monitorCall.length).toBeGreaterThanOrEqual(2);

    const callArg = monitorCall[1];
    expect(callArg).toBeDefined();
    expect(callArg.riskThresholdScore).toBe(70);
  });
});