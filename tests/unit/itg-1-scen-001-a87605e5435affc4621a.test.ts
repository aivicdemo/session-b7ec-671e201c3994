import { jest } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type {
  Tx1Imp1AgentInput,
  Tx1Imp1AgentOutput,
  DelayDetectionResult,
  AffectedFacility,
  AffectedTeam,
  GeneratedAllocationPlan,
  ProposedAllocation,
  ApprovedAllocationPlan,
  DeliveryResult,
} from '../../src/agents/tx-1-imp-1/orchestrator';

// Mock modules
jest.mock('../../src/logic/progress-monitoring-risk-engine');
jest.mock('../../src/logic/personnel-allocation-optimizer');
jest.mock('../../src/logic/allocation-plan-review-approval');
jest.mock('../../src/logic/work-instruction-delivery-manager');
jest.mock('../../src/logic/auth-authorization-audit');

describe('SCEN-001: 正常系：権限ありで対象拠点の進捗を監視し、遅延と品質ばらつきを検知して配置案を生成・承認・配信し完了する', () => {
  const executorUserId = 'user-001-has-permission';
  const facilityId1 = 'facility-001';
  const facilityId2 = 'facility-002';
  const teamId1 = 'team-001';
  const teamId2 = 'team-002';
  const workerId1 = 'worker-001';
  const workerId2 = 'worker-002';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete with delay detection, allocation plan generation, approval, and delivery when all conditions are met', async () => {
    // Prepare mock data
    const affectedTeam1: AffectedTeam = {
      teamId: teamId1,
      teamName: 'Team A',
      progressRate: 45,
      plannedProgressRate: 60,
      delayDays: 2,
      qualityScore: 75,
    };

    const affectedTeam2: AffectedTeam = {
      teamId: teamId2,
      teamName: 'Team B',
      progressRate: 50,
      plannedProgressRate: 60,
      delayDays: 1,
      qualityScore: 60,
    };

    const affectedFacility1: AffectedFacility = {
      facilityId: facilityId1,
      facilityName: 'Facility 1',
      riskScore: 75,
      riskRank: 1,
      delayReasons: ['insufficient_personnel', 'low_productivity'],
      affectedTeams: [affectedTeam1],
    };

    const affectedFacility2: AffectedFacility = {
      facilityId: facilityId2,
      facilityName: 'Facility 2',
      riskScore: 65,
      riskRank: 2,
      delayReasons: ['priority_misalignment'],
      affectedTeams: [affectedTeam2],
    };

    const delayDetectionResult: DelayDetectionResult = {
      detectionTimestamp: new Date().toISOString(),
      delayDetected: true,
      affectedFacilities: [affectedFacility1, affectedFacility2],
      qualityVarianceDetected: true,
      overallRiskScore: 70,
    };

    const proposedAllocation1: ProposedAllocation = {
      workerId: workerId1,
      workerName: 'Worker 1',
      assignedWorkType: 'assembly',
      proficiencyLevel: 'intermediate',
      adjustedDifficulty: 'normal',
      estimatedWorkHours: 8,
      productivityRate: 85,
    };

    const proposedAllocation2: ProposedAllocation = {
      workerId: workerId2,
      workerName: 'Worker 2',
      assignedWorkType: 'inspection',
      proficiencyLevel: 'advanced',
      adjustedDifficulty: 'easy',
      estimatedWorkHours: 6,
      productivityRate: 95,
    };

    const generatedPlan1: GeneratedAllocationPlan = {
      planId: 'plan-001',
      facilityId: facilityId1,
      teamId: teamId1,
      workInstructionId: 'work-001',
      proposedAllocations: [proposedAllocation1],
      feasibilityScore: 85,
      recommendationRank: 1,
      estimatedCompletionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      proficiencyAdjustmentApplied: true,
    };

    const generatedPlan2: GeneratedAllocationPlan = {
      planId: 'plan-002',
      facilityId: facilityId2,
      teamId: teamId2,
      workInstructionId: 'work-002',
      proposedAllocations: [proposedAllocation2],
      feasibilityScore: 78,
      recommendationRank: 2,
      estimatedCompletionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      proficiencyAdjustmentApplied: true,
    };

    const approvedPlan1: ApprovedAllocationPlan = {
      planId: 'plan-001',
      approvalStatus: 'auto_approved',
      approvalTimestamp: new Date().toISOString(),
      approverUserId: undefined,
    };

    const approvedPlan2: ApprovedAllocationPlan = {
      planId: 'plan-002',
      approvalStatus: 'auto_approved',
      approvalTimestamp: new Date().toISOString(),
      approverUserId: undefined,
    };

    const deliveryResult1: DeliveryResult = {
      deliveryId: 'delivery-001',
      planId: 'plan-001',
      targetFieldLeaderId: 'leader-001',
      deliveryStatus: 'delivered',
      deliveryTimestamp: new Date().toISOString(),
      receptionConfirmed: true,
      receptionConfirmationTimestamp: new Date().toISOString(),
      executionStarted: true,
      executionStartTimestamp: new Date().toISOString(),
    };

    const deliveryResult2: DeliveryResult = {
      deliveryId: 'delivery-002',
      planId: 'plan-002',
      targetFieldLeaderId: 'leader-002',
      deliveryStatus: 'delivered',
      deliveryTimestamp: new Date().toISOString(),
      receptionConfirmed: true,
      receptionConfirmationTimestamp: new Date().toISOString(),
      executionStarted: true,
      executionStartTimestamp: new Date().toISOString(),
    };

    // Setup mocks
    const {
      monitorAndJudgeDelayRisk,
    } = require('../../src/logic/progress-monitoring-risk-engine');
    monitorAndJudgeDelayRisk.mockResolvedValue(delayDetectionResult);

    const {
      generateAllocationPlans,
    } = require('../../src/logic/personnel-allocation-optimizer');
    generateAllocationPlans.mockResolvedValue([generatedPlan1, generatedPlan2]);

    const {
      judgeAllocationPlanApprovalWithCriteria,
    } = require('../../src/logic/allocation-plan-review-approval');
    judgeAllocationPlanApprovalWithCriteria.mockResolvedValue([
      approvedPlan1,
      approvedPlan2,
    ]);

    const {
      deliverAllocationPlanAndWorkInstructions,
    } = require('../../src/logic/work-instruction-delivery-manager');
    deliverAllocationPlanAndWorkInstructions.mockResolvedValue([
      deliveryResult1,
      deliveryResult2,
    ]);

    const { authorizeOperation, recordOperationAudit } = require(
      '../../src/logic/auth-authorization-audit'
    );
    authorizeOperation.mockResolvedValue({ authorized: true });
    recordOperationAudit.mockResolvedValue({ recorded: true });

    // Prepare input
    const input: Tx1Imp1AgentInput = {
      executorUserId,
      targetFacilityIds: [facilityId1, facilityId2],
      targetTeamIds: undefined,
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    // Execute - note: second parameter should match Tx1Imp1AiClient interface
    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, {
      // Structurally identical to Tx1Imp1AiClient
    } as any);

    // Verify executionStatus
    expect(result.executionStatus).toBe('completed');

    // Verify executionId
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.executionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // Verify delayDetectionResult
    expect(result.delayDetectionResult).toBeDefined();
    expect(result.delayDetectionResult.delayDetected).toBe(true);
    expect(result.delayDetectionResult.affectedFacilities).toHaveLength(2);
    expect(result.delayDetectionResult.affectedFacilities[0].riskScore).toBeGreaterThanOrEqual(75);
    expect(result.delayDetectionResult.affectedFacilities[0].delayReasons).toContain(
      'insufficient_personnel'
    );

    // Verify generatedAllocationPlans
    expect(result.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(result.generatedAllocationPlans)).toBe(true);
    expect(result.generatedAllocationPlans.length).toBeGreaterThan(0);
    result.generatedAllocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(plan.recommendationRank).toBeGreaterThan(0);
      expect(typeof plan.proficiencyAdjustmentApplied).toBe('boolean');
    });

    // Verify approvedAllocationPlans
    expect(result.approvedAllocationPlans).toBeDefined();
    expect(Array.isArray(result.approvedAllocationPlans)).toBe(true);
    expect(result.approvedAllocationPlans.length).toBeGreaterThan(0);
    result.approvedAllocationPlans.forEach((plan) => {
      expect(['auto_approved', 'manual_approved']).toContain(plan.approvalStatus);
      expect(plan.approvalTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    // Verify deliveryResults
    expect(result.deliveryResults).toBeDefined();
    expect(Array.isArray(result.deliveryResults)).toBe(true);
    expect(result.deliveryResults.length).toBeGreaterThan(0);
    result.deliveryResults.forEach((delivery) => {
      expect(['delivered', 'delivery_failed', 'pending_reception']).toContain(
        delivery.deliveryStatus
      );
      expect(delivery.deliveryTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(typeof delivery.receptionConfirmed).toBe('boolean');
    });

    // Verify executionErrors - correct: undefined OR empty array
    if (result.executionErrors !== undefined) {
      expect(Array.isArray(result.executionErrors)).toBe(true);
      expect(result.executionErrors.length).toBe(0);
    }

    // Verify executionTimestamp
    expect(result.executionTimestamp).toBeDefined();
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify authorization call
    expect(authorizeOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        executorUserId,
        targetFacilityIds: [facilityId1, facilityId2],
      })
    );

    // Verify audit logging call includes operation details with specific workflow steps
    expect(recordOperationAudit).toHaveBeenCalled();
    const auditCallArgs = recordOperationAudit.mock.calls[0][0];
    expect(auditCallArgs).toBeDefined();
    expect(auditCallArgs.executorUserId).toBe(executorUserId);
    expect(auditCallArgs.executionId).toBe(result.executionId);

    // Verify that operation details contain specific workflow steps
    const operationDetails = JSON.stringify(auditCallArgs);
    expect(operationDetails).toMatch(/進捗監視|progress.*monitoring|monitoring/i);
    expect(operationDetails).toMatch(/遅延リスク|delay.*risk|risk.*detection/i);
    expect(operationDetails).toMatch(/配置案生成|allocation.*plan.*generation|plan.*generation/i);
    expect(operationDetails).toMatch(/自動承認|auto.*approval|approval/i);
    expect(operationDetails).toMatch(/配信|delivery|deliver/i);
  });
});