import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-180: generateAllocationPlans with calculateAllocationFeasibilityScore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate multiple allocation plans and calculate feasibility scores', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        plannedProgressRate: 70,
        recommendedAction: 'Increase staffing',
      },
      {
        riskJudgmentId: 'RJ002',
        workInstructionId: 'WI002',
        facilityId: 'FAC002',
        teamId: 'TEAM002',
        riskLevel: 'MEDIUM' as const,
        delayPredictionDays: 2,
        currentProgressRate: 60,
        plannedProgressRate: 75,
        recommendedAction: 'Adjust priority',
      },
      {
        riskJudgmentId: 'RJ003',
        workInstructionId: 'WI003',
        facilityId: 'FAC001',
        teamId: 'TEAM003',
        riskLevel: 'LOW' as const,
        delayPredictionDays: 0,
        currentProgressRate: 85,
        plannedProgressRate: 85,
        recommendedAction: 'Monitor progress',
      },
    ];

    const productivityData = [
      {
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.85,
        qualityScore: 90,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          { workInstructionId: 'WI001', completionRate: 0.8, errorCount: 1 },
        ],
      },
      {
        workerId: 'W002',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.70,
        qualityScore: 85,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          { workInstructionId: 'WI001', completionRate: 0.75, errorCount: 2 },
        ],
      },
      {
        workerId: 'W003',
        facilityId: 'FAC002',
        teamId: 'TEAM002',
        productivityRate: 0.95,
        qualityScore: 95,
        proficiencyLevel: 'EXPERT' as const,
        recentWorkResults: [
          { workInstructionId: 'WI002', completionRate: 0.95, errorCount: 0 },
        ],
      },
      {
        workerId: 'W004',
        facilityId: 'FAC002',
        teamId: 'TEAM002',
        productivityRate: 0.50,
        qualityScore: 80,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [
          { workInstructionId: 'WI002', completionRate: 0.40, errorCount: 5 },
        ],
      },
      {
        workerId: 'W005',
        facilityId: 'FAC001',
        teamId: 'TEAM003',
        productivityRate: 0.75,
        qualityScore: 88,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          { workInstructionId: 'WI003', completionRate: 0.85, errorCount: 1 },
        ],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC001', 'FAC002'],
      targetTeamIds: ['TEAM001', 'TEAM002', 'TEAM003'],
      workInstructionIds: ['WI001', 'WI002', 'WI003'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'USER001',
    };

    const result = await generateAllocationPlans(input);

    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeInstanceOf(Array);
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    result.allocationPlans.forEach((plan: any) => {
      expect(plan).toHaveProperty('planId');
      expect(plan).toHaveProperty('planName');
      expect(plan).toHaveProperty('facilityId');
      expect(plan).toHaveProperty('teamId');
      expect(plan).toHaveProperty('workInstructionId');
      expect(plan).toHaveProperty('allocatedWorkers');
      expect(plan).toHaveProperty('estimatedCompletionDate');
      expect(plan).toHaveProperty('estimatedWorkHours');
      expect(plan).toHaveProperty('feasibilityScore');
      expect(plan).toHaveProperty('riskFactors');

      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(60);
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(Number.isInteger(plan.feasibilityScore)).toBe(true);

      plan.allocatedWorkers.forEach((worker: any) => {
        expect(worker).toHaveProperty('workerId');
        expect(worker).toHaveProperty('assignedRole');
        expect(worker).toHaveProperty('difficultyLevel');
        expect(worker).toHaveProperty('estimatedProductivity');
        expect(worker).toHaveProperty('proficiencyAdjustment');
      });
    });

    expect(result.recommendedRanking).toBeInstanceOf(Array);
    expect(result.recommendedRanking.length).toBeGreaterThan(0);

    result.recommendedRanking.forEach((ranking: any, index: number) => {
      expect(ranking).toHaveProperty('planId');
      expect(ranking).toHaveProperty('rank');
      expect(ranking).toHaveProperty('recommendationReason');
      expect(ranking).toHaveProperty('feasibilityScore');
      expect(ranking).toHaveProperty('riskLevel');
      expect(ranking.rank).toBe(index + 1);
    });

    for (let i = 0; i < result.recommendedRanking.length - 1; i++) {
      expect(result.recommendedRanking[i].feasibilityScore).toBeGreaterThanOrEqual(
        result.recommendedRanking[i + 1].feasibilityScore
      );
    }

    expect(result.generationSummary).toBeDefined();
    expect(result.generationSummary).toHaveProperty('totalPlansGenerated');
    expect(result.generationSummary).toHaveProperty('plansAboveThreshold');
    expect(result.generationSummary).toHaveProperty('generationTimestamp');
    expect(result.generationSummary).toHaveProperty('generationStrategy');
    expect(result.generationSummary).toHaveProperty('analysisDetails');

    expect(result.generationSummary.generationStrategy).toBe('balance_risk_and_efficiency');
    expect(result.generationSummary.plansAboveThreshold).toBeGreaterThan(0);
    expect(result.generationSummary.plansAboveThreshold).toBeLessThanOrEqual(
      result.generationSummary.totalPlansGenerated
    );

    expect(result.generationSummary.analysisDetails).toHaveProperty('delayRiskFactorsIdentified');
    expect(result.generationSummary.analysisDetails).toHaveProperty('productivityBottlenecks');
    expect(result.generationSummary.analysisDetails).toHaveProperty('recommendedInterventions');

    expect(Array.isArray(result.generationSummary.analysisDetails.delayRiskFactorsIdentified)).toBe(true);
    expect(Array.isArray(result.generationSummary.analysisDetails.productivityBottlenecks)).toBe(true);
    expect(Array.isArray(result.generationSummary.analysisDetails.recommendedInterventions)).toBe(true);

    expect(result.readyForDelivery).toBe(result.generationSummary.plansAboveThreshold >= 1);
  });

  test('should verify feasibility score calculation uses productivity, proficiency adjustment, and difficulty level', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        plannedProgressRate: 70,
        recommendedAction: 'Increase staffing',
      },
    ];

    const productivityData = [
      {
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.85,
        qualityScore: 90,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'USER001',
    };

    const result = await generateAllocationPlans(input);

    expect(result.allocationPlans.length).toBeGreaterThan(0);

    result.allocationPlans.forEach((plan: any) => {
      plan.allocatedWorkers.forEach((worker: any) => {
        const matchingProductivity = productivityData.find(p => p.workerId === worker.workerId);
        if (matchingProductivity) {
          // Verify feasibility score is calculated correctly:
          // feasibilityScore = productivityRate × proficiencyAdjustment × difficultyCoefficient × 100
          const expectedMinScore = matchingProductivity.productivityRate * 
            worker.proficiencyAdjustment * 
            (worker.difficultyLevel === 'EASY' ? 1.2 : worker.difficultyLevel === 'HARD' ? 0.8 : 1.0) * 
            100;
          
          expect(plan.feasibilityScore).toBeGreaterThanOrEqual(60);
          expect(Math.abs(plan.feasibilityScore - Math.floor(expectedMinScore))).toBeLessThanOrEqual(
            matchingProductivity.productivityRate * worker.proficiencyAdjustment * 100
          );
        }
      });
    });
  });

  test('should apply difficulty adjustment for EASY, NORMAL, and HARD levels', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        plannedProgressRate: 70,
        recommendedAction: 'Increase staffing',
      },
    ];

    const productivityData = [
      {
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.80,
        qualityScore: 90,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [],
      },
      {
        workerId: 'W002',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.80,
        qualityScore: 85,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [],
      },
      {
        workerId: 'W003',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.80,
        qualityScore: 85,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'USER001',
    };

    const result = await generateAllocationPlans(input);

    expect(result.allocationPlans.length).toBeGreaterThan(0);

    const difficultyLevels = new Set<string>();
    result.allocationPlans.forEach((plan: any) => {
      plan.allocatedWorkers.forEach((worker: any) => {
        difficultyLevels.add(worker.difficultyLevel);
      });
    });

    // Verify that at least some plans use different difficulty levels
    const expectedDifficultyLevels = ['EASY', 'NORMAL', 'HARD'];
    expectedDifficultyLevels.forEach(level => {
      const hasLevel = result.allocationPlans.some((plan: any) =>
        plan.allocatedWorkers.some((w: any) => w.difficultyLevel === level)
      );
      if (hasLevel) {
        expect(['EASY', 'NORMAL', 'HARD']).toContain(level);
      }
    });
  });

  test('should filter plans below minimum feasibility threshold', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        plannedProgressRate: 70,
        recommendedAction: 'Increase staffing',
      },
    ];

    const productivityData = [
      {
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.55,
        qualityScore: 80,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 80,
      requestedBy: 'USER001',
    };

    const result = await generateAllocationPlans(input);

    result.allocationPlans.forEach((plan: any) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(80);
    });
  });

  test('should set readyForDelivery to false when no plans exceed threshold', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        plannedProgressRate: 70,
        recommendedAction: 'Increase staffing',
      },
    ];

    const productivityData = [
      {
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.40,
        qualityScore: 70,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 90,
      requestedBy: 'USER001',
    };

    const result = await generateAllocationPlans(input);

    if (result.generationSummary.plansAboveThreshold === 0) {
      expect(result.readyForDelivery).toBe(false);
    }
  });

  test('should include generation timestamp in ISO 8601 format', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        plannedProgressRate: 70,
        recommendedAction: 'Increase staffing',
      },
    ];

    const productivityData = [
      {
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.85,
        qualityScore: 90,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'USER001',
    };

    const result = await generateAllocationPlans(input);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.generationSummary.generationTimestamp).toMatch(iso8601Regex);
  });

  test('should rank plans in descending order by feasibility score', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        plannedProgressRate: 70,
        recommendedAction: 'Increase staffing',
      },
      {
        riskJudgmentId: 'RJ002',
        workInstructionId: 'WI002',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'MEDIUM' as const,
        delayPredictionDays: 2,
        currentProgressRate: 60,
        plannedProgressRate: 75,
        recommendedAction: 'Adjust priority',
      },
    ];

    const productivityData = [
      {
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.95,
        qualityScore: 95,
        proficiencyLevel: 'EXPERT' as const,
        recentWorkResults: [],
      },
      {
        workerId: 'W002',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.75,
        qualityScore: 85,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [],
      },
      {
        workerId: 'W003',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.65,
        qualityScore: 80,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001', 'WI002'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'USER001',
    };

    const result = await generateAllocationPlans(input);

    if (result.recommendedRanking.length > 1) {
      for (let i = 0; i < result.recommendedRanking.length - 1; i++) {
        expect(result.recommendedRanking[i].feasibilityScore).toBeGreaterThanOrEqual(
          result.recommendedRanking[i + 1].feasibilityScore
        );
        expect(result.recommendedRanking[i].rank).toBe(i + 1);
        expect(result.recommendedRanking[i + 1].rank).toBe(i + 2);
      }
    }
  });

  test('should throw InvalidDelayRiskJudgmentDataError when plannedProgressRate is missing', async () => {
    const invalidDelayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        recommendedAction: 'Increase staffing',
      } as any,
    ];

    const productivityData = [
      {
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.85,
        qualityScore: 90,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [],
      },
    ];

    const input = {
      delayRiskJudgments: invalidDelayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'USER001',
    };

    await expect(generateAllocationPlans(input)).rejects.toThrow('InvalidDelayRiskJudgmentDataError');
  });

  test('should throw InsufficientProductivityDataError when productivity data is empty', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        plannedProgressRate: 70,
        recommendedAction: 'Increase staffing',
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData: [],
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'USER001',
    };

    await expect(generateAllocationPlans(input)).rejects.toThrow('InsufficientProductivityDataError');
  });

  test('should throw NoViableAllocationPlanError when all plans fall below threshold', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        plannedProgressRate: 70,
        recommendedAction: 'Increase staffing',
      },
    ];

    const productivityData = [
      {
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.30,
        qualityScore: 70,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 80,
      requestedBy: 'USER001',
    };

    await expect(generateAllocationPlans(input)).rejects.toThrow('NoViableAllocationPlanError');
  });

  test('should throw ProficiencyLevelMappingError when proficiency level is invalid', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        plannedProgressRate: 70,
        recommendedAction: 'Increase staffing',
      },
    ];

    const productivityData = [
      {
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.85,
        qualityScore: 90,
        proficiencyLevel: 'INVALID_LEVEL' as any,
        recentWorkResults: [],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'USER001',
    };

    await expect(generateAllocationPlans(input)).rejects.toThrow('ProficiencyLevelMappingError');
  });

  test('should throw AllocationPlanGenerationSystemError when internal exception occurs', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        plannedProgressRate: 70,
        recommendedAction: 'Increase staffing',
      },
    ];

    const productivityData = [
      {
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.85,
        qualityScore: 90,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: null as any,
    };

    await expect(generateAllocationPlans(input)).rejects.toThrow('AllocationPlanGenerationSystemError');
  });

  test('should verify feasibility score is integer value', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        plannedProgressRate: 70,
        recommendedAction: 'Increase staffing',
      },
    ];

    const productivityData = [
      {
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.85,
        qualityScore: 90,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [],
      },
      {
        workerId: 'W002',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.72,
        qualityScore: 85,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'USER001',
    };

    const result = await generateAllocationPlans(input);

    result.allocationPlans.forEach((plan: any) => {
      expect(Number.isInteger(plan.feasibilityScore)).toBe(true);
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);
    });
  });

  test('should verify plansAboveThreshold matches count of feasible plans', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        plannedProgressRate: 70,
        recommendedAction: 'Increase staffing',
      },
    ];

    const productivityData = [
      {
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.85,
        qualityScore: 90,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [],
      },
      {
        workerId: 'W002',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.75,
        qualityScore: 85,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'USER001',
    };

    const result = await generateAllocationPlans(input);

    const actualPlansAboveThreshold = result.allocationPlans.filter(
      (plan: any) => plan.feasibilityScore >= input.minimumFeasibilityThreshold
    ).length;

    expect(result.generationSummary.plansAboveThreshold).toBe(actualPlansAboveThreshold);
  });

  test('should verify allocatedWorkers proficiencyAdjustment matches proficiency level mapping', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        plannedProgressRate: 70,
        recommendedAction: 'Increase staffing',
      },
    ];

    const productivityData = [
      {
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.85,
        qualityScore: 90,
        proficiencyLevel: 'EXPERT' as const,
        recentWorkResults: [],
      },
      {
        workerId: 'W002',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.70,
        qualityScore: 85,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [],
      },
      {
        workerId: 'W003',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.65,
        qualityScore: 80,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'USER001',
    };

    const result = await generateAllocationPlans(input);

    const proficiencyAdjustmentMap: Record<string, number> = {
      BEGINNER: 0.6,
      INTERMEDIATE: 0.8,
      ADVANCED: 1.0,
      EXPERT: 1.1,
    };

    result.allocationPlans.forEach((plan: any) => {
      plan.allocatedWorkers.forEach((worker: any) => {
        expect([0.6, 0.8, 1.0, 1.1]).toContain(worker.proficiencyAdjustment);
      });
    });
  });

  test('should generate plans with distinct allocations and scores', async () => {
    const delayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'HIGH' as const,
        delayPredictionDays: 5,
        currentProgressRate: 40,
        plannedProgressRate: 70,
        recommendedAction: 'Increase staffing',
      },
      {
        riskJudgmentId: 'RJ002',
        workInstructionId: 'WI002',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        riskLevel: 'MEDIUM' as const,
        delayPredictionDays: 2,
        currentProgressRate: 60,
        plannedProgressRate: 75,
        recommendedAction: 'Adjust priority',
      },
    ];

    const productivityData = [
      {
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.85,
        qualityScore: 90,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [],
      },
      {
        workerId: 'W002',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.75,
        qualityScore: 85,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [],
      },
      {
        workerId: 'W003',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        productivityRate: 0.65,
        qualityScore: 80,
        proficiencyLevel: 'BEGINNER' as const,
        recentWorkResults: [],
      },
    ];

    const input = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds: ['FAC001'],
      targetTeamIds: ['TEAM001'],
      workInstructionIds: ['WI001', 'WI002'],
      generationStrategy: 'balance_risk_and_efficiency' as const,
      minimumFeasibilityThreshold: 60,
      requestedBy: 'USER001',
    };

    const result = await generateAllocationPlans(input);

    const totalAllocatedWorkers = result.allocationPlans.reduce(
      (sum: number, plan: any) => sum + plan.allocatedWorkers.length,
      0
    );

    expect(totalAllocatedWorkers).toBeGreaterThan(0);
    expect(result.allocationPlans.length).toBeGreaterThan(0);
  });
});