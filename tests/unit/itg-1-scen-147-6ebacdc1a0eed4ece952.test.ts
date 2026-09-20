import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';
import { GenerateAllocationPlansInput, GenerateAllocationPlansOutput } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-147: 生成戦略がmaximize_feasibilityのとき、実現可能性が最大の配置案が優先される', () => {
  it('should prioritize allocation plan with maximum feasibility score when strategy is maximize_feasibility', async () => {
    // Arrange
    const testUserId = 'test-user-123';
    const facilityId = 'facility-001';
    const teamId = 'team-001';
    const workInstructionId = 'work-001';

    const input: GenerateAllocationPlansInput = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId,
          facilityId,
          teamId,
          riskLevel: 'HIGH',
          delayPredictionDays: 2,
          currentProgressRate: 40,
          plannedProgressRate: 60,
          recommendedAction: 'Increase staffing'
        },
        {
          riskJudgmentId: 'risk-002',
          workInstructionId: 'work-002',
          facilityId,
          teamId,
          riskLevel: 'MEDIUM',
          delayPredictionDays: 1,
          currentProgressRate: 50,
          plannedProgressRate: 65,
          recommendedAction: 'Monitor closely'
        },
        {
          riskJudgmentId: 'risk-003',
          workInstructionId: 'work-003',
          facilityId,
          teamId,
          riskLevel: 'MEDIUM',
          delayPredictionDays: 1,
          currentProgressRate: 55,
          plannedProgressRate: 70,
          recommendedAction: 'Optimize workflow'
        }
      ],
      productivityData: [
        {
          workerId: 'worker-001',
          facilityId,
          teamId,
          productivityRate: 0.95,
          qualityScore: 95,
          proficiencyLevel: 'EXPERT',
          recentWorkResults: [
            { workInstructionId, completionRate: 98, errorCount: 0 }
          ]
        },
        {
          workerId: 'worker-002',
          facilityId,
          teamId,
          productivityRate: 0.85,
          qualityScore: 88,
          proficiencyLevel: 'ADVANCED',
          recentWorkResults: [
            { workInstructionId, completionRate: 90, errorCount: 1 }
          ]
        },
        {
          workerId: 'worker-003',
          facilityId,
          teamId,
          productivityRate: 0.72,
          qualityScore: 78,
          proficiencyLevel: 'INTERMEDIATE',
          recentWorkResults: [
            { workInstructionId, completionRate: 75, errorCount: 2 }
          ]
        },
        {
          workerId: 'worker-004',
          facilityId,
          teamId,
          productivityRate: 0.65,
          qualityScore: 70,
          proficiencyLevel: 'BEGINNER',
          recentWorkResults: [
            { workInstructionId, completionRate: 60, errorCount: 3 }
          ]
        },
        {
          workerId: 'worker-005',
          facilityId,
          teamId,
          productivityRate: 0.90,
          qualityScore: 92,
          proficiencyLevel: 'ADVANCED',
          recentWorkResults: [
            { workInstructionId, completionRate: 92, errorCount: 1 }
          ]
        }
      ],
      targetFacilityIds: [facilityId],
      targetTeamIds: [teamId],
      workInstructionIds: [workInstructionId],
      generationStrategy: 'maximize_feasibility',
      minimumFeasibilityThreshold: 70,
      requestedBy: testUserId
    };

    // Act
    const result = await generateAllocationPlans(input);

    // Assert - Basic structure
    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
    expect(result.generationSummary).toBeDefined();
    expect(result.readyForDelivery).toBeDefined();

    // Assert - Generated plans count
    expect(result.allocationPlans.length).toBeGreaterThanOrEqual(3);

    // Assert - All plans meet minimum threshold
    result.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(70);
    });

    // Assert - Recommended ranking is sorted by feasibility score descending
    const sortedByFeasibility = [...result.recommendedRanking].sort(
      (a, b) => b.feasibilityScore - a.feasibilityScore
    );
    expect(result.recommendedRanking).toEqual(sortedByFeasibility);

    // Assert - Rank 1 has highest feasibility score
    const topRankedRecommendation = result.recommendedRanking[0];
    expect(topRankedRecommendation).toBeDefined();
    expect(topRankedRecommendation.rank).toBe(1);
    expect(topRankedRecommendation.feasibilityScore).toBeGreaterThanOrEqual(70);

    // Assert - Top recommendation contains maximize_feasibility strategy reason
    expect(topRankedRecommendation.recommendationReason).toContain(
      'maximize_feasibility'
    );
    expect(topRankedRecommendation.recommendationReason).toMatch(/実現可能性/);

    // Assert - Top recommendation has valid risk level
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(
      topRankedRecommendation.riskLevel
    );

    // Assert - Find corresponding allocation plan for rank 1
    const topPlan = result.allocationPlans.find(
      (plan) => plan.planId === topRankedRecommendation.planId
    );
    expect(topPlan).toBeDefined();
    expect(topPlan!.feasibilityScore).toBe(
      topRankedRecommendation.feasibilityScore
    );

    // Assert - Difficulty adjustment applied to allocated workers
    expect(topPlan!.allocatedWorkers).toBeDefined();
    expect(Array.isArray(topPlan!.allocatedWorkers)).toBe(true);
    topPlan!.allocatedWorkers.forEach((worker) => {
      expect(['EASY', 'NORMAL', 'HARD']).toContain(worker.difficultyLevel);
      expect(typeof worker.proficiencyAdjustment).toBe('number');
      expect(worker.proficiencyAdjustment).toBeGreaterThan(0);
    });

    // Assert - Generation summary content
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThanOrEqual(
      3
    );
    expect(result.generationSummary.plansAboveThreshold).toBeLessThanOrEqual(
      result.generationSummary.totalPlansGenerated
    );
    expect(result.generationSummary.plansAboveThreshold).toBeGreaterThan(0);
    expect(result.generationSummary.generationStrategy).toBe(
      'maximize_feasibility'
    );
    expect(result.generationSummary.generationTimestamp).toBeDefined();

    // Assert - Analysis details are present
    expect(result.generationSummary.analysisDetails).toBeDefined();
    expect(
      Array.isArray(result.generationSummary.analysisDetails.delayRiskFactorsIdentified)
    ).toBe(true);
    expect(
      Array.isArray(result.generationSummary.analysisDetails.productivityBottlenecks)
    ).toBe(true);
    expect(
      Array.isArray(result.generationSummary.analysisDetails.recommendedInterventions)
    ).toBe(true);

    // Assert - Ready for delivery
    expect(result.readyForDelivery).toBe(true);

    // Assert - Top ranked plan has highest feasibility
    const allFeasibilityScores = result.allocationPlans.map(
      (p) => p.feasibilityScore
    );
    const maxFeasibility = Math.max(...allFeasibilityScores);
    expect(topRankedRecommendation.feasibilityScore).toBe(maxFeasibility);
  });
});