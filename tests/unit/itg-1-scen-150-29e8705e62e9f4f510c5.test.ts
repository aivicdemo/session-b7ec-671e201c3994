import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-150: generateAllocationPlans with multiple facilities and teams', () => {
  it('should generate independent allocation plans for each facility-team combination', async () => {
    // Arrange: Prepare test data with multiple facilities and teams
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RJ-001',
        workInstructionId: 'WI-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-A',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 2,
        currentProgressRate: 30,
        plannedProgressRate: 50,
        recommendedAction: 'Add staff to TEAM-A at FAC-001',
      },
      {
        riskJudgmentId: 'RJ-002',
        workInstructionId: 'WI-001',
        facilityId: 'FAC-002',
        teamId: 'TEAM-B',
        riskLevel: 'MEDIUM' as const,
        delayPredictionDays: 1,
        currentProgressRate: 60,
        plannedProgressRate: 75,
        recommendedAction: 'Adjust priorities at FAC-002 TEAM-B',
      },
    ];

    const productivityData = [
      {
        workerId: 'W-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-A',
        productivityRate: 0.85,
        qualityScore: 92,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'WI-001',
            completionRate: 0.75,
            errorCount: 2,
          },
        ],
      },
      {
        workerId: 'W-002',
        facilityId: 'FAC-001',
        teamId: 'TEAM-A',
        productivityRate: 0.78,
        qualityScore: 88,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          {
            workInstructionId: 'WI-001',
            completionRate: 0.65,
            errorCount: 5,
          },
        ],
      },
      {
        workerId: 'W-003',
        facilityId: 'FAC-001',
        teamId: 'TEAM-B',
        productivityRate: 0.82,
        qualityScore: 90,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'WI-002',
            completionRate: 0.88,
            errorCount: 1,
          },
        ],
      },
      {
        workerId: 'W-004',
        facilityId: 'FAC-002',
        teamId: 'TEAM-A',
        productivityRate: 0.80,
        qualityScore: 89,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'WI-001',
            completionRate: 0.70,
            errorCount: 3,
          },
        ],
      },
      {
        workerId: 'W-005',
        facilityId: 'FAC-002',
        teamId: 'TEAM-B',
        productivityRate: 0.75,
        qualityScore: 85,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          {
            workInstructionId: 'WI-001',
            completionRate: 0.60,
            errorCount: 6,
          },
        ],
      },
      {
        workerId: 'W-006',
        facilityId: 'FAC-002',
        teamId: 'TEAM-B',
        productivityRate: 0.88,
        qualityScore: 95,
        proficiencyLevel: 'EXPERT' as const,
        recentWorkResults: [
          {
            workInstructionId: 'WI-002',
            completionRate: 0.95,
            errorCount: 0,
          },
        ],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC-001', 'FAC-002'],
      targetTeamIds: ['TEAM-A', 'TEAM-B'],
      workInstructionIds: ['WI-001', 'WI-002'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-001',
    };

    // Act: Call generateAllocationPlans
    const result = await generateAllocationPlans(input);

    // Assert: Verify independent allocation plans per facility-team combination
    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    // Verify plans are separated by facilityId
    const fac001Plans = result.allocationPlans.filter(
      (plan) => plan.facilityId === 'FAC-001'
    );
    const fac002Plans = result.allocationPlans.filter(
      (plan) => plan.facilityId === 'FAC-002'
    );
    expect(fac001Plans.length).toBeGreaterThan(0);
    expect(fac002Plans.length).toBeGreaterThan(0);

    // Verify plans are separated by teamId within each facility
    const fac001TeamAPlan = fac001Plans.filter(
      (plan) => plan.teamId === 'TEAM-A'
    );
    const fac001TeamBPlan = fac001Plans.filter(
      (plan) => plan.teamId === 'TEAM-B'
    );
    const fac002TeamAPlan = fac002Plans.filter(
      (plan) => plan.teamId === 'TEAM-A'
    );
    const fac002TeamBPlan = fac002Plans.filter(
      (plan) => plan.teamId === 'TEAM-B'
    );

    expect(fac001TeamAPlan.length).toBeGreaterThan(0);
    expect(fac001TeamBPlan.length).toBeGreaterThan(0);
    expect(fac002TeamAPlan.length).toBeGreaterThan(0);
    expect(fac002TeamBPlan.length).toBeGreaterThan(0);

    // Verify each facility-team combination has complete plan information
    result.allocationPlans.forEach((plan) => {
      expect(plan.planId).toBeDefined();
      expect(plan.planName).toBeDefined();
      expect(plan.facilityId).toBeDefined();
      expect(plan.teamId).toBeDefined();
      expect(plan.workInstructionId).toBeDefined();
      expect(plan.allocatedWorkers).toBeDefined();
      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);
      expect(plan.allocatedWorkers.length).toBeGreaterThan(0);
      expect(plan.estimatedCompletionDate).toBeDefined();
      expect(plan.estimatedWorkHours).toBeGreaterThan(0);
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(plan.riskFactors).toBeDefined();
      expect(Array.isArray(plan.riskFactors)).toBe(true);
    });

    // Verify allocated workers belong only to their respective facility-team
    fac001TeamAPlan.forEach((plan) => {
      plan.allocatedWorkers.forEach((worker) => {
        const workerData = productivityData.find(
          (p) => p.workerId === worker.workerId
        );
        expect(workerData?.facilityId).toBe('FAC-001');
        expect(workerData?.teamId).toBe('TEAM-A');
      });
    });

    fac002TeamBPlan.forEach((plan) => {
      plan.allocatedWorkers.forEach((worker) => {
        const workerData = productivityData.find(
          (p) => p.workerId === worker.workerId
        );
        expect(workerData?.facilityId).toBe('FAC-002');
        expect(workerData?.teamId).toBe('TEAM-B');
      });
    });

    // Verify recommendedRanking is independently ranked per facility-team combination
    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
    expect(result.recommendedRanking.length).toBeGreaterThan(0);

    result.recommendedRanking.forEach((ranking) => {
      expect(ranking.planId).toBeDefined();
      expect(ranking.rank).toBeGreaterThan(0);
      expect(ranking.recommendationReason).toBeDefined();
      expect(ranking.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(ranking.feasibilityScore).toBeLessThanOrEqual(100);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(ranking.riskLevel);

      // Verify that the ranked plan exists in allocationPlans
      const correspondingPlan = result.allocationPlans.find(
        (plan) => plan.planId === ranking.planId
      );
      expect(correspondingPlan).toBeDefined();
    });

    // Verify generationSummary
    expect(result.generationSummary).toBeDefined();
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThanOrEqual(
      4
    );
    expect(result.generationSummary.plansAboveThreshold).toBeGreaterThanOrEqual(
      0
    );
    expect(result.generationSummary.generationTimestamp).toBeDefined();
    expect(result.generationSummary.generationStrategy).toBe(
      'balance_risk_and_efficiency'
    );
    expect(result.generationSummary.analysisDetails).toBeDefined();
    expect(
      result.generationSummary.analysisDetails.delayRiskFactorsIdentified
    ).toBeDefined();
    expect(
      Array.isArray(
        result.generationSummary.analysisDetails.delayRiskFactorsIdentified
      )
    ).toBe(true);
    expect(
      result.generationSummary.analysisDetails.productivityBottlenecks
    ).toBeDefined();
    expect(
      Array.isArray(
        result.generationSummary.analysisDetails.productivityBottlenecks
      )
    ).toBe(true);
    expect(
      result.generationSummary.analysisDetails.recommendedInterventions
    ).toBeDefined();
    expect(
      Array.isArray(
        result.generationSummary.analysisDetails.recommendedInterventions
      )
    ).toBe(true);

    // Verify readyForDelivery
    expect(result.readyForDelivery).toBe(true);

    // Verify no mixing of different facility-team combinations
    const plansByFacilityTeam = new Map<string, number>();
    result.allocationPlans.forEach((plan) => {
      const key = `${plan.facilityId}|${plan.teamId}`;
      plansByFacilityTeam.set(key, (plansByFacilityTeam.get(key) || 0) + 1);
    });
    expect(plansByFacilityTeam.size).toBe(4); // FAC-001/TEAM-A, FAC-001/TEAM-B, FAC-002/TEAM-A, FAC-002/TEAM-B
  });
});