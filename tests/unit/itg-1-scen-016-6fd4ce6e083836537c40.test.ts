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
  ExecutionError,
} from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-016: 部分失敗系 - 一部拠点での配置指示配信失敗', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;
  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue({ authorized: true });
    mockRecordOperationAudit = jest.fn().mockResolvedValue({ recorded: true });

    const facilityADelayResult: DelayDetectionResult = {
      detectionTimestamp: new Date().toISOString(),
      delayDetected: true,
      affectedFacilities: [
        {
          facilityId: 'facility-A',
          facilityName: 'Facility A',
          riskScore: 75,
          riskRank: 1,
          delayReasons: ['insufficient_personnel'],
          affectedTeams: [
            {
              teamId: 'team-1',
              teamName: 'Team 1',
              progressRate: 45,
              plannedProgressRate: 65,
              delayDays: 3,
              qualityScore: 75,
            },
          ],
        },
      ],
      qualityVarianceDetected: false,
      overallRiskScore: 75,
    };

    const facilityBDelayResult: DelayDetectionResult = {
      detectionTimestamp: new Date().toISOString(),
      delayDetected: true,
      affectedFacilities: [
        {
          facilityId: 'facility-B',
          facilityName: 'Facility B',
          riskScore: 70,
          riskRank: 2,
          delayReasons: ['low_productivity'],
          affectedTeams: [
            {
              teamId: 'team-2',
              teamName: 'Team 2',
              progressRate: 50,
              plannedProgressRate: 70,
              delayDays: 2,
              qualityScore: 65,
            },
          ],
        },
      ],
      qualityVarianceDetected: false,
      overallRiskScore: 70,
    };

    mockMonitorAndJudgeDelayRisk = jest
      .fn()
      .mockImplementation((facilityId) => {
        if (facilityId === 'facility-A') return Promise.resolve(facilityADelayResult);
        if (facilityId === 'facility-B') return Promise.resolve(facilityBDelayResult);
        return Promise.reject(new Error('Unknown facility'));
      });

    const facilityAPlans: GeneratedAllocationPlan[] = [
      {
        planId: 'plan-A-1',
        facilityId: 'facility-A',
        teamId: 'team-1',
        workInstructionId: 'work-001',
        proposedAllocations: [
          {
            workerId: 'worker-001',
            workerName: 'Worker 001',
            assignedWorkType: 'assembly',
            proficiencyLevel: 'intermediate',
            adjustedDifficulty: 'normal',
            estimatedWorkHours: 8,
            productivityRate: 85,
          },
        ],
        feasibilityScore: 90,
        recommendationRank: 1,
        estimatedCompletionDate: new Date(Date.now() + 86400000).toISOString(),
        proficiencyAdjustmentApplied: true,
      },
      {
        planId: 'plan-A-2',
        facilityId: 'facility-A',
        teamId: 'team-1',
        workInstructionId: 'work-001',
        proposedAllocations: [
          {
            workerId: 'worker-002',
            workerName: 'Worker 002',
            assignedWorkType: 'assembly',
            proficiencyLevel: 'beginner',
            adjustedDifficulty: 'easy',
            estimatedWorkHours: 10,
            productivityRate: 70,
          },
        ],
        feasibilityScore: 75,
        recommendationRank: 2,
        estimatedCompletionDate: new Date(Date.now() + 172800000).toISOString(),
        proficiencyAdjustmentApplied: true,
      },
      {
        planId: 'plan-A-3',
        facilityId: 'facility-A',
        teamId: 'team-1',
        workInstructionId: 'work-001',
        proposedAllocations: [
          {
            workerId: 'worker-003',
            workerName: 'Worker 003',
            assignedWorkType: 'assembly',
            proficiencyLevel: 'advanced',
            adjustedDifficulty: 'hard',
            estimatedWorkHours: 6,
            productivityRate: 95,
          },
        ],
        feasibilityScore: 95,
        recommendationRank: 1,
        estimatedCompletionDate: new Date(Date.now() + 43200000).toISOString(),
        proficiencyAdjustmentApplied: true,
      },
    ];

    const facilityBPlans: GeneratedAllocationPlan[] = [
      {
        planId: 'plan-B-1',
        facilityId: 'facility-B',
        teamId: 'team-2',
        workInstructionId: 'work-002',
        proposedAllocations: [
          {
            workerId: 'worker-004',
            workerName: 'Worker 004',
            assignedWorkType: 'packing',
            proficiencyLevel: 'intermediate',
            adjustedDifficulty: 'normal',
            estimatedWorkHours: 8,
            productivityRate: 80,
          },
        ],
        feasibilityScore: 85,
        recommendationRank: 1,
        estimatedCompletionDate: new Date(Date.now() + 86400000).toISOString(),
        proficiencyAdjustmentApplied: true,
      },
      {
        planId: 'plan-B-2',
        facilityId: 'facility-B',
        teamId: 'team-2',
        workInstructionId: 'work-002',
        proposedAllocations: [
          {
            workerId: 'worker-005',
            workerName: 'Worker 005',
            assignedWorkType: 'packing',
            proficiencyLevel: 'beginner',
            adjustedDifficulty: 'easy',
            estimatedWorkHours: 10,
            productivityRate: 65,
          },
        ],
        feasibilityScore: 70,
        recommendationRank: 2,
        estimatedCompletionDate: new Date(Date.now() + 172800000).toISOString(),
        proficiencyAdjustmentApplied: true,
      },
    ];

    mockGenerateAllocationPlans = jest
      .fn()
      .mockImplementation((facilityId) => {
        if (facilityId === 'facility-A') return Promise.resolve(facilityAPlans);
        if (facilityId === 'facility-B') return Promise.resolve(facilityBPlans);
        return Promise.reject(new Error('Unknown facility'));
      });

    const facilityAApprovedPlans: ApprovedAllocationPlan[] = [
      {
        planId: 'plan-A-1',
        approvalStatus: 'auto_approved',
        approvalTimestamp: new Date().toISOString(),
      },
      {
        planId: 'plan-A-3',
        approvalStatus: 'auto_approved',
        approvalTimestamp: new Date().toISOString(),
      },
    ];

    const facilityBApprovedPlans: ApprovedAllocationPlan[] = [
      {
        planId: 'plan-B-1',
        approvalStatus: 'auto_approved',
        approvalTimestamp: new Date().toISOString(),
      },
    ];

    mockJudgeAllocationPlanApprovalWithCriteria = jest
      .fn()
      .mockImplementation((facilityId) => {
        if (facilityId === 'facility-A')
          return Promise.resolve(facilityAApprovedPlans);
        if (facilityId === 'facility-B')
          return Promise.resolve(facilityBApprovedPlans);
        return Promise.reject(new Error('Unknown facility'));
      });

    const facilityADeliveryResults: DeliveryResult[] = [
      {
        deliveryId: 'delivery-A-1',
        planId: 'plan-A-1',
        targetFieldLeaderId: 'leader-A',
        deliveryStatus: 'delivered',
        deliveryTimestamp: new Date().toISOString(),
        receptionConfirmed: true,
        receptionConfirmationTimestamp: new Date().toISOString(),
        executionStarted: true,
        executionStartTimestamp: new Date().toISOString(),
      },
      {
        deliveryId: 'delivery-A-3',
        planId: 'plan-A-3',
        targetFieldLeaderId: 'leader-A',
        deliveryStatus: 'delivered',
        deliveryTimestamp: new Date().toISOString(),
        receptionConfirmed: true,
        receptionConfirmationTimestamp: new Date().toISOString(),
        executionStarted: true,
        executionStartTimestamp: new Date().toISOString(),
      },
    ];

    const facilityBDeliveryResults: DeliveryResult[] = [
      {
        deliveryId: 'delivery-B-1',
        planId: 'plan-B-1',
        targetFieldLeaderId: 'leader-B',
        deliveryStatus: 'delivery_failed',
        deliveryTimestamp: new Date().toISOString(),
        receptionConfirmed: false,
        executionStarted: false,
      },
    ];

    mockDeliverAllocationPlanAndWorkInstructions = jest
      .fn()
      .mockImplementation((planId) => {
        if (planId === 'plan-A-1' || planId === 'plan-A-3')
          return Promise.resolve(facilityADeliveryResults);
        if (planId === 'plan-B-1')
          return Promise.resolve(facilityBDeliveryResults);
        return Promise.reject(new Error('Unknown plan'));
      });
  });

  it('should return partial_failure status with delivery error when facility-B delivery fails', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      targetTeamIds: ['team-1', 'team-2'],
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, aiClient);

    expect(result.executionStatus).toBe('partial_failure');
  });

  it('should include execution errors with delivery failure details and exact error message', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      targetTeamIds: ['team-1', 'team-2'],
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, aiClient);

    expect(result.executionErrors).toBeDefined();
    expect(Array.isArray(result.executionErrors)).toBe(true);
    expect(result.executionErrors.length).toBeGreaterThanOrEqual(1);

    const deliveryError = result.executionErrors.find(
      (err) => err.errorCode === 'DeliveryInstructionFailureError'
    );
    expect(deliveryError).toBeDefined();
    expect(deliveryError?.errorMessage).toBe(
      '配置指示の配信に失敗しました。現場リーダーへの手動通知を検討してください。'
    );
  });

  it('should return valid DelayDetectionResult with all required fields', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      targetTeamIds: ['team-1', 'team-2'],
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, aiClient);

    expect(result.delayDetectionResult).toBeDefined();
    expect(result.delayDetectionResult.detectionTimestamp).toBeDefined();
    expect(typeof result.delayDetectionResult.detectionTimestamp).toBe('string');
    expect(result.delayDetectionResult.delayDetected).toBe(true);
    expect(Array.isArray(result.delayDetectionResult.affectedFacilities)).toBe(
      true
    );
    expect(typeof result.delayDetectionResult.qualityVarianceDetected).toBe('boolean');
    expect(typeof result.delayDetectionResult.overallRiskScore).toBe('number');
  });

  it('should return 5 generated allocation plans (3 for facility-A, 2 for facility-B)', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      targetTeamIds: ['team-1', 'team-2'],
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, aiClient);

    expect(result.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(result.generatedAllocationPlans)).toBe(true);
    expect(result.generatedAllocationPlans.length).toBe(5);

    const facilityAPlans = result.generatedAllocationPlans.filter(
      (p) => p.facilityId === 'facility-A'
    );
    const facilityBPlans = result.generatedAllocationPlans.filter(
      (p) => p.facilityId === 'facility-B'
    );
    expect(facilityAPlans.length).toBe(3);
    expect(facilityBPlans.length).toBe(2);
  });

  it('should return 3 approved allocation plans (2 for facility-A, 1 for facility-B)', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      targetTeamIds: ['team-1', 'team-2'],
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, aiClient);

    expect(result.approvedAllocationPlans).toBeDefined();
    expect(Array.isArray(result.approvedAllocationPlans)).toBe(true);
    expect(result.approvedAllocationPlans.length).toBe(3);

    const facilityAApprovedCount = result.approvedAllocationPlans.filter(
      (plan) => {
        const correspondingGenerated = result.generatedAllocationPlans.find(
          (p) => p.planId === plan.planId
        );
        return correspondingGenerated?.facilityId === 'facility-A';
      }
    ).length;

    const facilityBApprovedCount = result.approvedAllocationPlans.filter(
      (plan) => {
        const correspondingGenerated = result.generatedAllocationPlans.find(
          (p) => p.planId === plan.planId
        );
        return correspondingGenerated?.facilityId === 'facility-B';
      }
    ).length;

    expect(facilityAApprovedCount).toBe(2);
    expect(facilityBApprovedCount).toBe(1);
  });

  it('should return 3 delivery results with facility-A success and facility-B failure', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      targetTeamIds: ['team-1', 'team-2'],
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, aiClient);

    expect(result.deliveryResults).toBeDefined();
    expect(Array.isArray(result.deliveryResults)).toBe(true);
    expect(result.deliveryResults.length).toBe(3);

    const successResults = result.deliveryResults.filter(
      (d) => d.deliveryStatus === 'delivered'
    );
    const failureResults = result.deliveryResults.filter(
      (d) => d.deliveryStatus === 'delivery_failed'
    );
    expect(successResults.length).toBe(2);
    expect(failureResults.length).toBe(1);
  });

  it('should generate executionId as string', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      targetTeamIds: ['team-1', 'team-2'],
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, aiClient);

    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.executionId.length).toBeGreaterThan(0);
  });

  it('should set executionTimestamp as ISO 8601 formatted string', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      targetTeamIds: ['team-1', 'team-2'],
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      recordOperationAudit: mockRecordOperationAudit,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria:
        mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions:
        mockDeliverAllocationPlanAndWorkInstructions,
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, aiClient);

    expect(result.executionTimestamp).toBeDefined();
    expect(typeof result.executionTimestamp).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.executionTimestamp)).toBe(
      true
    );
  });
});