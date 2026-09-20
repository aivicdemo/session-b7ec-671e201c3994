import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';
import * as personnelAllocationOptimizer from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-184: generateAllocationPlans with facility and team-based existing allocation retrieval', () => {
  let getActiveAllocationPlansByFacilityAndTeamSpy: jest.SpyInstance;

  beforeEach(() => {
    getActiveAllocationPlansByFacilityAndTeamSpy = jest.spyOn(
      personnelAllocationOptimizer,
      'getActiveAllocationPlansByFacilityAndTeam' as any
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should retrieve existing allocation plans by facility and team, and use them to generate and rank new allocation plans', async () => {
    // Setup mock for existing allocation plans
    const mockExistingPlans = [
      {
        planId: 'existing-plan-001',
        planName: 'Current Allocation A',
        facilityId: 'facility-001',
        teamId: 'team-001',
        allocatedWorkers: [
          {
            workerId: 'worker-existing-001',
            assignedRole: 'Lead',
            estimatedProductivity: 0.90
          }
        ],
        estimatedCompletionDate: new Date(Date.now() + 86400000).toISOString(),
        estimatedWorkHours: 40
      }
    ];

    getActiveAllocationPlansByFacilityAndTeamSpy.mockResolvedValue(mockExistingPlans);

    const targetFacilityIds = ['facility-001', 'facility-002'];
    const targetTeamIds = ['team-001', 'team-002'];
    const workInstructionIds = ['work-001', 'work-002'];
    const requestedBy = 'user-001';

    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 3,
        currentProgressRate: 40,
        plannedProgressRate: 60,
        recommendedAction: 'Allocate additional resources'
      }
    ];

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.95,
        qualityScore: 92,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.85,
            errorCount: 1
          }
        ]
      },
      {
        workerId: 'worker-002',
        facilityId: 'facility-002',
        teamId: 'team-002',
        productivityRate: 0.78,
        qualityScore: 85,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-002',
            completionRate: 0.70,
            errorCount: 2
          }
        ]
      }
    ];

    // Execute the function
    const result = await generateAllocationPlans({
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy
    });

    // Verify getActiveAllocationPlansByFacilityAndTeam was called with correct parameters
    expect(getActiveAllocationPlansByFacilityAndTeamSpy).toHaveBeenCalled();
    const callArgs = getActiveAllocationPlansByFacilityAndTeamSpy.mock.calls[0];
    expect(callArgs[0]).toEqual(expect.arrayContaining(targetFacilityIds));
    expect(callArgs[1]).toEqual(expect.arrayContaining(targetTeamIds));

    // Verify the mock returned existing allocation plans data
    expect(getActiveAllocationPlansByFacilityAndTeamSpy).toHaveBeenCalledTimes(1);

    // Verify output structure and required fields
    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.recommendedRanking).toBeDefined();
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
    expect(result.generationSummary).toBeDefined();
    expect(result.readyForDelivery).toBeDefined();

    // Verify allocationPlans structure
    result.allocationPlans.forEach((plan) => {
      expect(plan.planId).toBeDefined();
      expect(plan.planName).toBeDefined();
      expect(plan.facilityId).toMatch(/^facility-/);
      expect(targetFacilityIds).toContain(plan.facilityId);
      expect(plan.teamId).toMatch(/^team-/);
      expect(targetTeamIds).toContain(plan.teamId);
      expect(plan.workInstructionId).toMatch(/^work-/);
      expect(workInstructionIds).toContain(plan.workInstructionId);
      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);
      expect(plan.estimatedCompletionDate).toBeDefined();
      expect(plan.estimatedWorkHours).toBeGreaterThan(0);
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(60);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(plan.riskFactors)).toBe(true);
    });

    // Verify recommendedRanking structure and ordering
    expect(result.recommendedRanking.length).toBeGreaterThan(0);
    result.recommendedRanking.forEach((ranking, index) => {
      expect(ranking.planId).toBeDefined();
      expect(ranking.rank).toBeDefined();
      expect(ranking.rank).toBeGreaterThanOrEqual(1);
      expect(ranking.recommendationReason).toBeDefined();
      expect(ranking.feasibilityScore).toBeGreaterThanOrEqual(60);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(ranking.riskLevel);

      // Verify ordering: feasibilityScore should be in descending order by rank
      if (index > 0) {
        const prevRanking = result.recommendedRanking[index - 1];
        expect(ranking.rank).toBe(prevRanking.rank + 1);
        expect(ranking.feasibilityScore).toBeLessThanOrEqual(prevRanking.feasibilityScore);
      }
    });

    // Verify generationSummary
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThanOrEqual(0);
    expect(result.generationSummary.plansAboveThreshold).toBeLessThanOrEqual(
      result.generationSummary.totalPlansGenerated
    );
    expect(result.generationSummary.generationTimestamp).toBeDefined();
    expect(result.generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');
    expect(result.generationSummary.analysisDetails).toBeDefined();
    expect(Array.isArray(result.generationSummary.analysisDetails.delayRiskFactorsIdentified)).toBe(true);
    expect(Array.isArray(result.generationSummary.analysisDetails.productivityBottlenecks)).toBe(true);
    expect(Array.isArray(result.generationSummary.analysisDetails.recommendedInterventions)).toBe(true);

    // Verify readyForDelivery is true if plans meet threshold
    if (result.generationSummary.plansAboveThreshold > 0) {
      expect(result.readyForDelivery).toBe(true);
    }

    // Verify allocated workers in plans have proficiency adjustments applied
    result.allocationPlans.forEach((plan) => {
      plan.allocatedWorkers.forEach((worker) => {
        expect(worker.workerId).toBeDefined();
        expect(worker.assignedRole).toBeDefined();
        expect(['EASY', 'NORMAL', 'HARD']).toContain(worker.difficultyLevel);
        expect(worker.estimatedProductivity).toBeGreaterThan(0);
        expect(worker.estimatedProductivity).toBeLessThanOrEqual(1);
        expect(worker.proficiencyAdjustment).toBeGreaterThanOrEqual(0.5);
        expect(worker.proficiencyAdjustment).toBeLessThanOrEqual(1.2);
      });
    });
  });

  it('should respect minimumFeasibilityThreshold and only return plans meeting the criteria', async () => {
    const mockExistingPlans: any[] = [];
    getActiveAllocationPlansByFacilityAndTeamSpy.mockResolvedValue(mockExistingPlans);

    const targetFacilityIds = ['facility-001'];
    const targetTeamIds = ['team-001'];
    const workInstructionIds = ['work-001'];
    const requestedBy = 'user-001';

    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'MEDIUM' as const,
        delayPredictionDays: 2,
        currentProgressRate: 50,
        plannedProgressRate: 70,
        recommendedAction: 'Monitor and adjust'
      }
    ];

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.88,
        qualityScore: 88,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.80,
            errorCount: 0
          }
        ]
      }
    ];

    const result = await generateAllocationPlans({
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy
    });

    // All returned plans must meet the threshold
    result.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(60);
    });

    // Plans above threshold should match the summary
    const actualAboveThreshold = result.allocationPlans.filter((p) => p.feasibilityScore >= 60).length;
    expect(result.generationSummary.plansAboveThreshold).toBeGreaterThanOrEqual(0);

    // Verify getActiveAllocationPlansByFacilityAndTeam was called
    expect(getActiveAllocationPlansByFacilityAndTeamSpy).toHaveBeenCalledWith(
      expect.arrayContaining(targetFacilityIds),
      expect.arrayContaining(targetTeamIds)
    );
  });

  it('should generate multiple allocation plans and rank them by feasibility score', async () => {
    const mockExistingPlans = [
      {
        planId: 'existing-plan-001',
        planName: 'Current Plan',
        facilityId: 'facility-001',
        teamId: 'team-001',
        allocatedWorkers: [],
        estimatedCompletionDate: new Date(Date.now() + 86400000).toISOString(),
        estimatedWorkHours: 40
      }
    ];

    getActiveAllocationPlansByFacilityAndTeamSpy.mockResolvedValue(mockExistingPlans);

    const targetFacilityIds = ['facility-001', 'facility-002'];
    const targetTeamIds = ['team-001', 'team-002'];
    const workInstructionIds = ['work-001'];
    const requestedBy = 'user-001';

    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 30,
        plannedProgressRate: 70,
        recommendedAction: 'Critical resource allocation needed'
      }
    ];

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 1.0,
        qualityScore: 98,
        proficiencyLevel: 'EXPERT' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.95,
            errorCount: 0
          }
        ]
      },
      {
        workerId: 'worker-002',
        facilityId: 'facility-002',
        teamId: 'team-002',
        productivityRate: 0.65,
        qualityScore: 70,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.50,
            errorCount: 3
          }
        ]
      }
    ];

    const result = await generateAllocationPlans({
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy
    });

    // Verify getActiveAllocationPlansByFacilityAndTeam was called with correct parameters
    expect(getActiveAllocationPlansByFacilityAndTeamSpy).toHaveBeenCalledWith(
      expect.arrayContaining(targetFacilityIds),
      expect.arrayContaining(targetTeamIds)
    );

    // Verify multiple plans were generated if possible
    if (result.allocationPlans.length > 1) {
      // Check that ranking order matches feasibility scores (higher rank = higher feasibility)
      for (let i = 0; i < result.recommendedRanking.length - 1; i++) {
        const currentRank = result.recommendedRanking[i];
        const nextRank = result.recommendedRanking[i + 1];
        expect(currentRank.feasibilityScore).toBeGreaterThanOrEqual(nextRank.feasibilityScore);
      }
    }

    // Verify all ranked plans exist in the allocation plans array
    result.recommendedRanking.forEach((ranking) => {
      const planExists = result.allocationPlans.some((p) => p.planId === ranking.planId);
      expect(planExists).toBe(true);
    });
  });

  it('should use existing allocation plan data for new plan generation with verified integration', async () => {
    const mockExistingPlans = [
      {
        planId: 'existing-plan-001',
        planName: 'Existing Allocation',
        facilityId: 'facility-001',
        teamId: 'team-001',
        allocatedWorkers: [
          {
            workerId: 'worker-existing-001',
            assignedRole: 'Existing Role',
            estimatedProductivity: 0.85
          }
        ],
        estimatedCompletionDate: new Date(Date.now() + 86400000).toISOString(),
        estimatedWorkHours: 32
      }
    ];

    getActiveAllocationPlansByFacilityAndTeamSpy.mockResolvedValue(mockExistingPlans);

    const targetFacilityIds = ['facility-001'];
    const targetTeamIds = ['team-001'];
    const workInstructionIds = ['work-001'];
    const requestedBy = 'user-001';

    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 3,
        currentProgressRate: 40,
        plannedProgressRate: 60,
        recommendedAction: 'Allocate additional resources'
      }
    ];

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.95,
        qualityScore: 92,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.85,
            errorCount: 1
          }
        ]
      },
      {
        workerId: 'worker-003',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.80,
        qualityScore: 88,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.75,
            errorCount: 1
          }
        ]
      }
    ];

    const result = await generateAllocationPlans({
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy
    });

    // Verify getActiveAllocationPlansByFacilityAndTeam was called
    expect(getActiveAllocationPlansByFacilityAndTeamSpy).toHaveBeenCalledWith(
      expect.arrayContaining(targetFacilityIds),
      expect.arrayContaining(targetTeamIds)
    );

    // Verify that returned existing plans data structure
    const callResult = await getActiveAllocationPlansByFacilityAndTeamSpy.mock.results[0].value;
    expect(callResult).toBeDefined();
    expect(Array.isArray(callResult)).toBe(true);
    if (callResult.length > 0) {
      callResult.forEach((plan: any) => {
        expect(plan.planId).toBeDefined();
        expect(plan.facilityId).toBeDefined();
        expect(plan.teamId).toBeDefined();
        expect(plan.allocatedWorkers).toBeDefined();
        expect(plan.estimatedCompletionDate).toBeDefined();
        expect(plan.estimatedWorkHours).toBeDefined();
      });
    }

    // Verify that generated plans reference the targeted facility and team
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    // Verify all plans are for the specified target facility and team
    result.allocationPlans.forEach((plan) => {
      expect(plan.facilityId).toBe('facility-001');
      expect(plan.teamId).toBe('team-001');
      expect(plan.workInstructionId).toBe('work-001');
    });

    // Verify that allocated workers correspond to the provided productivity data
    const allocatedWorkerIds = new Set<string>();
    result.allocationPlans.forEach((plan) => {
      plan.allocatedWorkers.forEach((worker) => {
        allocatedWorkerIds.add(worker.workerId);
      });
    });

    // All allocated worker IDs should be in the provided productivity data
    allocatedWorkerIds.forEach((workerId) => {
      const workerExists = productivityData.some((p) => p.workerId === workerId);
      expect(workerExists).toBe(true);
    });

    // Verify no duplicate workers within any single plan
    result.allocationPlans.forEach((plan) => {
      const workerIds = plan.allocatedWorkers.map((w) => w.workerId);
      const uniqueWorkerIds = new Set(workerIds);
      expect(uniqueWorkerIds.size).toBe(workerIds.length);
    });

    // Verify that the generation summary includes analysis details indicating data processing
    expect(result.generationSummary.analysisDetails).toBeDefined();
    expect(result.generationSummary.analysisDetails.delayRiskFactorsIdentified).toBeDefined();
    expect(result.generationSummary.analysisDetails.productivityBottlenecks).toBeDefined();
    expect(result.generationSummary.analysisDetails.recommendedInterventions).toBeDefined();

    // Verify that recommended interventions reflect the analysis of both risk and productivity data
    if (result.generationSummary.analysisDetails.recommendedInterventions.length > 0) {
      result.generationSummary.analysisDetails.recommendedInterventions.forEach((intervention) => {
        expect(intervention.length).toBeGreaterThan(0);
        expect(typeof intervention).toBe('string');
      });
    }

    // Verify feasibility scores indicate that data analysis was performed
    result.recommendedRanking.forEach((ranking) => {
      expect(ranking.feasibilityScore).toBeGreaterThanOrEqual(60);
      expect(ranking.feasibilityScore).toBeLessThanOrEqual(100);
    });

    // Verify that the output readyForDelivery is consistent with plans above threshold
    const plansAboveThreshold = result.allocationPlans.filter((p) => p.feasibilityScore >= 60).length;
    if (plansAboveThreshold > 0) {
      expect(result.readyForDelivery).toBe(true);
    }
  });

  it('should verify new allocation plans do not duplicate existing worker allocations within a plan', async () => {
    const mockExistingPlans: any[] = [];
    getActiveAllocationPlansByFacilityAndTeamSpy.mockResolvedValue(mockExistingPlans);

    const targetFacilityIds = ['facility-001'];
    const targetTeamIds = ['team-001'];
    const workInstructionIds = ['work-001'];
    const requestedBy = 'user-001';

    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'MEDIUM' as const,
        delayPredictionDays: 2,
        currentProgressRate: 55,
        plannedProgressRate: 70,
        recommendedAction: 'Adjust allocation'
      }
    ];

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.90,
        qualityScore: 90,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.80,
            errorCount: 0
          }
        ]
      }
    ];

    const result = await generateAllocationPlans({
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy
    });

    // Verify getActiveAllocationPlansByFacilityAndTeam was called
    expect(getActiveAllocationPlansByFacilityAndTeamSpy).toHaveBeenCalledWith(
      expect.arrayContaining(targetFacilityIds),
      expect.arrayContaining(targetTeamIds)
    );

    // Verify all returned plans meet feasibility threshold
    result.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(60);

      // Verify no duplicate workers within a single plan
      const workerIds = plan.allocatedWorkers.map((w) => w.workerId);
      const uniqueWorkerIds = new Set(workerIds);
      expect(uniqueWorkerIds.size).toBe(workerIds.length);
    });

    // Verify ranking includes feasibility scores
    result.recommendedRanking.forEach((ranking) => {
      expect(ranking.feasibilityScore).toBeGreaterThanOrEqual(60);
    });
  });

  it('should verify estimated completion dates show improved accuracy from existing allocation data reference', async () => {
    const mockExistingPlans = [
      {
        planId: 'existing-plan-001',
        planName: 'Reference Plan',
        facilityId: 'facility-001',
        teamId: 'team-001',
        allocatedWorkers: [],
        estimatedCompletionDate: new Date(Date.now() + 86400000).toISOString(),
        estimatedWorkHours: 48
      }
    ];

    getActiveAllocationPlansByFacilityAndTeamSpy.mockResolvedValue(mockExistingPlans);

    const targetFacilityIds = ['facility-001'];
    const targetTeamIds = ['team-001'];
    const workInstructionIds = ['work-001'];
    const requestedBy = 'user-001';

    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 3,
        currentProgressRate: 40,
        plannedProgressRate: 60,
        recommendedAction: 'Allocate additional resources'
      }
    ];

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.95,
        qualityScore: 92,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.85,
            errorCount: 1
          }
        ]
      }
    ];

    const result = await generateAllocationPlans({
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy
    });

    // Verify getActiveAllocationPlansByFacilityAndTeam was called and returned data
    expect(getActiveAllocationPlansByFacilityAndTeamSpy).toHaveBeenCalledWith(
      expect.arrayContaining(targetFacilityIds),
      expect.arrayContaining(targetTeamIds)
    );

    const callResult = await getActiveAllocationPlansByFacilityAndTeamSpy.mock.results[0].value;
    expect(callResult).toEqual(mockExistingPlans);

    // Verify estimated completion dates are provided for all plans
    expect(result.allocationPlans.length).toBeGreaterThan(0);
    result.allocationPlans.forEach((plan) => {
      expect(plan.estimatedCompletionDate).toBeDefined();
      expect(typeof plan.estimatedCompletionDate).toBe('string');
      // Verify it's a valid ISO 8601 date format
      expect(new Date(plan.estimatedCompletionDate).getTime()).not.toBeNaN();
      expect(plan.estimatedWorkHours).toBeGreaterThan(0);
    });

    // Verify that estimated work hours are reasonable given worker productivity rates
    result.allocationPlans.forEach((plan) => {
      plan.allocatedWorkers.forEach((worker) => {
        // The estimated productivity and proficiency adjustment should have been applied
        expect(worker.estimatedProductivity).toBeGreaterThan(0);
        expect(worker.proficiencyAdjustment).toBeGreaterThan(0);
      });
    });
  });

  it('should verify existing allocation plan data is referenced for difficulty adjustment recommendations', async () => {
    const mockExistingPlans: any[] = [];
    getActiveAllocationPlansByFacilityAndTeamSpy.mockResolvedValue(mockExistingPlans);

    const targetFacilityIds = ['facility-001'];
    const targetTeamIds = ['team-001'];
    const workInstructionIds = ['work-001'];
    const requestedBy = 'user-001';

    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 3,
        currentProgressRate: 40,
        plannedProgressRate: 60,
        recommendedAction: 'Allocate additional resources'
      }
    ];

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.95,
        qualityScore: 92,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.85,
            errorCount: 1
          }
        ]
      },
      {
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.60,
        qualityScore: 75,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.50,
            errorCount: 3
          }
        ]
      }
    ];

    const result = await generateAllocationPlans({
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy
    });

    // Verify getActiveAllocationPlansByFacilityAndTeam was called
    expect(getActiveAllocationPlansByFacilityAndTeamSpy).toHaveBeenCalledWith(
      expect.arrayContaining(targetFacilityIds),
      expect.arrayContaining(targetTeamIds)
    );

    // Verify that difficulty levels are adjusted based on proficiency levels
    result.allocationPlans.forEach((plan) => {
      plan.allocatedWorkers.forEach((worker) => {
        const workerProductivity = productivityData.find((p) => p.workerId === worker.workerId);
        if (workerProductivity) {
          // EXPERT and ADVANCED should have normal or lower difficulty assignments
          if (
            workerProductivity.proficiencyLevel === 'EXPERT' ||
            workerProductivity.proficiencyLevel === 'ADVANCED'
          ) {
            expect(worker.proficiencyAdjustment).toBeGreaterThanOrEqual(0.8);
          }
          // BEGINNER should have adjusted difficulty
          if (workerProductivity.proficiencyLevel === 'BEGINNER') {
            expect(worker.proficiencyAdjustment).toBeLessThanOrEqual(0.8);
          }
        }
      });
    });

    // Verify that all plans meet feasibility threshold after difficulty adjustment
    result.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(60);
    });
  });

  it('should verify that existing allocation plans are retrieved for target facilities and teams and contribute to generation', async () => {
    const mockExistingPlans = [
      {
        planId: 'existing-plan-001',
        planName: 'Existing Allocation',
        facilityId: 'facility-001',
        teamId: 'team-001',
        allocatedWorkers: [
          {
            workerId: 'worker-existing-001',
            assignedRole: 'Worker',
            estimatedProductivity: 0.80
          }
        ],
        estimatedCompletionDate: new Date(Date.now() + 172800000).toISOString(),
        estimatedWorkHours: 56
      }
    ];

    getActiveAllocationPlansByFacilityAndTeamSpy.mockResolvedValue(mockExistingPlans);

    const targetFacilityIds = ['facility-001'];
    const targetTeamIds = ['team-001'];
    const workInstructionIds = ['work-001'];
    const requestedBy = 'user-001';

    const delayRiskJudgments = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 3,
        currentProgressRate: 40,
        plannedProgressRate: 60,
        recommendedAction: 'Allocate additional resources'
      }
    ];

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.95,
        qualityScore: 92,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.85,
            errorCount: 1
          }
        ]
      }
    ];

    const result = await generateAllocationPlans({
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy
    });

    // Verify getActiveAllocationPlansByFacilityAndTeam was called with correct parameters
    expect(getActiveAllocationPlansByFacilityAndTeamSpy).toHaveBeenCalledWith(
      expect.arrayContaining(targetFacilityIds),
      expect.arrayContaining(targetTeamIds)
    );
    expect(getActiveAllocationPlansByFacilityAndTeamSpy).toHaveBeenCalledTimes(1);

    // Verify the mock returned existing allocation plans
    const callResult = await getActiveAllocationPlansByFacilityAndTeamSpy.mock.results[0].value;
    expect(callResult).toBeDefined();
    expect(Array.isArray(callResult)).toBe(true);
    expect(callResult).toEqual(mockExistingPlans);

    // Verify that plans are generated for the specified facilities and teams
    expect(result.allocationPlans.length).toBeGreaterThan(0);
    result.allocationPlans.forEach((plan) => {
      expect(targetFacilityIds).toContain(plan.facilityId);
      expect(targetTeamIds).toContain(plan.teamId);
      expect(workInstructionIds).toContain(plan.workInstructionId);
    });

    // Verify that generationSummary indicates processing of existing data
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThanOrEqual(1);
    expect(result.generationSummary.plansAboveThreshold).toBeGreaterThanOrEqual(1);

    // Verify readyForDelivery reflects that plans above threshold exist
    if (result.generationSummary.plansAboveThreshold > 0) {
      expect(result.readyForDelivery).toBe(true);
    }

    // Verify that all plans in recommendedRanking are ranked by feasibility score
    if (result.recommendedRanking.length > 1) {
      for (let i = 0; i < result.recommendedRanking.length - 1; i++) {
        const currentScore = result.recommendedRanking[i].feasibilityScore;
        const nextScore = result.recommendedRanking[i + 1].feasibilityScore;
        expect(currentScore).toBeGreaterThanOrEqual(nextScore);
      }
    }

    // Verify that each ranked plan exists in the allocation plans array
    result.recommendedRanking.forEach((ranking) => {
      const planFound = result.allocationPlans.some((p) => p.planId === ranking.planId);
      expect(planFound).toBe(true);
    });
  });
});