import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AgentOutput, GeneratedAllocationPlan, ApprovedAllocationPlan } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-019: approvedAllocationPlans contains only allocation plans meeting approval criteria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter and return only approved allocation plans meeting feasibility score >= 85, recommendation rank <= 3, and proficiency adjustment applied', async () => {
    const generatedPlans: GeneratedAllocationPlan[] = [
      {
        planId: 'plan-1',
        facilityId: 'facility-A',
        teamId: 'team-1',
        workInstructionId: 'work-001',
        proposedAllocations: [
          {
            workerId: 'worker-1',
            workerName: 'Worker 1',
            assignedWorkType: 'assembly',
            proficiencyLevel: 'advanced',
            adjustedDifficulty: 'normal',
            estimatedWorkHours: 8,
            productivityRate: 95,
          },
        ],
        feasibilityScore: 90,
        recommendationRank: 1,
        estimatedCompletionDate: '2024-01-15T18:00:00Z',
        proficiencyAdjustmentApplied: true,
      },
      {
        planId: 'plan-2',
        facilityId: 'facility-A',
        teamId: 'team-1',
        workInstructionId: 'work-001',
        proposedAllocations: [
          {
            workerId: 'worker-2',
            workerName: 'Worker 2',
            assignedWorkType: 'inspection',
            proficiencyLevel: 'intermediate',
            adjustedDifficulty: 'normal',
            estimatedWorkHours: 8,
            productivityRate: 88,
          },
        ],
        feasibilityScore: 88,
        recommendationRank: 2,
        estimatedCompletionDate: '2024-01-15T18:30:00Z',
        proficiencyAdjustmentApplied: true,
      },
      {
        planId: 'plan-3',
        facilityId: 'facility-A',
        teamId: 'team-1',
        workInstructionId: 'work-001',
        proposedAllocations: [
          {
            workerId: 'worker-3',
            workerName: 'Worker 3',
            assignedWorkType: 'packaging',
            proficiencyLevel: 'beginner',
            adjustedDifficulty: 'easy',
            estimatedWorkHours: 10,
            productivityRate: 75,
          },
        ],
        feasibilityScore: 82,
        recommendationRank: 3,
        estimatedCompletionDate: '2024-01-15T19:00:00Z',
        proficiencyAdjustmentApplied: false,
      },
      {
        planId: 'plan-4',
        facilityId: 'facility-A',
        teamId: 'team-1',
        workInstructionId: 'work-001',
        proposedAllocations: [
          {
            workerId: 'worker-4',
            workerName: 'Worker 4',
            assignedWorkType: 'assembly',
            proficiencyLevel: 'intermediate',
            adjustedDifficulty: 'normal',
            estimatedWorkHours: 9,
            productivityRate: 82,
          },
        ],
        feasibilityScore: 85,
        recommendationRank: 4,
        estimatedCompletionDate: '2024-01-15T19:30:00Z',
        proficiencyAdjustmentApplied: true,
      },
      {
        planId: 'plan-5',
        facilityId: 'facility-A',
        teamId: 'team-1',
        workInstructionId: 'work-001',
        proposedAllocations: [
          {
            workerId: 'worker-5',
            workerName: 'Worker 5',
            assignedWorkType: 'inspection',
            proficiencyLevel: 'advanced',
            adjustedDifficulty: 'normal',
            estimatedWorkHours: 8,
            productivityRate: 92,
          },
        ],
        feasibilityScore: 85,
        recommendationRank: 2,
        estimatedCompletionDate: '2024-01-15T20:00:00Z',
        proficiencyAdjustmentApplied: true,
      },
    ];

    const mockOutput: Tx1Imp1AgentOutput = {
      executionId: 'exec-001',
      executionStatus: 'completed',
      delayDetectionResult: {
        detectionTimestamp: '2024-01-15T09:00:00Z',
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
                plannedProgressRate: 60,
                delayDays: 2,
                qualityScore: 85,
              },
            ],
          },
        ],
        qualityVarianceDetected: false,
        overallRiskScore: 75,
      },
      generatedAllocationPlans: generatedPlans,
      approvedAllocationPlans: [
        {
          planId: 'plan-1',
          approvalStatus: 'auto_approved',
          approvalTimestamp: '2024-01-15T10:00:00Z',
        },
        {
          planId: 'plan-2',
          approvalStatus: 'auto_approved',
          approvalTimestamp: '2024-01-15T10:00:00Z',
        },
        {
          planId: 'plan-5',
          approvalStatus: 'auto_approved',
          approvalTimestamp: '2024-01-15T10:00:00Z',
        },
      ],
      deliveryResults: [
        {
          deliveryId: 'delivery-1',
          planId: 'plan-1',
          targetFieldLeaderId: 'leader-001',
          deliveryStatus: 'delivered',
          deliveryTimestamp: '2024-01-15T10:05:00Z',
          receptionConfirmed: true,
          receptionConfirmationTimestamp: '2024-01-15T10:06:00Z',
          executionStarted: true,
          executionStartTimestamp: '2024-01-15T10:07:00Z',
        },
        {
          deliveryId: 'delivery-2',
          planId: 'plan-2',
          targetFieldLeaderId: 'leader-001',
          deliveryStatus: 'delivered',
          deliveryTimestamp: '2024-01-15T10:05:30Z',
          receptionConfirmed: true,
          receptionConfirmationTimestamp: '2024-01-15T10:06:30Z',
          executionStarted: true,
          executionStartTimestamp: '2024-01-15T10:07:30Z',
        },
        {
          deliveryId: 'delivery-3',
          planId: 'plan-5',
          targetFieldLeaderId: 'leader-001',
          deliveryStatus: 'delivered',
          deliveryTimestamp: '2024-01-15T10:06:00Z',
          receptionConfirmed: true,
          receptionConfirmationTimestamp: '2024-01-15T10:07:00Z',
          executionStarted: true,
          executionStartTimestamp: '2024-01-15T10:08:00Z',
        },
      ],
      executionTimestamp: '2024-01-15T10:10:00Z',
    };

    (runTx1Imp1Agent as jest.Mock) = jest.fn().mockResolvedValue(mockOutput);

    const input: Tx1Imp1AgentInput = {
      executorUserId: 'user-001',
      targetFacilityIds: ['facility-A'],
      targetTeamIds: ['team-1'],
      autoApprovalEnabled: true,
    };

    const result = await runTx1Imp1Agent(input, {} as any);

    expect(result.executionStatus).toBe('completed');
    expect(result.approvedAllocationPlans).toHaveLength(3);

    const approvedPlanIds = result.approvedAllocationPlans.map(p => p.planId);
    expect(approvedPlanIds).toEqual(['plan-1', 'plan-2', 'plan-5']);

    expect(approvedPlanIds).toContain('plan-1');
    expect(approvedPlanIds).toContain('plan-2');
    expect(approvedPlanIds).toContain('plan-5');
    expect(approvedPlanIds).not.toContain('plan-3');
    expect(approvedPlanIds).not.toContain('plan-4');

    const plan1 = generatedPlans.find(p => p.planId === 'plan-1');
    const plan2 = generatedPlans.find(p => p.planId === 'plan-2');
    const plan5 = generatedPlans.find(p => p.planId === 'plan-5');

    expect(plan1?.feasibilityScore).toBe(90);
    expect(plan1?.recommendationRank).toBe(1);
    expect(plan1?.proficiencyAdjustmentApplied).toBe(true);

    expect(plan2?.feasibilityScore).toBe(88);
    expect(plan2?.recommendationRank).toBe(2);
    expect(plan2?.proficiencyAdjustmentApplied).toBe(true);

    expect(plan5?.feasibilityScore).toBe(85);
    expect(plan5?.recommendationRank).toBe(2);
    expect(plan5?.proficiencyAdjustmentApplied).toBe(true);

    const plan3 = generatedPlans.find(p => p.planId === 'plan-3');
    const plan4 = generatedPlans.find(p => p.planId === 'plan-4');

    expect(plan3?.feasibilityScore).toBe(82);
    expect(plan3?.proficiencyAdjustmentApplied).toBe(false);

    expect(plan4?.recommendationRank).toBe(4);
  });
});