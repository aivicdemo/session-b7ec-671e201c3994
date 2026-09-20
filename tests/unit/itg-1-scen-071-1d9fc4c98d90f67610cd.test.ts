import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { Tx4Imp1AgentInput, Tx4Imp1AgentOutput } from '../../src/agents/tx-4-imp-1/orchestrator';

jest.mock('../../src/agents/tx-4-imp-1/dependencies/authorization', () => ({
  authorizeOperation: jest.fn()
}));

jest.mock('../../src/agents/tx-4-imp-1/dependencies/risk-judgment', () => ({
  monitorAndJudgeDelayRisk: jest.fn()
}));

jest.mock('../../src/agents/tx-4-imp-1/dependencies/allocation-planning', () => ({
  generateAllocationPlans: jest.fn()
}));

jest.mock('../../src/agents/tx-4-imp-1/dependencies/approval-judgment', () => ({
  judgeAllocationPlanApprovalWithCriteria: jest.fn()
}));

jest.mock('../../src/agents/tx-4-imp-1/dependencies/delivery', () => ({
  deliverAllocationPlanAndWorkInstructions: jest.fn()
}));

jest.mock('../../src/agents/tx-4-imp-1/dependencies/audit', () => ({
  recordOperationAudit: jest.fn()
}));

import { authorizeOperation } from '../../src/agents/tx-4-imp-1/dependencies/authorization';
import { monitorAndJudgeDelayRisk } from '../../src/agents/tx-4-imp-1/dependencies/risk-judgment';
import { generateAllocationPlans } from '../../src/agents/tx-4-imp-1/dependencies/allocation-planning';
import { judgeAllocationPlanApprovalWithCriteria } from '../../src/agents/tx-4-imp-1/dependencies/approval-judgment';
import { deliverAllocationPlanAndWorkInstructions } from '../../src/agents/tx-4-imp-1/dependencies/delivery';
import { recordOperationAudit } from '../../src/agents/tx-4-imp-1/dependencies/audit';

describe('SCEN-071: riskThresholdScore が未指定の場合、デフォルト値 60 が適用される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authorizeOperation as jest.Mock).mockResolvedValue({ authorized: true });

    (monitorAndJudgeDelayRisk as jest.Mock).mockResolvedValue({
      delayRiskJudgments: [
        {
          workInstructionId: 'work-001',
          facilityId: 'facility-001',
          riskLevel: 'high',
          delayPredictionDays: 2,
          riskScore: 75,
          recommendedAction: 'increase_staffing'
        }
      ]
    });

    (generateAllocationPlans as jest.Mock).mockResolvedValue({
      allocationPlans: [
        {
          allocationPlanId: 'plan-001',
          facilityId: 'facility-001',
          proposedWorkers: [
            {
              workerId: 'worker-001',
              workerName: 'Test Worker',
              proficiencyLevel: 'intermediate',
              assignedWorkType: 'assembly',
              allocatedHours: 8,
              productivityRate: 85
            }
          ],
          feasibilityScore: 92,
          recommendedPriority: 1
        }
      ]
    });

    (judgeAllocationPlanApprovalWithCriteria as jest.Mock).mockResolvedValue({
      approvalResults: [
        {
          allocationPlanId: 'plan-001',
          approvalStatus: 'pending_approval',
          approvalReason: 'Requires human review',
          approverUserId: null,
          approvalTimestamp: new Date().toISOString()
        }
      ]
    });

    (deliverAllocationPlanAndWorkInstructions as jest.Mock).mockResolvedValue({
      deliveredInstructions: [
        {
          workInstructionId: 'instr-001',
          deliveryMethod: 'handy_terminal',
          deliveredToFieldLeaderId: 'leader-001',
          deliveryTimestamp: new Date().toISOString(),
          deliveryStatus: 'delivered'
        }
      ]
    });

    (recordOperationAudit as jest.Mock).mockResolvedValue({ recorded: true });
  });

  it('should apply default riskThresholdScore value of 60 when riskThresholdScore is undefined', async () => {
    const userId = 'authorized-user-001';
    const facilityIds = ['facility-001', 'facility-002'];
    const monitoringIntervalMinutes = 15;
    const autoApprovalEnabled = false;

    const input: Tx4Imp1AgentInput = {
      userId,
      facilityIds,
      monitoringIntervalMinutes,
      riskThresholdScore: undefined,
      autoApprovalEnabled
    };

    const result: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input);

    expect(result).toBeDefined();
    expect(result.executionId).toBeTruthy();
    expect(typeof result.executionId).toBe('string');

    expect(result.monitoringTimestamp).toBeTruthy();
    expect(result.monitoringTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(authorizeOperation).toHaveBeenCalled();
    const authCallArgs = (authorizeOperation as jest.Mock).mock.calls[0];
    expect(authCallArgs).toBeDefined();
    expect(authCallArgs[0]).toHaveProperty('userId', userId);

    expect(result.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgments)).toBe(true);

    expect(monitorAndJudgeDelayRisk).toHaveBeenCalled();
    const riskCallArgs = (monitorAndJudgeDelayRisk as jest.Mock).mock.calls[0];
    expect(riskCallArgs).toBeDefined();
    expect(riskCallArgs[0]).toBeDefined();
    expect(riskCallArgs[0].riskThresholdScore).toBe(60);

    expect(result.identifiedFacilities).toBeDefined();
    expect(Array.isArray(result.identifiedFacilities)).toBe(true);
    if (result.identifiedFacilities.length > 0) {
      expect(result.identifiedFacilities[0]).toHaveProperty('facilityId');
      expect(result.identifiedFacilities[0]).toHaveProperty('riskPriority');
      expect(result.identifiedFacilities[0]).toHaveProperty('highestRiskScore');
      expect(typeof result.identifiedFacilities[0].riskPriority).toBe('number');
      expect(typeof result.identifiedFacilities[0].highestRiskScore).toBe('number');
    }
    if (result.identifiedFacilities.length > 1) {
      for (let i = 0; i < result.identifiedFacilities.length - 1; i++) {
        expect(result.identifiedFacilities[i].riskPriority).toBeLessThanOrEqual(
          result.identifiedFacilities[i + 1].riskPriority
        );
      }
    }

    expect(generateAllocationPlans).toHaveBeenCalled();
    const planCallArgs = (generateAllocationPlans as jest.Mock).mock.calls[0];
    expect(planCallArgs).toBeDefined();

    expect(result.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(result.generatedAllocationPlans)).toBe(true);
    result.generatedAllocationPlans.forEach((plan) => {
      expect(plan).toHaveProperty('feasibilityScore');
      expect(plan).toHaveProperty('recommendedPriority');
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(typeof plan.recommendedPriority).toBe('number');
    });

    expect(judgeAllocationPlanApprovalWithCriteria).toHaveBeenCalled();
    const approvalCallArgs = (judgeAllocationPlanApprovalWithCriteria as jest.Mock).mock.calls[0];
    expect(approvalCallArgs).toBeDefined();

    expect(result.approvalResults).toBeDefined();
    expect(Array.isArray(result.approvalResults)).toBe(true);
    result.approvalResults.forEach((approval) => {
      expect(['auto_approved', 'pending_approval', 'rejected']).toContain(approval.approvalStatus);
      expect(approval).toHaveProperty('approvalTimestamp');
      expect(typeof approval.approvalTimestamp).toBe('string');
    });

    expect(deliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();
    const deliveryCallArgs = (deliverAllocationPlanAndWorkInstructions as jest.Mock).mock.calls[0];
    expect(deliveryCallArgs).toBeDefined();

    expect(result.deliveredInstructions).toBeDefined();
    expect(Array.isArray(result.deliveredInstructions)).toBe(true);
    result.deliveredInstructions.forEach((instruction) => {
      expect(instruction).toHaveProperty('deliveryTimestamp');
      expect(instruction).toHaveProperty('deliveredToFieldLeaderId');
      expect(typeof instruction.deliveryTimestamp).toBe('string');
      expect(['handy_terminal', 'email', 'system_notification']).toContain(instruction.deliveryMethod);
      expect(['delivered', 'delivery_failed']).toContain(instruction.deliveryStatus);
    });

    expect(recordOperationAudit).toHaveBeenCalled();
    const auditCallArgs = (recordOperationAudit as jest.Mock).mock.calls[0];
    expect(auditCallArgs).toBeDefined();

    expect(['completed', 'partial_completion', 'failed']).toContain(result.executionStatus);

    if (result.executionStatus === 'completed') {
      expect(result.errorSummary).toBeNull();
    }
  });

  it('should apply default riskThresholdScore value of 60 when riskThresholdScore is omitted from input', async () => {
    const userId = 'authorized-user-002';
    const facilityIds = ['facility-003'];

    const input: any = {
      userId,
      facilityIds,
      monitoringIntervalMinutes: 15
    };

    const result: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input);

    expect(result).toBeDefined();
    expect(result.executionId).toBeTruthy();
    expect(typeof result.executionId).toBe('string');
    expect(result.monitoringTimestamp).toBeTruthy();
    expect(result.monitoringTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(authorizeOperation).toHaveBeenCalled();
    const authCallArgs = (authorizeOperation as jest.Mock).mock.calls[0];
    expect(authCallArgs[0]).toHaveProperty('userId', userId);

    expect(monitorAndJudgeDelayRisk).toHaveBeenCalled();
    const callArgs = (monitorAndJudgeDelayRisk as jest.Mock).mock.calls[0];
    expect(callArgs).toBeDefined();
    expect(callArgs[0]).toBeDefined();
    expect(callArgs[0].riskThresholdScore).toBe(60);

    expect(generateAllocationPlans).toHaveBeenCalled();
    expect(judgeAllocationPlanApprovalWithCriteria).toHaveBeenCalled();
    expect(deliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();
    expect(recordOperationAudit).toHaveBeenCalled();

    expect(['completed', 'partial_completion', 'failed']).toContain(result.executionStatus);
  });

  it('should preserve explicitly set riskThresholdScore when provided', async () => {
    const userId = 'authorized-user-003';
    const facilityIds = ['facility-004'];
    const customThreshold = 75;

    const input: Tx4Imp1AgentInput = {
      userId,
      facilityIds,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: customThreshold,
      autoApprovalEnabled: false
    };

    const result: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input);

    expect(result).toBeDefined();
    expect(result.executionId).toBeTruthy();
    expect(typeof result.executionId).toBe('string');

    expect(authorizeOperation).toHaveBeenCalled();

    expect(monitorAndJudgeDelayRisk).toHaveBeenCalled();
    const callArgs = (monitorAndJudgeDelayRisk as jest.Mock).mock.calls[0];
    expect(callArgs).toBeDefined();
    expect(callArgs[0]).toBeDefined();
    expect(callArgs[0].riskThresholdScore).toBe(customThreshold);

    expect(generateAllocationPlans).toHaveBeenCalled();
    expect(judgeAllocationPlanApprovalWithCriteria).toHaveBeenCalled();
    expect(deliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();
    expect(recordOperationAudit).toHaveBeenCalled();

    expect(['completed', 'partial_completion', 'failed']).toContain(result.executionStatus);
  });

  it('should verify authorization before proceeding with risk judgment', async () => {
    const userId = 'authorized-user-004';
    const facilityIds = ['facility-005'];

    const input: Tx4Imp1AgentInput = {
      userId,
      facilityIds,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: undefined,
      autoApprovalEnabled: false
    };

    await runTx4Imp1Agent(input);

    expect(authorizeOperation).toHaveBeenCalledBefore(monitorAndJudgeDelayRisk as jest.Mock);
    const authCall = (authorizeOperation as jest.Mock).mock.calls[0];
    expect(authCall[0]).toHaveProperty('userId', userId);
  });

  it('should pass the default riskThresholdScore through the entire call chain', async () => {
    const userId = 'authorized-user-005';
    const facilityIds = ['facility-006'];

    const input: Tx4Imp1AgentInput = {
      userId,
      facilityIds,
      monitoringIntervalMinutes: 20,
      autoApprovalEnabled: false
    };

    const result: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input);

    const riskJudgmentCall = (monitorAndJudgeDelayRisk as jest.Mock).mock.calls[0];
    expect(riskJudgmentCall[0].riskThresholdScore).toBe(60);

    expect(result).toBeDefined();
    expect(result.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgments)).toBe(true);
  });
});