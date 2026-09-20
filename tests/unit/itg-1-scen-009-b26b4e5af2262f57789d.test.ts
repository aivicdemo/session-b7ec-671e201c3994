import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';

// Mock the external service adapters and dependencies
jest.mock('../../src/services/authorization-service', () => ({
  authorizeOperation: jest.fn(),
}));

jest.mock('../../src/services/delay-risk-monitor', () => ({
  monitorAndJudgeDelayRisk: jest.fn(),
}));

jest.mock('../../src/services/allocation-plan-generator', () => ({
  generateAllocationPlans: jest.fn(),
}));

jest.mock('../../src/services/allocation-approval-service', () => ({
  judgeAllocationPlanApprovalWithCriteria: jest.fn(),
}));

jest.mock('../../src/services/allocation-delivery-service', () => ({
  deliverAllocationPlanAndWorkInstructions: jest.fn(),
}));

jest.mock('../../src/services/audit-service', () => ({
  recordOperationAudit: jest.fn(),
}));

jest.mock('../../src/services/notification-service-adapter', () => ({
  deliverAllocationInstructionToFieldLeader: jest.fn(),
}));

jest.mock('../../src/services/user-facility-access-resolver', () => ({
  resolveAccessibleFacilities: jest.fn(),
}));

import { authorizeOperation } from '../../src/services/authorization-service';
import { monitorAndJudgeDelayRisk } from '../../src/services/delay-risk-monitor';
import { generateAllocationPlans } from '../../src/services/allocation-plan-generator';
import { judgeAllocationPlanApprovalWithCriteria } from '../../src/services/allocation-approval-service';
import { deliverAllocationPlanAndWorkInstructions } from '../../src/services/allocation-delivery-service';
import { recordOperationAudit } from '../../src/services/audit-service';
import { deliverAllocationInstructionToFieldLeader } from '../../src/services/notification-service-adapter';
import { resolveAccessibleFacilities } from '../../src/services/user-facility-access-resolver';

describe('SCEN-009: 境界系：targetFacilityIdsが空配列の場合、実行ユーザーがアクセス可能な全拠点を監視対象とする', () => {
  const executorUserId = 'user-001';
  const accessibleFacilities = ['facility-A', 'facility-B', 'facility-C'];
  const delayDetectionResultMock = {
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
            teamId: 'team-A1',
            teamName: 'Team A1',
            progressRate: 45,
            plannedProgressRate: 70,
            delayDays: 3,
            qualityScore: 82,
          },
        ],
      },
    ],
    qualityVarianceDetected: false,
    overallRiskScore: 65,
  };

  const generatedAllocationPlansMock = [
    {
      planId: 'plan-001',
      facilityId: 'facility-A',
      teamId: 'team-A1',
      workInstructionId: 'work-001',
      proposedAllocations: [
        {
          workerId: 'worker-001',
          workerName: 'Worker One',
          assignedWorkType: 'assembly',
          proficiencyLevel: 'intermediate',
          adjustedDifficulty: 'normal',
          estimatedWorkHours: 8,
          productivityRate: 85,
        },
      ],
      feasibilityScore: 88,
      recommendationRank: 1,
      estimatedCompletionDate: new Date(Date.now() + 86400000).toISOString(),
      proficiencyAdjustmentApplied: true,
    },
  ];

  const approvedAllocationPlansMock = [
    {
      planId: 'plan-001',
      approvalStatus: 'auto_approved',
      approvalTimestamp: new Date().toISOString(),
      approverUserId: undefined,
    },
  ];

  const deliveryResultsMock = [
    {
      deliveryId: 'delivery-001',
      planId: 'plan-001',
      targetFieldLeaderId: 'field-leader-001',
      deliveryStatus: 'delivered',
      deliveryTimestamp: new Date().toISOString(),
      receptionConfirmed: true,
      receptionConfirmationTimestamp: new Date().toISOString(),
      executionStarted: true,
      executionStartTimestamp: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup authorization mock
    (authorizeOperation as jest.Mock).mockResolvedValue({ authorized: true });

    // Setup facility access resolver mock
    (resolveAccessibleFacilities as jest.Mock).mockResolvedValue(accessibleFacilities);

    // Setup delay risk monitor mock
    (monitorAndJudgeDelayRisk as jest.Mock).mockResolvedValue(delayDetectionResultMock);

    // Setup allocation plan generator mock
    (generateAllocationPlans as jest.Mock).mockResolvedValue(generatedAllocationPlansMock);

    // Setup approval service mock
    (judgeAllocationPlanApprovalWithCriteria as jest.Mock).mockResolvedValue(approvedAllocationPlansMock);

    // Setup delivery service mock
    (deliverAllocationPlanAndWorkInstructions as jest.Mock).mockResolvedValue(deliveryResultsMock);

    // Setup audit service mock
    (recordOperationAudit as jest.Mock).mockResolvedValue({ recorded: true });

    // Setup notification adapter mock
    (deliverAllocationInstructionToFieldLeader as jest.Mock).mockResolvedValue({ sent: true });
  });

  it('targetFacilityIds が空配列の場合、実行ユーザーがアクセス可能な全拠点を監視対象とする', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId,
      targetFacilityIds: [],
      targetTeamIds: undefined,
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    // Execute the agent
    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, {
      authorizeOperation,
      monitorAndJudgeDelayRisk,
      generateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions,
      recordOperationAudit,
      deliverAllocationInstructionToFieldLeader,
      resolveAccessibleFacilities,
    });

    // Verify authorization was called
    expect(authorizeOperation).toHaveBeenCalledWith({
      executorUserId,
      requiredPermission: expect.any(String),
    });

    // Verify facility access resolution was called
    expect(resolveAccessibleFacilities).toHaveBeenCalledWith(executorUserId);

    // Verify monitoring was called with resolved facilities and no team filter
    expect(monitorAndJudgeDelayRisk).toHaveBeenCalledWith({
      targetFacilityIds: accessibleFacilities,
      targetTeamIds: undefined,
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
    });

    // Verify allocation plan generation was called
    expect(generateAllocationPlans).toHaveBeenCalledWith(delayDetectionResultMock);

    // Verify approval judgment was called
    expect(judgeAllocationPlanApprovalWithCriteria).toHaveBeenCalledWith({
      generatedPlans: generatedAllocationPlansMock,
      autoApprovalEnabled: true,
    });

    // Verify delivery was called
    expect(deliverAllocationPlanAndWorkInstructions).toHaveBeenCalledWith(approvedAllocationPlansMock);

    // Verify audit recording was called
    expect(recordOperationAudit).toHaveBeenCalledWith({
      executorUserId,
      operationType: 'agent_execution',
      targetFacilities: accessibleFacilities,
      operationDetails: expect.any(Object),
    });

    // Verify output structure and content
    expect(output).toBeDefined();
    expect(output.executionStatus).toBe('completed');
    expect(output.executionId).toBeTruthy();
    expect(typeof output.executionId).toBe('string');
    expect(output.executionId.length).toBeGreaterThan(0);

    expect(output.delayDetectionResult).toBeDefined();
    expect(output.delayDetectionResult.affectedFacilities).toHaveLength(1);
    expect(output.delayDetectionResult.affectedFacilities[0].facilityId).toBe('facility-A');

    expect(output.generatedAllocationPlans).toBeDefined();
    expect(output.generatedAllocationPlans).toHaveLength(1);
    expect(output.generatedAllocationPlans[0].planId).toBe('plan-001');

    expect(output.approvedAllocationPlans).toBeDefined();
    expect(output.approvedAllocationPlans).toHaveLength(1);
    expect(output.approvedAllocationPlans[0].approvalStatus).toBe('auto_approved');

    expect(output.deliveryResults).toBeDefined();
    expect(output.deliveryResults).toHaveLength(1);
    expect(output.deliveryResults[0].deliveryStatus).toBe('delivered');
    expect(output.deliveryResults[0].receptionConfirmed).toBe(true);
    expect(output.deliveryResults[0].executionStarted).toBe(true);

    expect(output.executionErrors).toBeUndefined();

    expect(output.executionTimestamp).toBeTruthy();
    expect(typeof output.executionTimestamp).toBe('string');
    // Verify ISO 8601 format
    expect(new Date(output.executionTimestamp).toISOString()).toBe(output.executionTimestamp);
  });
});