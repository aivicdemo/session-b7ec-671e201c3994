import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-181: generateAllocationPlans with proficiency-based difficulty adjustment', () => {
  it('should generate allocation plans with proficiency-adjusted difficulty levels and feasibility scores', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 2,
        currentProgressRate: 45,
        plannedProgressRate: 60,
        recommendedAction: 'Increase workforce'
      }
    ];

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.7,
        qualityScore: 75,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.5,
            errorCount: 3
          }
        ]
      },
      {
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.85,
        qualityScore: 88,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.75,
            errorCount: 1
          }
        ]
      },
      {
        workerId: 'worker-003',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.95,
        qualityScore: 95,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.95,
            errorCount: 0
          }
        ]
      },
      {
        workerId: 'worker-004',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 1.0,
        qualityScore: 98,
        proficiencyLevel: 'EXPERT' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 1.0,
            errorCount: 0
          }
        ]
      }
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['facility-001'],
      targetTeamIds: ['team-001'],
      workInstructionIds: ['work-001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-001'
    };

    const output = await generateAllocationPlans(input);

    // Verify allocationPlans is not empty
    expect(output.allocationPlans).toBeDefined();
    expect(Array.isArray(output.allocationPlans)).toBe(true);
    expect(output.allocationPlans.length).toBeGreaterThan(0);

    // Verify proficiency-adjusted difficulty levels for each allocated worker
    output.allocationPlans.forEach((plan) => {
      expect(plan.allocatedWorkers).toBeDefined();
      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);

      plan.allocatedWorkers.forEach((allocation) => {
        const worker = productivityData.find((w) => w.workerId === allocation.workerId);
        expect(worker).toBeDefined();

        // Verify difficulty level is adjusted based on proficiency
        if (worker?.proficiencyLevel === 'BEGINNER') {
          expect(allocation.difficultyLevel).toBe('EASY');
        } else if (worker?.proficiencyLevel === 'INTERMEDIATE') {
          expect(allocation.difficultyLevel).toBe('NORMAL');
        } else if (worker?.proficiencyLevel === 'ADVANCED') {
          expect(allocation.difficultyLevel).toBe('HARD');
        } else if (worker?.proficiencyLevel === 'EXPERT') {
          expect(allocation.difficultyLevel).toBe('HARD');
        }

        // Verify proficiency adjustment factor is set according to proficiency level
        if (worker?.proficiencyLevel === 'BEGINNER') {
          expect(allocation.proficiencyAdjustment).toBeGreaterThanOrEqual(0.5);
          expect(allocation.proficiencyAdjustment).toBeLessThanOrEqual(0.8);
        } else if (worker?.proficiencyLevel === 'INTERMEDIATE') {
          expect(allocation.proficiencyAdjustment).toBeGreaterThanOrEqual(0.8);
          expect(allocation.proficiencyAdjustment).toBeLessThan(1.0);
        } else if (worker?.proficiencyLevel === 'ADVANCED') {
          expect(allocation.proficiencyAdjustment).toBeGreaterThanOrEqual(0.9);
          expect(allocation.proficiencyAdjustment).toBeLessThanOrEqual(1.0);
        } else if (worker?.proficiencyLevel === 'EXPERT') {
          expect(allocation.proficiencyAdjustment).toBe(1.2);
        }

        // Verify estimated productivity is calculated
        expect(allocation.estimatedProductivity).toBeGreaterThan(0);
        expect(allocation.estimatedProductivity).toBeLessThanOrEqual(1.0);
      });
    });

    // Verify recommendedRanking is sorted by feasibilityScore in descending order
    expect(output.recommendedRanking).toBeDefined();
    expect(Array.isArray(output.recommendedRanking)).toBe(true);
    expect(output.recommendedRanking.length).toBeGreaterThan(0);

    for (let i = 1; i < output.recommendedRanking.length; i++) {
      expect(output.recommendedRanking[i - 1].feasibilityScore).toBeGreaterThanOrEqual(
        output.recommendedRanking[i].feasibilityScore
      );
    }

    // Verify ranking order by rank field
    for (let i = 0; i < output.recommendedRanking.length; i++) {
      expect(output.recommendedRanking[i].rank).toBe(i + 1);
    }

    // Verify generationSummary
    expect(output.generationSummary).toBeDefined();
    expect(output.generationSummary.totalPlansGenerated).toBeGreaterThan(0);
    expect(output.generationSummary.plansAboveThreshold).toBeGreaterThanOrEqual(0);
    expect(output.generationSummary.generationTimestamp).toBeDefined();
    expect(new Date(output.generationSummary.generationTimestamp).getTime()).toBeGreaterThan(0);
    expect(output.generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');

    // Verify analysis details are populated
    expect(output.generationSummary.analysisDetails).toBeDefined();
    expect(Array.isArray(output.generationSummary.analysisDetails.delayRiskFactorsIdentified)).toBe(
      true
    );
    expect(output.generationSummary.analysisDetails.delayRiskFactorsIdentified.length).toBeGreaterThan(
      0
    );
    expect(Array.isArray(output.generationSummary.analysisDetails.productivityBottlenecks)).toBe(
      true
    );
    expect(Array.isArray(output.generationSummary.analysisDetails.recommendedInterventions)).toBe(
      true
    );
    expect(output.generationSummary.analysisDetails.recommendedInterventions.length).toBeGreaterThan(
      0
    );

    // Verify readyForDelivery flag
    expect(output.readyForDelivery).toBe(true);
  });
});