import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-146: Feasibility Score Default Value When minimumFeasibilityThreshold is Undefined', () => {
  it('should apply default feasibility threshold of 60 when minimumFeasibilityThreshold is not specified', async () => {
    // Prepare input data
    const input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'RISK001',
          workInstructionId: 'WI001',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          riskLevel: 'HIGH' as const,
          delayPredictionDays: 5,
          currentProgressRate: 45,
          plannedProgressRate: 70,
          recommendedAction: 'Add personnel to FAC001'
        }
      ],
      productivityData: [
        {
          workerId: 'WORKER001',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          productivityRate: 0.8,
          qualityScore: 0.85,
          proficiencyLevel: 'BEGINNER' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI001',
              completionRate: 0.45,
              errorCount: 2
            }
          ]
        },
        {
          workerId: 'WORKER002',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          productivityRate: 0.88,
          qualityScore: 0.90,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI001',
              completionRate: 0.50,
              errorCount: 1
            }
          ]
        },
        {
          workerId: 'WORKER003',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          productivityRate: 0.95,
          qualityScore: 0.95,
          proficiencyLevel: 'ADVANCED' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI001',
              completionRate: 0.60,
              errorCount: 0
            }
          ]
        }
      ],
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: undefined,
      requestedBy: 'USER001'
    };

    // Execute function
    const result = await generateAllocationPlans(input);

    // Verify allocationPlans: all should have feasibilityScore >= 60
    expect(result.allocationPlans).toBeDefined();
    expect(result.allocationPlans.length).toBeGreaterThan(0);
    
    // Filter plans with different expected scores
    const plan62 = result.allocationPlans.find(plan => Math.abs(plan.feasibilityScore - 62) < 1);
    const plan68 = result.allocationPlans.find(plan => Math.abs(plan.feasibilityScore - 68) < 1);
    const plan55 = result.allocationPlans.find(plan => Math.abs(plan.feasibilityScore - 55) < 1);

    // Plans with score 62 and 68 should exist (above threshold)
    expect(plan62).toBeDefined();
    expect(plan68).toBeDefined();
    
    // Plan with score 55 should not exist in results (below default threshold)
    expect(plan55).toBeUndefined();

    // Verify all included plans meet minimum threshold of 60
    result.allocationPlans.forEach(plan => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(60);
      expect(plan.planId).toBeDefined();
      expect(plan.allocatedWorkers).toBeDefined();
      expect(plan.estimatedCompletionDate).toBeDefined();
      expect(plan.riskFactors).toBeDefined();
    });

    // Verify recommendedRanking
    expect(result.recommendedRanking).toBeDefined();
    expect(result.recommendedRanking.length).toBeGreaterThan(0);

    // Verify ranking is ordered by feasibilityScore descending
    for (let i = 0; i < result.recommendedRanking.length - 1; i++) {
      expect(result.recommendedRanking[i].feasibilityScore).toBeGreaterThanOrEqual(
        result.recommendedRanking[i + 1].feasibilityScore
      );
    }

    // Verify all ranked plans have score >= 60
    result.recommendedRanking.forEach(ranking => {
      expect(ranking.feasibilityScore).toBeGreaterThanOrEqual(60);
      expect(ranking.rank).toBeGreaterThanOrEqual(1);
      expect(ranking.recommendationReason).toBeDefined();
    });

    // Verify generationSummary
    expect(result.generationSummary).toBeDefined();
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThan(0);
    expect(result.generationSummary.plansAboveThreshold).toBe(2);
    expect(result.generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');
    expect(result.generationSummary.generationTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.generationSummary.analysisDetails).toBeDefined();
    expect(result.generationSummary.analysisDetails.delayRiskFactorsIdentified).toBeDefined();
    expect(result.generationSummary.analysisDetails.productivityBottlenecks).toBeDefined();
    expect(result.generationSummary.analysisDetails.recommendedInterventions).toBeDefined();

    // Verify readyForDelivery
    expect(result.readyForDelivery).toBe(true);

    // Verify timestamp is valid ISO 8601
    const timestamp = new Date(result.generationSummary.generationTimestamp);
    expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 60000); // within last 60 seconds
  });

  it('should include plans with feasibilityScore exactly at default threshold', async () => {
    const input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'RISK001',
          workInstructionId: 'WI001',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          riskLevel: 'HIGH' as const,
          delayPredictionDays: 5,
          currentProgressRate: 45,
          plannedProgressRate: 70,
          recommendedAction: 'Add personnel'
        }
      ],
      productivityData: [
        {
          workerId: 'WORKER001',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          productivityRate: 0.85,
          qualityScore: 0.88,
          proficiencyLevel: 'INTERMEDIATE' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI001',
              completionRate: 0.50,
              errorCount: 1
            }
          ]
        }
      ],
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: undefined,
      requestedBy: 'USER001'
    };

    const result = await generateAllocationPlans(input);

    // At least one plan should be included (threshold is inclusive >=)
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    result.allocationPlans.forEach(plan => {
      // Score must be >= 60 (the default threshold)
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(60);
    });

    // plansAboveThreshold should reflect count >= 60
    expect(result.generationSummary.plansAboveThreshold).toEqual(
      result.allocationPlans.length
    );
  });

  it('should verify proficiency adjustment is applied in generated plans', async () => {
    const input = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'RISK001',
          workInstructionId: 'WI001',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          riskLevel: 'MEDIUM' as const,
          delayPredictionDays: 3,
          currentProgressRate: 60,
          plannedProgressRate: 75,
          recommendedAction: 'Optimize allocation'
        }
      ],
      productivityData: [
        {
          workerId: 'BEGINNER_WORKER',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          productivityRate: 0.6,
          qualityScore: 0.80,
          proficiencyLevel: 'BEGINNER' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI001',
              completionRate: 0.40,
              errorCount: 3
            }
          ]
        },
        {
          workerId: 'EXPERT_WORKER',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          productivityRate: 1.0,
          qualityScore: 0.98,
          proficiencyLevel: 'EXPERT' as const,
          recentWorkResults: [
            {
              workInstructionId: 'WI001',
              completionRate: 0.80,
              errorCount: 0
            }
          ]
        }
      ],
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: undefined,
      requestedBy: 'USER001'
    };

    const result = await generateAllocationPlans(input);

    expect(result.allocationPlans).toBeDefined();
    result.allocationPlans.forEach(plan => {
      expect(plan.allocatedWorkers).toBeDefined();
      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);

      plan.allocatedWorkers.forEach(worker => {
        expect(worker.workerId).toBeDefined();
        expect(worker.proficiencyAdjustment).toBeDefined();
        // proficiencyAdjustment should be in range [0.5, 1.2]
        expect(worker.proficiencyAdjustment).toBeGreaterThanOrEqual(0.5);
        expect(worker.proficiencyAdjustment).toBeLessThanOrEqual(1.2);
        expect(worker.estimatedProductivity).toBeDefined();
        expect(worker.difficultyLevel).toMatch(/^(EASY|NORMAL|HARD)$/);
      });
    });

    // Verify that readyForDelivery reflects actual generation success
    expect(result.readyForDelivery).toBe(true);
  });
});