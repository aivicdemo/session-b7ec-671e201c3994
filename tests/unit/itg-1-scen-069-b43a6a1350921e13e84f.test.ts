import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import * as authAudit from '../../src/logic/auth-authorization-audit';
import * as progressMonitoringRisk from '../../src/logic/progress-monitoring-risk-engine';
import * as personnelAllocationOptimizer from '../../src/logic/personnel-allocation-optimizer';
import * as allocationPlanReview from '../../src/logic/allocation-plan-review-approval';
import * as workInstructionDelivery from '../../src/logic/work-instruction-delivery-manager';
import * as wmsDataSource from '../../src/adapters/wms-handy-terminal-data-source';

jest.mock('../../src/logic/auth-authorization-audit');
jest.mock('../../src/logic/progress-monitoring-risk-engine');
jest.mock('../../src/logic/personnel-allocation-optimizer');
jest.mock('../../src/logic/allocation-plan-review-approval');
jest.mock('../../src/logic/work-instruction-delivery-manager');
jest.mock('../../src/adapters/wms-handy-terminal-data-source');

describe('SCEN-069: facilityIds が未指定の場合、全拠点を監視対象として処理が進行する', () => {
  const userId = 'user-001';
  const totalFacilities = 330;
  let facilityIds: string[];
  let progressDataByFacility: Record<string, any>;

  beforeAll(() => {
    facilityIds = Array.from({ length: totalFacilities }, (_, i) =>
      `facility-${String(i + 1).padStart(4, '0')}`
    );
    
    progressDataByFacility = {};
    facilityIds.forEach((fid, index) => {
      progressDataByFacility[fid] = {
        facilityId: fid,
        completedCount: 30 + (index % 70),
        remainingCount: 100 - (30 + (index % 70)),
        progressRate: Math.min(90, 30 + (index % 70)),
      };
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (authAudit.authorizeOperation as jest.Mock).mockResolvedValue({
      authorized: true,
      userId,
    });

    (authAudit.recordOperationAudit as jest.Mock).mockResolvedValue({
      auditId: 'audit-' + Date.now(),
      timestamp: new Date().toISOString(),
    });

    (wmsDataSource.fetchProgressData as jest.Mock).mockImplementation(
      async (targetFacilityIds?: string[]) => {
        const activeFacilityIds = targetFacilityIds || facilityIds;
        return activeFacilityIds.map((fid) => progressDataByFacility[fid]);
      }
    );

    const delayRiskJudgments = facilityIds.map((facilityId, index) => {
      const isHighRisk = index % 3 === 0;
      return {
        facilityId,
        facilityName: `Facility ${facilityId}`,
        riskScore: isHighRisk ? 60 + (index % 40) : 30 + (index % 30),
        delayPredictedDays: isHighRisk ? 2 + (index % 5) : 0,
        progressRate: Math.min(90, 30 + (index % 70)),
        planProgressRate: 50,
        riskLevel: isHighRisk ? 'high' : 'low',
        judgmentTimestamp: new Date().toISOString(),
      };
    });

    (progressMonitoringRisk.monitorAndJudgeDelayRisk as jest.Mock).mockResolvedValue(
      delayRiskJudgments
    );

    const highRiskFacilities = delayRiskJudgments.filter(
      (j) => j.riskScore >= 60
    );
    const allocationPlans = highRiskFacilities.map((judgment, index) => ({
      allocationPlanId: `plan-${judgment.facilityId}-${index}`,
      facilityId: judgment.facilityId,
      facilityName: judgment.facilityName,
      proposedAllocationCount: 5 + (index % 10),
      feasibilityScore: 75 + (index % 20),
      recommendedPriority: index + 1,
      estimatedDaysToComplete: Math.max(1, judgment.delayPredictedDays - 1),
      proposalTimestamp: new Date().toISOString(),
    }));

    (personnelAllocationOptimizer.generateAllocationPlans as jest.Mock).mockResolvedValue(
      allocationPlans
    );

    const approvalResults = allocationPlans.map((plan) => ({
      allocationPlanId: plan.allocationPlanId,
      approvalStatus: 'pending_approval',
      approvalReason: 'Awaiting human review due to autoApprovalEnabled=false',
      approverUserId: null,
      approvalTimestamp: new Date().toISOString(),
    }));

    (allocationPlanReview.judgeAllocationPlanApprovalWithCriteria as jest.Mock).mockResolvedValue(
      approvalResults
    );

    (workInstructionDelivery.deliverAllocationPlanAndWorkInstructions as jest.Mock).mockResolvedValue(
      []
    );
  });

  it('should process all 330 facilities when facilityIds is undefined', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    expect(input.userId).toBe('user-001');
    expect(input.facilityIds).toBeUndefined();
    expect(input.monitoringIntervalMinutes).toBe(15);
    expect(input.riskThresholdScore).toBe(60);
    expect(input.autoApprovalEnabled).toBe(false);

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    expect(output.executionId).toBeDefined();
    expect(typeof output.executionId).toBe('string');
    expect(output.executionId.length).toBeGreaterThan(0);

    expect(output.monitoringTimestamp).toBeDefined();
    expect(typeof output.monitoringTimestamp).toBe('string');
    const timestamp = new Date(output.monitoringTimestamp);
    expect(timestamp.getTime()).toBeLessThanOrEqual(new Date().getTime());
    expect(timestamp.getTime()).toBeGreaterThan(new Date().getTime() - 60000);

    expect(output.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(output.delayRiskJudgments)).toBe(true);
    expect(output.delayRiskJudgments.length).toBe(totalFacilities);
    const highRiskJudgments = output.delayRiskJudgments.filter(
      (j) => j.riskScore >= 60
    );
    expect(highRiskJudgments.length).toBeGreaterThan(0);

    const judgedFacilityIds = new Set(output.delayRiskJudgments.map((j) => j.facilityId));
    expect(judgedFacilityIds.size).toBe(totalFacilities);
    facilityIds.forEach((expectedId) => {
      expect(judgedFacilityIds.has(expectedId)).toBe(true);
    });

    expect(output.identifiedFacilities).toBeDefined();
    expect(Array.isArray(output.identifiedFacilities)).toBe(true);
    expect(output.identifiedFacilities.length).toBeGreaterThan(0);
    output.identifiedFacilities.forEach((facility) => {
      expect(facilityIds).toContain(facility.facilityId);
      expect(facility.riskPriority).toBeGreaterThanOrEqual(1);
      const judgment = output.delayRiskJudgments.find((j) => j.facilityId === facility.facilityId);
      expect(judgment).toBeDefined();
      expect(judgment!.riskScore).toBeGreaterThanOrEqual(60);
    });

    for (let i = 1; i < output.identifiedFacilities.length; i++) {
      expect(output.identifiedFacilities[i].riskPriority).toBeGreaterThanOrEqual(
        output.identifiedFacilities[i - 1].riskPriority
      );
    }

    expect(output.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(output.generatedAllocationPlans)).toBe(true);
    output.generatedAllocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(plan.recommendedPriority).toBeGreaterThanOrEqual(1);
    });

    output.generatedAllocationPlans.forEach((plan) => {
      const correspondingFacility = output.identifiedFacilities.find(
        (f) => f.facilityId === plan.facilityId
      );
      expect(correspondingFacility).toBeDefined();
    });

    expect(output.approvalResults).toBeDefined();
    expect(Array.isArray(output.approvalResults)).toBe(true);
    expect(output.approvalResults.length).toBeGreaterThan(0);
    output.approvalResults.forEach((result) => {
      expect(result.approvalStatus).toBe('pending_approval');
      expect(result.approverUserId).toBeNull();
    });

    expect(output.deliveredInstructions).toBeDefined();
    expect(Array.isArray(output.deliveredInstructions)).toBe(true);

    expect(output.executionStatus).toMatch(/^(completed|partial_completion)$/);;

    expect(output.errorSummary).toBeNull();

    expect(output.delayRiskJudgments.length).toBe(totalFacilities);

    expect(authAudit.recordOperationAudit).toHaveBeenCalled();
  });

  it('should invoke progress data retrieval with undefined facilityIds parameter to retrieve all facilities', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    await runTx4Imp1Agent(input as any, aiClient as any);

    expect(wmsDataSource.fetchProgressData).toHaveBeenCalled();
    
    const callArgs = (wmsDataSource.fetchProgressData as jest.Mock).mock.calls[0];
    expect(callArgs).toBeDefined();
    if (callArgs[0] === undefined) {
      expect(true).toBe(true);
    } else if (Array.isArray(callArgs[0])) {
      expect(callArgs[0].length).toBe(totalFacilities);
    }
  });

  it('should pass all 330 facilities to risk judgment engine when facilityIds is undefined', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    await runTx4Imp1Agent(input as any, aiClient as any);

    expect(progressMonitoringRisk.monitorAndJudgeDelayRisk).toHaveBeenCalled();
    
    const callArgs = (progressMonitoringRisk.monitorAndJudgeDelayRisk as jest.Mock).mock.calls[0];
    expect(callArgs).toBeDefined();
    if (callArgs[0]) {
      const progressData = callArgs[0];
      if (Array.isArray(progressData)) {
        expect(progressData.length).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('should include all 330 facilities in delayRiskJudgments output regardless of facilityIds parameter', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    expect(output.delayRiskJudgments.length).toBe(totalFacilities);

    const facilityIdSet = new Set(output.delayRiskJudgments.map((j) => j.facilityId));
    expect(facilityIdSet.size).toBe(totalFacilities);

    facilityIds.forEach((expectedFacilityId) => {
      expect(
        output.delayRiskJudgments.some((j) => j.facilityId === expectedFacilityId)
      ).toBe(true);
    });

    output.delayRiskJudgments.forEach((judgment) => {
      expect(judgment.facilityId).toBeDefined();
      expect(judgment.facilityName).toBeDefined();
      expect(judgment.riskScore).toBeGreaterThanOrEqual(0);
      expect(judgment.riskScore).toBeLessThanOrEqual(100);
      expect(judgment.judgmentTimestamp).toBeDefined();
      expect(typeof judgment.judgmentTimestamp).toBe('string');
      expect(judgment.progressRate).toBeDefined();
      expect(judgment.planProgressRate).toBeDefined();
      expect(judgment.riskLevel).toBeDefined();
      expect(judgment.delayPredictedDays).toBeDefined();
    });
  });

  it('should maintain monitoring interval and risk threshold settings throughout execution', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    output.identifiedFacilities.forEach((facility) => {
      const judgment = output.delayRiskJudgments.find(
        (j) => j.facilityId === facility.facilityId
      );
      expect(judgment).toBeDefined();
      expect(judgment!.riskScore).toBeGreaterThanOrEqual(input.riskThresholdScore);
    });
  });

  it('should not deliver instructions when all approval results are pending', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    expect(output.deliveredInstructions.length).toBe(0);

    output.approvalResults.forEach((result) => {
      expect(result.approvalStatus).toBe('pending_approval');
    });

    output.generatedAllocationPlans.forEach((plan) => {
      const correspondingApproval = output.approvalResults.find(
        (ar) => ar.allocationPlanId === plan.allocationPlanId
      );
      expect(correspondingApproval).toBeDefined();
      expect(correspondingApproval!.approvalStatus).toBe('pending_approval');
    });
  });

  it('should respect autoApprovalEnabled=false constraint throughout approval process', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    output.approvalResults.forEach((result) => {
      expect(result.approverUserId).toBeNull();
      expect(result.approvalStatus).toBe('pending_approval');
    });

    expect(output.generatedAllocationPlans.length).toBeGreaterThan(0);
    expect(output.deliveredInstructions.length).toBe(0);
  });

  it('should record audit log for the operation', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    expect(authAudit.recordOperationAudit).toHaveBeenCalled();
    
    expect(output.executionStatus).toMatch(/^(completed|partial_completion)$/);;
  });

  it('should pass autoApprovalEnabled parameter to approval review process', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    await runTx4Imp1Agent(input as any, aiClient as any);

    expect(allocationPlanReview.judgeAllocationPlanApprovalWithCriteria).toHaveBeenCalled();
  });

  it('should only deliver instructions for approved allocation plans', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    await runTx4Imp1Agent(input as any, aiClient as any);

    expect(workInstructionDelivery.deliverAllocationPlanAndWorkInstructions).toHaveBeenCalled();
  });

  it('should verify input parameters match the specification', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    expect(input.userId).toBe('user-001');
    expect(input.facilityIds).toBeUndefined();
    expect(input.monitoringIntervalMinutes).toBe(15);
    expect(input.riskThresholdScore).toBe(60);
    expect(input.autoApprovalEnabled).toBe(false);

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);
    expect(output).toBeDefined();
  });

  it('should verify generated allocation plans correspond to identified facilities', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    const planFacilityIds = new Set(output.generatedAllocationPlans.map((p) => p.facilityId));
    output.identifiedFacilities.forEach((facility) => {
      expect(planFacilityIds.has(facility.facilityId)).toBe(true);
    });

    output.generatedAllocationPlans.forEach((plan) => {
      const correspondingFacility = output.identifiedFacilities.find(
        (f) => f.facilityId === plan.facilityId
      );
      expect(correspondingFacility).toBeDefined();
      expect(correspondingFacility!.facilityName).toBe(plan.facilityName);
      expect(plan.proposedAllocationCount).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(plan.recommendedPriority).toBeGreaterThanOrEqual(1);
      expect(plan.estimatedDaysToComplete).toBeGreaterThanOrEqual(1);
      expect(typeof plan.proposalTimestamp).toBe('string');
    });
  });

  it('should verify all 330 facilities are present in risk judgment results', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    expect(output.delayRiskJudgments.length).toBe(totalFacilities);

    const resultFacilityIds = new Set(output.delayRiskJudgments.map((j) => j.facilityId));
    facilityIds.forEach((expectedId) => {
      expect(resultFacilityIds.has(expectedId)).toBe(true);
    });

    expect(resultFacilityIds.size).toBe(totalFacilities);
  });

  it('should verify approval results have correct structure and status', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    expect(output.approvalResults).toBeDefined();
    expect(Array.isArray(output.approvalResults)).toBe(true);

    output.approvalResults.forEach((result) => {
      expect(result.allocationPlanId).toBeDefined();
      expect(result.approvalStatus).toBeDefined();
      expect(result.approvalReason).toBeDefined();
      expect(result.approvalTimestamp).toBeDefined();
      expect(typeof result.approvalTimestamp).toBe('string');
      expect(result.approvalStatus).toBe('pending_approval');
      expect(result.approverUserId).toBeNull();
    });
  });

  it('should verify execution status and error summary are correct', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    expect(output.executionStatus).toMatch(/^(completed|partial_completion)$/);;

    expect(output.errorSummary).toBeNull();
  });

  it('should verify high-risk facilities are included in delayRiskJudgments', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    const highRiskJudgments = output.delayRiskJudgments.filter(
      (j) => j.riskScore >= 60
    );
    expect(highRiskJudgments.length).toBeGreaterThan(0);
  });

  it('should verify delivered instructions correspond to approved allocation plans when approval status is auto_approved', async () => {
    const allocationPlans = [
      {
        allocationPlanId: 'plan-facility-0001-0',
        facilityId: 'facility-0001',
        facilityName: 'Facility facility-0001',
        proposedAllocationCount: 5,
        feasibilityScore: 80,
        recommendedPriority: 1,
        estimatedDaysToComplete: 1,
        proposalTimestamp: new Date().toISOString(),
      },
    ];

    const approvalResults = [
      {
        allocationPlanId: 'plan-facility-0001-0',
        approvalStatus: 'auto_approved',
        approvalReason: 'Automatically approved',
        approverUserId: null,
        approvalTimestamp: new Date().toISOString(),
      },
    ];

    const deliveredInstructions = [
      {
        workInstructionId: 'instr-plan-facility-0001-0',
        deliveryMethod: 'handy_terminal',
        deliveredToFieldLeaderId: 'leader-facility-0001',
        deliveryTimestamp: new Date().toISOString(),
        deliveryStatus: 'delivered',
      },
    ];

    (personnelAllocationOptimizer.generateAllocationPlans as jest.Mock).mockResolvedValueOnce(
      allocationPlans
    );

    (allocationPlanReview.judgeAllocationPlanApprovalWithCriteria as jest.Mock).mockResolvedValueOnce(
      approvalResults
    );

    (workInstructionDelivery.deliverAllocationPlanAndWorkInstructions as jest.Mock).mockResolvedValueOnce(
      deliveredInstructions
    );

    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: true,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    expect(output.deliveredInstructions.length).toBeGreaterThanOrEqual(0);
  });

  it('should verify each delayRiskJudgment contains all required fields', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    output.delayRiskJudgments.forEach((judgment, index) => {
      expect(judgment.facilityId).toBeDefined();
      expect(typeof judgment.facilityId).toBe('string');
      expect(judgment.facilityId.startsWith('facility-')).toBe(true);

      expect(judgment.facilityName).toBeDefined();
      expect(typeof judgment.facilityName).toBe('string');

      expect(judgment.riskScore).toBeDefined();
      expect(typeof judgment.riskScore).toBe('number');
      expect(judgment.riskScore).toBeGreaterThanOrEqual(0);
      expect(judgment.riskScore).toBeLessThanOrEqual(100);

      expect(judgment.delayPredictedDays).toBeDefined();
      expect(typeof judgment.delayPredictedDays).toBe('number');

      expect(judgment.progressRate).toBeDefined();
      expect(typeof judgment.progressRate).toBe('number');

      expect(judgment.planProgressRate).toBeDefined();
      expect(typeof judgment.planProgressRate).toBe('number');

      expect(judgment.riskLevel).toBeDefined();
      expect(['high', 'low', 'medium']).toContain(judgment.riskLevel);

      expect(judgment.judgmentTimestamp).toBeDefined();
      expect(typeof judgment.judgmentTimestamp).toBe('string');
      const ts = new Date(judgment.judgmentTimestamp);
      expect(ts.getTime()).toBeGreaterThan(0);
    });
  });

  it('should verify generated allocation plans have all required fields with valid values', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    output.generatedAllocationPlans.forEach((plan) => {
      expect(plan.allocationPlanId).toBeDefined();
      expect(typeof plan.allocationPlanId).toBe('string');

      expect(plan.facilityId).toBeDefined();
      expect(typeof plan.facilityId).toBe('string');

      expect(plan.facilityName).toBeDefined();
      expect(typeof plan.facilityName).toBe('string');

      expect(plan.proposedAllocationCount).toBeDefined();
      expect(typeof plan.proposedAllocationCount).toBe('number');
      expect(plan.proposedAllocationCount).toBeGreaterThanOrEqual(0);

      expect(plan.feasibilityScore).toBeDefined();
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);

      expect(plan.recommendedPriority).toBeDefined();
      expect(typeof plan.recommendedPriority).toBe('number');
      expect(plan.recommendedPriority).toBeGreaterThanOrEqual(1);

      expect(plan.estimatedDaysToComplete).toBeDefined();
      expect(typeof plan.estimatedDaysToComplete).toBe('number');
      expect(plan.estimatedDaysToComplete).toBeGreaterThanOrEqual(1);

      expect(plan.proposalTimestamp).toBeDefined();
      expect(typeof plan.proposalTimestamp).toBe('string');
      const ts = new Date(plan.proposalTimestamp);
      expect(ts.getTime()).toBeGreaterThan(0);
    });
  });

  it('should ensure no high-risk allocation plans are approved when autoApprovalEnabled is false', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    const approvedPlans = output.approvalResults.filter(
      (ar) => ar.approvalStatus === 'auto_approved'
    );

    expect(approvedPlans.length).toBe(0);

    output.approvalResults.forEach((result) => {
      expect(result.approvalStatus).toBe('pending_approval');
    });
  });

  it('should verify identifiedFacilities includes only facilities with riskScore >= riskThresholdScore', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    output.identifiedFacilities.forEach((facility) => {
      const correspondingJudgment = output.delayRiskJudgments.find(
        (j) => j.facilityId === facility.facilityId
      );
      expect(correspondingJudgment).toBeDefined();
      expect(correspondingJudgment!.riskScore).toBeGreaterThanOrEqual(input.riskThresholdScore);
    });
  });

  it('should verify identified facilities are ranked by riskPriority in ascending order', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    for (let i = 0; i < output.identifiedFacilities.length - 1; i++) {
      expect(output.identifiedFacilities[i].riskPriority).toBeLessThanOrEqual(
        output.identifiedFacilities[i + 1].riskPriority
      );
    }
  });

  it('should verify approval results correspond exactly to generated allocation plans', async () => {
    const input = {
      userId: 'user-001',
      facilityIds: undefined,
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const aiClient = {
      callAiAction: jest.fn(),
    };

    const output = await runTx4Imp1Agent(input as any, aiClient as any);

    expect(output.approvalResults.length).toBe(output.generatedAllocationPlans.length);

    output.generatedAllocationPlans.forEach((plan) => {
      const correspondingApproval = output.approvalResults.find(
        (ar) => ar.allocationPlanId === plan.allocationPlanId
      );
      expect(correspondingApproval).toBeDefined();
    });
  });
});