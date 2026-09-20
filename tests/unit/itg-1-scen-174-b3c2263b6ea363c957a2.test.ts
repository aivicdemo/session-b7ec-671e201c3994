import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';
import type {
  GenerateAllocationPlansInput,
  GenerateAllocationPlansOutput,
} from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-174: 利用可能な作業者の得意作業が対応チームの作業内容とマッチングされる', () => {
  it('should generate allocation plans with matched worker skills to team work requirements', async () => {
    // Arrange: Build GenerateAllocationPlansInput
    const facilityId1 = 'fac-001';
    const facilityId2 = 'fac-002';
    const teamId1 = 'team-001';
    const teamId2 = 'team-002';
    const workInstructionId1 = 'WI-001';
    const workInstructionId2 = 'WI-002';
    const workInstructionId3 = 'WI-003';
    const workerId1 = 'worker-001';
    const workerId2 = 'worker-002';
    const workerId3 = 'worker-003';
    const workerId4 = 'worker-004';
    const userId = 'user-001';

    const input: GenerateAllocationPlansInput = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: workInstructionId1,
          facilityId: facilityId1,
          teamId: teamId1,
          riskLevel: 'HIGH',
          delayPredictionDays: 5,
          currentProgressRate: 40,
          plannedProgressRate: 70,
          recommendedAction: 'Allocate additional resources',
        },
        {
          riskJudgmentId: 'risk-002',
          workInstructionId: workInstructionId2,
          facilityId: facilityId1,
          teamId: teamId2,
          riskLevel: 'MEDIUM',
          delayPredictionDays: 2,
          currentProgressRate: 60,
          plannedProgressRate: 80,
          recommendedAction: 'Monitor and adjust',
        },
        {
          riskJudgmentId: 'risk-003',
          workInstructionId: workInstructionId3,
          facilityId: facilityId2,
          teamId: teamId1,
          riskLevel: 'LOW',
          delayPredictionDays: 0,
          currentProgressRate: 85,
          plannedProgressRate: 85,
          recommendedAction: 'Continue as planned',
        },
      ],
      productivityData: [
        {
          workerId: workerId1,
          facilityId: facilityId1,
          teamId: teamId1,
          productivityRate: 0.95,
          qualityScore: 98,
          proficiencyLevel: 'ADVANCED',
          recentWorkResults: [
            {
              workInstructionId: workInstructionId1,
              completionRate: 95,
              errorCount: 0,
            },
            {
              workInstructionId: workInstructionId2,
              completionRate: 90,
              errorCount: 1,
            },
          ],
        },
        {
          workerId: workerId2,
          facilityId: facilityId1,
          teamId: teamId2,
          productivityRate: 0.85,
          qualityScore: 85,
          proficiencyLevel: 'INTERMEDIATE',
          recentWorkResults: [
            {
              workInstructionId: workInstructionId2,
              completionRate: 70,
              errorCount: 2,
            },
          ],
        },
        {
          workerId: workerId3,
          facilityId: facilityId1,
          teamId: teamId1,
          productivityRate: 0.60,
          qualityScore: 70,
          proficiencyLevel: 'BEGINNER',
          recentWorkResults: [
            {
              workInstructionId: workInstructionId3,
              completionRate: 50,
              errorCount: 5,
            },
          ],
        },
        {
          workerId: workerId4,
          facilityId: facilityId2,
          teamId: teamId1,
          productivityRate: 1.0,
          qualityScore: 100,
          proficiencyLevel: 'EXPERT',
          recentWorkResults: [
            {
              workInstructionId: workInstructionId1,
              completionRate: 100,
              errorCount: 0,
            },
            {
              workInstructionId: workInstructionId2,
              completionRate: 98,
              errorCount: 0,
            },
            {
              workInstructionId: workInstructionId3,
              completionRate: 100,
              errorCount: 0,
            },
          ],
        },
      ],
      targetFacilityIds: [facilityId1, facilityId2],
      targetTeamIds: [teamId1, teamId2],
      workInstructionIds: [workInstructionId1, workInstructionId2, workInstructionId3],
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy: userId,
    };

    // Act: Execute generateAllocationPlans
    const output: GenerateAllocationPlansOutput = await generateAllocationPlans(input);

    // Assert: Verify output structure
    expect(output).toBeDefined();
    expect(output.allocationPlans).toBeInstanceOf(Array);
    expect(output.allocationPlans.length).toBeGreaterThan(0);
    expect(output.recommendedRanking).toBeInstanceOf(Array);
    expect(output.generationSummary).toBeDefined();
    expect(output.readyForDelivery).toBe(true);

    // Verify all allocation plans have feasibility scores above threshold
    output.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(input.minimumFeasibilityThreshold);
      expect(plan.planId).toBeDefined();
      expect(plan.facilityId).toBeDefined();
      expect(plan.teamId).toBeDefined();
      expect(plan.workInstructionId).toBeDefined();
      expect(plan.allocatedWorkers).toBeInstanceOf(Array);
      expect(plan.estimatedCompletionDate).toBeDefined();
      expect(plan.estimatedWorkHours).toBeGreaterThan(0);
      expect(plan.riskFactors).toBeInstanceOf(Array);
    });

    // Verify skill matching: ADVANCED/EXPERT workers matched to their past high-performance tasks
    const expertPlan = output.allocationPlans.find((plan) =>
      plan.allocatedWorkers.some((w) => w.workerId === workerId4)
    );
    if (expertPlan) {
      const expertWorker = expertPlan.allocatedWorkers.find((w) => w.workerId === workerId4);
      expect(expertWorker).toBeDefined();
      expect(expertWorker!.difficultyLevel).toBe('HARD');
      expect(expertWorker!.estimatedProductivity).toBeGreaterThanOrEqual(0.9);
      // Verify the work instruction matches expert's past achievements
      const expertPastWorks = input.productivityData.find((p) => p.workerId === workerId4)!
        .recentWorkResults;
      const workInstructionMatched = expertPastWorks.some(
        (w) => w.workInstructionId === expertPlan.workInstructionId
      );
      expect(workInstructionMatched).toBe(true);
    }

    // Verify ADVANCED worker placement
    const advancedPlan = output.allocationPlans.find((plan) =>
      plan.allocatedWorkers.some((w) => w.workerId === workerId1)
    );
    if (advancedPlan) {
      const advancedWorker = advancedPlan.allocatedWorkers.find((w) => w.workerId === workerId1);
      expect(advancedWorker).toBeDefined();
      expect(advancedWorker!.difficultyLevel).toBe('HARD');
      // Match to past work results
      const advancedPastWorks = input.productivityData.find((p) => p.workerId === workerId1)!
        .recentWorkResults;
      const matchedWork = advancedPastWorks.find(
        (w) => w.workInstructionId === advancedPlan.workInstructionId && w.completionRate >= 80
      );
      expect(matchedWork).toBeDefined();
    }

    // Verify BEGINNER worker is placed on EASY tasks
    const beginnerPlan = output.allocationPlans.find((plan) =>
      plan.allocatedWorkers.some((w) => w.workerId === workerId3)
    );
    if (beginnerPlan) {
      const beginnerWorker = beginnerPlan.allocatedWorkers.find((w) => w.workerId === workerId3);
      if (beginnerWorker) {
        expect(beginnerWorker.difficultyLevel).toBe('EASY');
        expect(beginnerWorker.proficiencyAdjustment).toBe(0.5);
      }
    }

    // Verify recommended ranking
    expect(output.recommendedRanking.length).toBeGreaterThan(0);
    output.recommendedRanking.forEach((ranking) => {
      expect(ranking.planId).toBeDefined();
      expect(ranking.rank).toBeGreaterThanOrEqual(1);
      expect(ranking.rank).toBeLessThanOrEqual(output.allocationPlans.length);
      expect(ranking.feasibilityScore).toBeGreaterThanOrEqual(input.minimumFeasibilityThreshold);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(ranking.riskLevel);
      expect(ranking.recommendationReason).toBeDefined();
      expect(ranking.recommendationReason.length).toBeGreaterThan(0);
    });

    // Verify ranking is sorted by feasibility score (highest first)
    for (let i = 0; i < output.recommendedRanking.length - 1; i++) {
      expect(output.recommendedRanking[i].feasibilityScore).toBeGreaterThanOrEqual(
        output.recommendedRanking[i + 1].feasibilityScore
      );
    }

    // Verify generation summary
    expect(output.generationSummary.totalPlansGenerated).toBeGreaterThan(0);
    expect(output.generationSummary.plansAboveThreshold).toBeGreaterThan(0);
    expect(output.generationSummary.plansAboveThreshold).toBeLessThanOrEqual(
      output.generationSummary.totalPlansGenerated
    );
    expect(output.generationSummary.generationTimestamp).toBeDefined();
    expect(output.generationSummary.generationStrategy).toBe(input.generationStrategy);
    expect(output.generationSummary.analysisDetails).toBeDefined();
    expect(output.generationSummary.analysisDetails.delayRiskFactorsIdentified).toBeInstanceOf(
      Array
    );
    expect(output.generationSummary.analysisDetails.delayRiskFactorsIdentified.length).toBeGreaterThan(
      0
    );
    expect(output.generationSummary.analysisDetails.productivityBottlenecks).toBeInstanceOf(Array);
    expect(output.generationSummary.analysisDetails.recommendedInterventions).toBeInstanceOf(Array);
    expect(output.generationSummary.analysisDetails.recommendedInterventions.length).toBeGreaterThan(
      0
    );

    // Verify readyForDelivery indicates all plans are executable
    if (output.readyForDelivery) {
      expect(output.allocationPlans.length).toBeGreaterThan(0);
      expect(output.recommendedRanking.some((r) => r.rank === 1)).toBe(true);
    }

    // Deep validation: verify skill matching at allocation level
    output.allocationPlans.forEach((plan) => {
      plan.allocatedWorkers.forEach((allocatedWorker) => {
        // Find worker in input productivity data
        const workerProductivity = input.productivityData.find(
          (p) => p.workerId === allocatedWorker.workerId
        );
        expect(workerProductivity).toBeDefined();

        // Check if worker has past work matching current allocation
        const hasPastMatchingWork = workerProductivity!.recentWorkResults.some(
          (w) => w.workInstructionId === plan.workInstructionId && w.completionRate >= 80
        );

        // If no direct match, verify proficiency level justifies the assignment
        if (!hasPastMatchingWork) {
          if (
            workerProductivity!.proficiencyLevel === 'ADVANCED' ||
            workerProductivity!.proficiencyLevel === 'EXPERT'
          ) {
            // High proficiency should allow new work types
            expect(allocatedWorker.difficultyLevel).not.toBe('HARD');
          }
        }

        // Verify difficulty adjustment matches proficiency level
        const expectedDifficultyMap: Record<
          'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT',
          'EASY' | 'NORMAL' | 'HARD'
        > = {
          BEGINNER: 'EASY',
          INTERMEDIATE: 'NORMAL',
          ADVANCED: 'HARD',
          EXPERT: 'HARD',
        };

        const baseDifficulty = expectedDifficultyMap[workerProductivity!.proficiencyLevel];
        // The allocated difficulty should be consistent with proficiency
        if (workerProductivity!.proficiencyLevel === 'BEGINNER') {
          expect(allocatedWorker.difficultyLevel).toBe('EASY');
        }

        // Verify proficiency adjustment factor
        const proficiencyFactorMap = {
          BEGINNER: 0.5,
          INTERMEDIATE: 0.8,
          ADVANCED: 1.0,
          EXPERT: 1.2,
        };
        expect(allocatedWorker.proficiencyAdjustment).toBe(
          proficiencyFactorMap[workerProductivity!.proficiencyLevel as keyof typeof proficiencyFactorMap]
        );
      });
    });

    // Verify top-ranked plan has highest quality matching
    if (output.recommendedRanking.length > 0) {
      const topRankedPlanId = output.recommendedRanking.find((r) => r.rank === 1)?.planId;
      const topRankedPlan = output.allocationPlans.find((p) => p.planId === topRankedPlanId);
      expect(topRankedPlan).toBeDefined();

      // Top plan should have high skill match
      topRankedPlan!.allocatedWorkers.forEach((worker) => {
        const workerProductivity = input.productivityData.find(
          (p) => p.workerId === worker.workerId
        );
        // Verify quality score for top recommendation
        expect(workerProductivity!.qualityScore).toBeGreaterThanOrEqual(70);
      });
    }
  });
});