import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { Tx4Imp1AgentInput, Tx4Imp1AgentOutput } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-075: generatedAllocationPlans に複数の配置案が含まれる場合、実現可能性スコアと推奨順位が正しく付与される', () => {
  let mockAiClient: any;

  beforeEach(() => {
    mockAiClient = {
      authorizeOperation: jest.fn().mockResolvedValue({ authorized: true }),
      monitorAndJudgeDelayRisk: jest.fn().mockResolvedValue({
        delayRiskJudgments: [
          {
            workInstructionId: 'wi-001',
            facilityId: 'facility-A',
            teamId: 'team-1',
            riskLevel: 'high',
            delayDays: 2,
            recommendedAction: 'Reallocate staff',
          },
        ],
      }),
      generateAllocationPlans: jest.fn().mockResolvedValue({
        allocationPlans: [
          {
            allocationPlanId: 'plan-1',
            facilityId: 'facility-A',
            teamId: 'team-1',
            workInstructionId: 'wi-001',
            workerAllocations: [
              {
                workerId: 'worker-1',
                workerName: 'Alice',
                proficiencyLevel: 'advanced',
                assignedWorkType: 'assembly',
                allocatedHours: 8,
                productivityRate: 95,
              },
            ],
            realizabilityScore: 85.5,
            recommendedPriority: 1,
            expectedCompletionDate: new Date().toISOString(),
            rationale: 'High skill match',
          },
          {
            allocationPlanId: 'plan-2',
            facilityId: 'facility-A',
            teamId: 'team-1',
            workInstructionId: 'wi-001',
            workerAllocations: [
              {
                workerId: 'worker-2',
                workerName: 'Bob',
                proficiencyLevel: 'intermediate',
                assignedWorkType: 'assembly',
                allocatedHours: 8,
                productivityRate: 75,
              },
            ],
            realizabilityScore: 72.0,
            recommendedPriority: 2,
            expectedCompletionDate: new Date().toISOString(),
            rationale: 'Medium skill match',
          },
          {
            allocationPlanId: 'plan-3',
            facilityId: 'facility-A',
            teamId: 'team-1',
            workInstructionId: 'wi-001',
            workerAllocations: [
              {
                workerId: 'worker-3',
                workerName: 'Charlie',
                proficiencyLevel: 'beginner',
                assignedWorkType: 'assembly',
                allocatedHours: 8,
                productivityRate: 60,
              },
            ],
            realizabilityScore: 65.3,
            recommendedPriority: 3,
            expectedCompletionDate: new Date().toISOString(),
            rationale: 'Lower skill match',
          },
        ],
      }),
      judgeAllocationPlanApprovalWithCriteria: jest.fn().mockResolvedValue({
        approvalResults: [
          {
            allocationPlanId: 'plan-1',
            approvalStatus: 'pending_approval',
            approvalReason: 'Awaiting manual review',
            approverUserId: null,
            approvalTimestamp: new Date().toISOString(),
          },
          {
            allocationPlanId: 'plan-2',
            approvalStatus: 'pending_approval',
            approvalReason: 'Awaiting manual review',
            approverUserId: null,
            approvalTimestamp: new Date().toISOString(),
          },
          {
            allocationPlanId: 'plan-3',
            approvalStatus: 'pending_approval',
            approvalReason: 'Awaiting manual review',
            approverUserId: null,
            approvalTimestamp: new Date().toISOString(),
          },
        ],
      }),
      deliverAllocationPlanAndWorkInstructions: jest.fn().mockResolvedValue({
        deliveredInstructions: [
          {
            workInstructionId: 'wi-001',
            deliveryMethod: 'handy_terminal',
            deliveredToFieldLeaderId: 'leader-1',
            deliveryTimestamp: new Date().toISOString(),
            deliveryStatus: 'delivered',
          },
        ],
      }),
      recordOperationAudit: jest.fn().mockResolvedValue({ recorded: true }),
    };
  });

  test('複数の配置案が実現可能性スコアの高い順に優先度ランク付けされる', async () => {
    const input: Tx4Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['facility-A', 'facility-B'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const output: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, mockAiClient);

    expect(output.generatedAllocationPlans).toBeDefined();
    expect(output.generatedAllocationPlans.length).toBeGreaterThanOrEqual(3);

    expect(output.executionStatus).toBe('completed');
    expect(output.errorSummary).toBeNull();

    const plans = output.generatedAllocationPlans;

    // ソート済みの状態で各プランを検証
    const sortedPlans = [...plans].sort(
      (a, b) => b.realizabilityScore - a.realizabilityScore,
    );

    sortedPlans.forEach((plan) => {
      expect(plan.allocationPlanId).toBeDefined();
      expect(plan.facilityId).toBeDefined();
      expect(plan.teamId).toBeDefined();
      expect(plan.workInstructionId).toBeDefined();
      expect(plan.workerAllocations).toBeDefined();
      expect(Array.isArray(plan.workerAllocations)).toBe(true);
      expect(plan.realizabilityScore).toBeDefined();
      expect(typeof plan.realizabilityScore).toBe('number');
      expect(plan.recommendedPriority).toBeDefined();
      expect(typeof plan.recommendedPriority).toBe('number');
      expect(plan.expectedCompletionDate).toBeDefined();
    });

    // スコア降順を検証
    for (let i = 0; i < sortedPlans.length - 1; i++) {
      expect(sortedPlans[i].realizabilityScore).toBeGreaterThanOrEqual(
        sortedPlans[i + 1].realizabilityScore,
      );
    }

    // 優先度ランクが1から始まる連番であることを検証
    const ranks = sortedPlans.map((p) => p.recommendedPriority);
    const uniqueRanks = new Set(ranks);
    expect(uniqueRanks.size).toBe(sortedPlans.length);

    const sortedRanks = Array.from(uniqueRanks).sort((a, b) => a - b);
    for (let i = 0; i < sortedRanks.length; i++) {
      expect(sortedRanks[i]).toBe(i + 1);
    }

    // スコアが高い順に優先度ランクが1, 2, 3, ...となることを検証
    for (let i = 0; i < sortedPlans.length; i++) {
      expect(sortedPlans[i].recommendedPriority).toBe(i + 1);
    }
  });

  test('配置案が3件以上生成され、すべてのフィールドが存在する', async () => {
    const input: Tx4Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['facility-A', 'facility-B'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const output: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, mockAiClient);

    expect(output.generatedAllocationPlans.length).toBeGreaterThanOrEqual(3);

    output.generatedAllocationPlans.forEach((plan) => {
      expect(plan).toHaveProperty('allocationPlanId');
      expect(plan).toHaveProperty('facilityId');
      expect(plan).toHaveProperty('teamId');
      expect(plan).toHaveProperty('workInstructionId');
      expect(plan).toHaveProperty('workerAllocations');
      expect(plan).toHaveProperty('realizabilityScore');
      expect(plan).toHaveProperty('recommendedPriority');
      expect(plan).toHaveProperty('expectedCompletionDate');

      // workerAllocations の要素が WorkerAllocationDetail 構造を持つか検証
      if (Array.isArray(plan.workerAllocations) && plan.workerAllocations.length > 0) {
        plan.workerAllocations.forEach((allocation) => {
          expect(allocation).toHaveProperty('workerId');
          expect(allocation).toHaveProperty('workerName');
          expect(allocation).toHaveProperty('proficiencyLevel');
          expect(allocation).toHaveProperty('assignedWorkType');
          expect(allocation).toHaveProperty('allocatedHours');
          expect(allocation).toHaveProperty('productivityRate');
        });
      }
    });
  });

  test('実現可能性スコアが同一の複数提案でも、優先度ランク値に重複や欠番がない', async () => {
    mockAiClient.generateAllocationPlans.mockResolvedValue({
      allocationPlans: [
        {
          allocationPlanId: 'plan-1',
          facilityId: 'facility-A',
          teamId: 'team-1',
          workInstructionId: 'wi-001',
          workerAllocations: [
            {
              workerId: 'worker-1',
              workerName: 'Alice',
              proficiencyLevel: 'advanced',
              assignedWorkType: 'assembly',
              allocatedHours: 8,
              productivityRate: 90,
            },
          ],
          realizabilityScore: 75.0,
          recommendedPriority: 1,
          expectedCompletionDate: new Date().toISOString(),
          rationale: 'First option',
        },
        {
          allocationPlanId: 'plan-2',
          facilityId: 'facility-A',
          teamId: 'team-1',
          workInstructionId: 'wi-001',
          workerAllocations: [
            {
              workerId: 'worker-2',
              workerName: 'Bob',
              proficiencyLevel: 'intermediate',
              assignedWorkType: 'assembly',
              allocatedHours: 8,
              productivityRate: 75,
            },
          ],
          realizabilityScore: 75.0,
          recommendedPriority: 2,
          expectedCompletionDate: new Date().toISOString(),
          rationale: 'Second option',
        },
        {
          allocationPlanId: 'plan-3',
          facilityId: 'facility-A',
          teamId: 'team-1',
          workInstructionId: 'wi-001',
          workerAllocations: [
            {
              workerId: 'worker-3',
              workerName: 'Charlie',
              proficiencyLevel: 'beginner',
              assignedWorkType: 'assembly',
              allocatedHours: 8,
              productivityRate: 60,
            },
          ],
          realizabilityScore: 60.0,
          recommendedPriority: 3,
          expectedCompletionDate: new Date().toISOString(),
          rationale: 'Third option',
        },
      ],
    });

    const input: Tx4Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['facility-A', 'facility-B'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const output: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, mockAiClient);

    const plans = output.generatedAllocationPlans;
    const ranks = plans.map((p) => p.recommendedPriority).sort((a, b) => a - b);

    // 優先度ランク値に重複がないことを検証
    const uniqueRanks = new Set(ranks);
    expect(uniqueRanks.size).toBe(ranks.length);

    // 優先度ランク値に欠番がないことを検証
    for (let i = 0; i < ranks.length; i++) {
      expect(ranks[i]).toBe(i + 1);
    }

    // スコア降順でソートしたときに推奨優先度が1, 2, 3, ...となることを検証
    const sortedByScore = [...plans].sort(
      (a, b) => b.realizabilityScore - a.realizabilityScore,
    );
    for (let i = 0; i < sortedByScore.length; i++) {
      expect(sortedByScore[i].recommendedPriority).toBe(i + 1);
    }
  });

  test('executionStatus が completed で errorSummary が null である', async () => {
    const input: Tx4Imp1AgentInput = {
      userId: 'user-001',
      facilityIds: ['facility-A', 'facility-B'],
      monitoringIntervalMinutes: 15,
      riskThresholdScore: 60,
      autoApprovalEnabled: false,
    };

    const output: Tx4Imp1AgentOutput = await runTx4Imp1Agent(input, mockAiClient);

    expect(output.executionStatus).toBe('completed');
    expect(output.errorSummary).toBeNull();
  });
});