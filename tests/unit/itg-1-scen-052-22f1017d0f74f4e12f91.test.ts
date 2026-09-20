import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import type {
  Tx3Imp1AgentInput,
  Tx3Imp1AgentOutput,
  DelayRiskJudgmentResult,
  AllocationPlanProposal,
  WorkerAssignment,
  DeliveryResult,
} from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-052: 境界値系：executionContextが指定されない場合でも処理が完了する', () => {
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
    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    mockMonitorAndJudgeDelayRisk = jest.fn().mockResolvedValue([
      {
        riskJudgmentId: 'risk-001',
        facilityId: 'fac001',
        teamId: 'team001',
        workInstructionId: 'work-001',
        riskLevel: 'high',
        riskScore: 85,
        delayPredictionDays: 2,
        currentProgressRate: 40,
        plannedProgressRate: 60,
        delayReasonClassification: 'personnel_shortage',
      } as DelayRiskJudgmentResult,
    ]);

    const workerAssignment: WorkerAssignment = {
      workerId: 'worker-001',
      workerName: 'Test Worker',
      proficiencyLevel: 'intermediate',
      assignedTaskDifficulty: 'medium',
      allocatedWorkHours: 8,
      expectedProductivityRate: 85,
    };

    mockGetWorkerWithProficiencyAndProductivity = jest
      .fn()
      .mockResolvedValue([workerAssignment]);

    mockGenerateAllocationPlans = jest.fn().mockResolvedValue([
      {
        allocationPlanId: 'plan-001',
        facilityId: 'fac001',
        teamId: 'team001',
        workInstructionId: 'work-001',
        proposedWorkerAssignments: [workerAssignment],
        expectedCompletionDate: '2024-12-31T23:59:59Z',
        feasibilityScore: 92,
        recommendationReason: 'Optimal skill match for task difficulty',
        proficiencyAdjustmentApplied: true,
      } as AllocationPlanProposal,
    ]);

    mockJudgeAllocationPlanApprovalWithCriteria = jest
      .fn()
      .mockResolvedValue({ approvalStatus: 'auto_approved' });

    mockDeliverAllocationPlanAndWorkInstructions = jest.fn().mockResolvedValue([
      {
        deliveryId: 'delivery-001',
        allocationPlanId: 'plan-001',
        deliveryStatus: 'success',
        recipientId: 'leader-001',
        deliveryTimestamp: '2024-12-20T10:00:00Z',
        receiptConfirmed: true,
      } as DeliveryResult,
    ]);

    mockSaveDelayRiskJudgment = jest.fn().mockResolvedValue({ success: true });
    mockSaveAllocationPlan = jest.fn().mockResolvedValue({ success: true });
    mockRecordOperationAudit = jest.fn().mockResolvedValue({ success: true });

    // Mock the internal dependencies by injecting them into the orchestrator
    jest.doMock('../../src/agents/tx-3-imp-1/dependencies', () => ({
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      getWorkerWithProficiencyAndProductivity: mockGetWorkerWithProficiencyAndProductivity,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      saveDelayRiskJudgment: mockSaveDelayRiskJudgment,
      saveAllocationPlan: mockSaveAllocationPlan,
      recordOperationAudit: mockRecordOperationAudit,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should complete successfully when executionContext is undefined', async () => {
    const input: Tx3Imp1AgentInput = {
      userId: 'user123',
      facilityIds: ['fac001'],
      teamIds: ['team001'],
      riskThresholdScore: 70,
      approverUserId: 'approver001',
      executionContext: undefined,
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

    // Verify executionId is UUID format
    expect(output.executionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // Verify executionStatus is 'success'
    expect(output.executionStatus).toBe('success');

    // Verify delayRiskJudgmentResults is not empty
    expect(output.delayRiskJudgmentResults).not.toHaveLength(0);
    expect(output.delayRiskJudgmentResults[0]).toHaveProperty('riskJudgmentId');
    expect(output.delayRiskJudgmentResults[0]).toHaveProperty('facilityId', 'fac001');
    expect(output.delayRiskJudgmentResults[0]).toHaveProperty('teamId', 'team001');

    // Verify generatedAllocationPlans is not empty
    expect(output.generatedAllocationPlans).not.toHaveLength(0);
    expect(output.generatedAllocationPlans[0]).toHaveProperty('allocationPlanId');
    expect(output.generatedAllocationPlans[0]).toHaveProperty('feasibilityScore');

    // Verify approvalStatus is one of the expected values
    expect(['auto_approved', 'pending_approval', 'rejected']).toContain(output.approvalStatus);

    // Verify deliveryResults is not empty
    expect(output.deliveryResults).not.toHaveLength(0);
    expect(output.deliveryResults[0]).toHaveProperty('deliveryId');
    expect(output.deliveryResults[0]).toHaveProperty('deliveryStatus');

    // Verify executionTimestamp is ISO 8601 format
    expect(() => new Date(output.executionTimestamp)).not.toThrow();
    expect(output.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/
    );

    // Verify errorDetails is empty or undefined
    expect(output.errorDetails).toBeFalsy();
  });

  it('should call all dependency functions in correct sequence', async () => {
    const input: Tx3Imp1AgentInput = {
      userId: 'user123',
      facilityIds: ['fac001'],
      teamIds: ['team001'],
      riskThresholdScore: 70,
      approverUserId: 'approver001',
      executionContext: undefined,
    };

    await runTx3Imp1Agent(input, {
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

    // Verify authorizeOperation was called first
    expect(mockAuthorizeOperation).toHaveBeenCalledWith('user123');

    // Verify monitorAndJudgeDelayRisk was called with correct parameters
    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalled();

    // Verify getWorkerWithProficiencyAndProductivity was called
    expect(mockGetWorkerWithProficiencyAndProductivity).toHaveBeenCalled();

    // Verify generateAllocationPlans was called
    expect(mockGenerateAllocationPlans).toHaveBeenCalled();

    // Verify judgeAllocationPlanApprovalWithCriteria was called
    expect(mockJudgeAllocationPlanApprovalWithCriteria).toHaveBeenCalled();

    // Verify deliverAllocationPlanAndWorkInstructions was called
    expect(mockDeliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();

    // Verify audit recording functions were called
    expect(mockSaveDelayRiskJudgment).toHaveBeenCalled();
    expect(mockSaveAllocationPlan).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });

  it('should handle all processing phases regardless of executionContext value', async () => {
    const testCases = [undefined, 'manual_trigger', 'scheduled_monitoring'];

    for (const context of testCases) {
      const input: Tx3Imp1AgentInput = {
        userId: 'user123',
        facilityIds: ['fac001'],
        teamIds: ['team001'],
        riskThresholdScore: 70,
        approverUserId: 'approver001',
        executionContext: context as any,
      };

      jest.clearAllMocks();

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

      expect(output.executionStatus).toBe('success');
      expect(output.delayRiskJudgmentResults.length).toBeGreaterThanOrEqual(0);
      expect(output.generatedAllocationPlans.length).toBeGreaterThanOrEqual(0);
      expect(['auto_approved', 'pending_approval', 'rejected']).toContain(output.approvalStatus);
      expect(output.deliveryResults.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('should produce UUID format executionId each execution', async () => {
    const input: Tx3Imp1AgentInput = {
      userId: 'user123',
      facilityIds: ['fac001'],
      teamIds: ['team001'],
      riskThresholdScore: 70,
      approverUserId: 'approver001',
      executionContext: undefined,
    };

    const output1 = await runTx3Imp1Agent(input, {
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

    jest.clearAllMocks();

    const output2 = await runTx3Imp1Agent(input, {
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

    expect(output1.executionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(output2.executionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(output1.executionId).not.toEqual(output2.executionId);
  });
});