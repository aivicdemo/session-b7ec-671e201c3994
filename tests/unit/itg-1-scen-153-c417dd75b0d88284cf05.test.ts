import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';
import {
  GenerateAllocationPlansInput,
  GenerateAllocationPlansOutput,
  ApplyDifficultyAdjustmentByProficiencyInput,
  CalculateAllocationPlanFeasibilityScoreInput,
} from '../../src/logic/personnel-allocation-optimizer';

describe('SCEN-153: generateAllocationPlans - Multiple work instructions with allocation plans generation', () => {
  let validateReferentialIntegrityMock: jest.Mock;
  let calculateAllocationFeasibilityScoreMock: jest.Mock;
  let judgeProficiencyLevelMock: jest.Mock;
  let applyDifficultyAdjustmentByProficiencyMock: jest.Mock;
  let getWorkerWithProficiencyAndProductivityMock: jest.Mock;
  let getActiveAllocationPlansByFacilityAndTeamMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Import mocked functions after clearing
    const module = require('../../src/logic/personnel-allocation-optimizer');
    validateReferentialIntegrityMock = module.validateReferentialIntegrity;
    calculateAllocationFeasibilityScoreMock = module.calculateAllocationFeasibilityScore;
    judgeProficiencyLevelMock = module.judgeProficiencyLevel;
    applyDifficultyAdjustmentByProficiencyMock = module.applyDifficultyAdjustmentByProficiency;
    getWorkerWithProficiencyAndProductivityMock = module.getWorkerWithProficiencyAndProductivity;
    getActiveAllocationPlansByFacilityAndTeamMock = module.getActiveAllocationPlansByFacilityAndTeam;

    // Setup default mock implementations
    validateReferentialIntegrityMock.mockReturnValue({ valid: true });

    calculateAllocationFeasibilityScoreMock.mockImplementation(
      (input: CalculateAllocationPlanFeasibilityScoreInput) => {
        expect(input).toHaveProperty('planId');
        expect(input).toHaveProperty('allocatedWorkers');
        expect(input).toHaveProperty('workInstructionId');
        expect(input).toHaveProperty('estimatedWorkHours');
        expect(input).toHaveProperty('estimatedCompletionDate');
        expect(input).toHaveProperty('facilityId');
        expect(input).toHaveProperty('teamId');
        expect(input).toHaveProperty('requestedBy');
        expect(Array.isArray(input.allocatedWorkers)).toBe(true);

        const scores: { [key: string]: number } = {
          'PLAN-001': 92,
          'PLAN-002': 75,
          'PLAN-003': 65,
        };
        return scores[input.planId] || 70;
      }
    );

    judgeProficiencyLevelMock.mockImplementation((proficiencyLevel: string) => proficiencyLevel);

    applyDifficultyAdjustmentByProficiencyMock.mockImplementation(
      (input: ApplyDifficultyAdjustmentByProficiencyInput) => {
        expect(input).toHaveProperty('workerId');
        expect(input).toHaveProperty('proficiencyLevel');
        expect(input).toHaveProperty('baseDifficultyLevel');
        expect(input).toHaveProperty('jobType');
        expect(input).toHaveProperty('estimatedBaseProductivity');
        expect(input).toHaveProperty('requestedBy');
        expect(typeof input.estimatedBaseProductivity).toBe('number');

        const difficultyMap: { [key: string]: string } = {
          'W-001_ADVANCED': 'NORMAL',
          'W-002_INTERMEDIATE': 'NORMAL',
          'W-003_BEGINNER': 'EASY',
        };
        return difficultyMap[`${input.workerId}_${input.proficiencyLevel}`] || 'NORMAL';
      }
    );

    getWorkerWithProficiencyAndProductivityMock.mockImplementation((workerId: string) => {
      const workers: { [key: string]: any } = {
        'W-001': {
          workerId: 'W-001',
          proficiencyLevel: 'ADVANCED',
          productivityRate: 0.95,
          proficiencyAdjustment: 1.0,
        },
        'W-002': {
          workerId: 'W-002',
          proficiencyLevel: 'INTERMEDIATE',
          productivityRate: 0.8,
          proficiencyAdjustment: 0.8,
        },
        'W-003': {
          workerId: 'W-003',
          proficiencyLevel: 'BEGINNER',
          productivityRate: 0.7,
          proficiencyAdjustment: 0.5,
        },
      };
      return workers[workerId];
    });

    getActiveAllocationPlansByFacilityAndTeamMock.mockReturnValue([]);
  });

  it('should generate multiple allocation plans for multiple work instructions', async () => {
    // Arrange: Build input with multiple work instructions
    const workInstructionIds = ['WI-001', 'WI-002', 'WI-003'];
    const facilityIds = ['FAC-001', 'FAC-002'];
    const teamIds = ['TEAM-001', 'TEAM-002'];

    const input: GenerateAllocationPlansInput = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'RJ-001',
          workInstructionId: 'WI-001',
          facilityId: 'FAC-001',
          teamId: 'TEAM-001',
          riskLevel: 'HIGH',
          delayPredictionDays: 2,
          currentProgressRate: 50,
          plannedProgressRate: 75,
          recommendedAction: 'Add 2 workers',
        },
        {
          riskJudgmentId: 'RJ-002',
          workInstructionId: 'WI-002',
          facilityId: 'FAC-002',
          teamId: 'TEAM-002',
          riskLevel: 'MEDIUM',
          delayPredictionDays: 1,
          currentProgressRate: 60,
          plannedProgressRate: 80,
          recommendedAction: 'Add 1 worker',
        },
        {
          riskJudgmentId: 'RJ-003',
          workInstructionId: 'WI-003',
          facilityId: 'FAC-001',
          teamId: 'TEAM-002',
          riskLevel: 'LOW',
          delayPredictionDays: 0,
          currentProgressRate: 90,
          plannedProgressRate: 90,
          recommendedAction: 'Monitor',
        },
      ],
      productivityData: [
        {
          workerId: 'W-001',
          facilityId: 'FAC-001',
          teamId: 'TEAM-001',
          productivityRate: 0.95,
          qualityScore: 95,
          proficiencyLevel: 'ADVANCED',
          recentWorkResults: [
            {
              workInstructionId: 'WI-001',
              completionRate: 0.98,
              errorCount: 1,
            },
          ],
        },
        {
          workerId: 'W-002',
          facilityId: 'FAC-002',
          teamId: 'TEAM-002',
          productivityRate: 0.8,
          qualityScore: 85,
          proficiencyLevel: 'INTERMEDIATE',
          recentWorkResults: [
            {
              workInstructionId: 'WI-002',
              completionRate: 0.85,
              errorCount: 3,
            },
          ],
        },
        {
          workerId: 'W-003',
          facilityId: 'FAC-001',
          teamId: 'TEAM-002',
          productivityRate: 0.7,
          qualityScore: 75,
          proficiencyLevel: 'BEGINNER',
          recentWorkResults: [
            {
              workInstructionId: 'WI-003',
              completionRate: 0.72,
              errorCount: 5,
            },
          ],
        },
      ],
      targetFacilityIds: facilityIds,
      targetTeamIds: teamIds,
      workInstructionIds: workInstructionIds,
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy: 'USER-001',
    };

    // Act
    const result = await generateAllocationPlans(input);

    // Assert: Verify internal functions were called
    expect(validateReferentialIntegrityMock).toHaveBeenCalled();
    expect(calculateAllocationFeasibilityScoreMock).toHaveBeenCalled();
    expect(judgeProficiencyLevelMock).toHaveBeenCalled();
    expect(applyDifficultyAdjustmentByProficiencyMock).toHaveBeenCalled();
    expect(getWorkerWithProficiencyAndProductivityMock).toHaveBeenCalled();
    expect(getActiveAllocationPlansByFacilityAndTeamMock).toHaveBeenCalled();

    // Assert: Verify multiple allocation plans are generated
    expect(result.allocationPlans).toHaveLength(3);
    expect(result.allocationPlans.map((p) => p.workInstructionId)).toEqual(workInstructionIds);

    // Assert: Verify each plan has correct structure
    result.allocationPlans.forEach((plan) => {
      expect(plan).toHaveProperty('planId');
      expect(plan).toHaveProperty('planName');
      expect(plan).toHaveProperty('workInstructionId');
      expect(plan).toHaveProperty('facilityId');
      expect(plan).toHaveProperty('teamId');
      expect(plan).toHaveProperty('allocatedWorkers');
      expect(plan).toHaveProperty('feasibilityScore');
      expect(plan).toHaveProperty('estimatedCompletionDate');
      expect(plan).toHaveProperty('estimatedWorkHours');
      expect(plan).toHaveProperty('riskFactors');
    });

    // Assert: Verify each plan corresponds to one of the input work instructions
    result.allocationPlans.forEach((plan) => {
      expect(workInstructionIds).toContain(plan.workInstructionId);
    });

    // Assert: Verify allocated workers have correct structure and difficulty adjustments
    result.allocationPlans.forEach((plan) => {
      expect(plan.allocatedWorkers.length).toBeGreaterThan(0);

      plan.allocatedWorkers.forEach((worker) => {
        expect(worker).toHaveProperty('workerId');
        expect(worker).toHaveProperty('assignedRole');
        expect(worker).toHaveProperty('difficultyLevel');
        expect(['EASY', 'NORMAL', 'HARD']).toContain(worker.difficultyLevel);
        expect(worker).toHaveProperty('estimatedProductivity');
        expect(worker).toHaveProperty('proficiencyAdjustment');

        // Verify proficiencyAdjustment is within expected range (0.5 ~ 1.2)
        expect(typeof worker.proficiencyAdjustment).toBe('number');
        expect(worker.proficiencyAdjustment).toBeGreaterThanOrEqual(0.5);
        expect(worker.proficiencyAdjustment).toBeLessThanOrEqual(1.2);
      });

      // Verify applyDifficultyAdjustmentByProficiency was called for each allocated worker
      plan.allocatedWorkers.forEach((worker) => {
        expect(applyDifficultyAdjustmentByProficiencyMock).toHaveBeenCalledWith(
          expect.objectContaining({
            workerId: worker.workerId,
            proficiencyLevel: expect.stringMatching(/^(BEGINNER|INTERMEDIATE|ADVANCED|EXPERT)$/),
            baseDifficultyLevel: expect.stringMatching(/^(EASY|NORMAL|HARD)$/),
            jobType: expect.any(String),
            estimatedBaseProductivity: expect.any(Number),
            requestedBy: expect.any(String),
          })
        );
      });
    });

    // Assert: Verify feasibility scores are above threshold
    result.allocationPlans.forEach((plan) => {
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(input.minimumFeasibilityThreshold!);
    });

    // Assert: Verify calculateAllocationFeasibilityScore was called with correct structure
    expect(calculateAllocationFeasibilityScoreMock).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: expect.any(String),
        allocatedWorkers: expect.any(Array),
        workInstructionId: expect.any(String),
        estimatedWorkHours: expect.any(Number),
        estimatedCompletionDate: expect.any(String),
        facilityId: expect.any(String),
        teamId: expect.any(String),
        requestedBy: expect.any(String),
      })
    );

    // Assert: Verify recommended ranking
    expect(result.recommendedRanking).toHaveLength(3);
    expect(result.recommendedRanking.map((r) => r.rank)).toEqual([1, 2, 3]);

    // Verify feasibility scores are in descending order (rank 1 has highest score)
    for (let i = 0; i < result.recommendedRanking.length - 1; i++) {
      expect(result.recommendedRanking[i].feasibilityScore).toBeGreaterThanOrEqual(
        result.recommendedRanking[i + 1].feasibilityScore
      );
    }

    result.recommendedRanking.forEach((ranking) => {
      expect(ranking).toHaveProperty('planId');
      expect(ranking).toHaveProperty('rank');
      expect(ranking).toHaveProperty('recommendationReason');
      expect(ranking).toHaveProperty('feasibilityScore');
      expect(ranking).toHaveProperty('riskLevel');
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(ranking.riskLevel);
      expect(typeof ranking.recommendationReason).toBe('string');
      expect(ranking.recommendationReason.length).toBeGreaterThan(0);
    });

    // Assert: Verify generation summary
    expect(result.generationSummary.totalPlansGenerated).toBe(3);
    expect(result.generationSummary.plansAboveThreshold).toBe(
      result.allocationPlans.filter(
        (p) => p.feasibilityScore >= input.minimumFeasibilityThreshold!
      ).length
    );
    expect(result.generationSummary.generationTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(result.generationSummary.generationStrategy).toBe(input.generationStrategy);

    // Verify analysis details are extracted from input data
    expect(result.generationSummary.analysisDetails.delayRiskFactorsIdentified).toBeTruthy();
    expect(Array.isArray(result.generationSummary.analysisDetails.delayRiskFactorsIdentified)).toBe(
      true
    );
    expect(
      result.generationSummary.analysisDetails.delayRiskFactorsIdentified.length
    ).toBeGreaterThan(0);
    result.generationSummary.analysisDetails.delayRiskFactorsIdentified.forEach((factor) => {
      expect(typeof factor).toBe('string');
      expect(factor.length).toBeGreaterThan(0);
    });

    expect(result.generationSummary.analysisDetails.productivityBottlenecks).toBeTruthy();
    expect(Array.isArray(result.generationSummary.analysisDetails.productivityBottlenecks)).toBe(
      true
    );
    expect(result.generationSummary.analysisDetails.productivityBottlenecks.length).toBeGreaterThan(
      0
    );
    result.generationSummary.analysisDetails.productivityBottlenecks.forEach((bottleneck) => {
      expect(typeof bottleneck).toBe('string');
      expect(bottleneck.length).toBeGreaterThan(0);
    });

    expect(result.generationSummary.analysisDetails.recommendedInterventions).toBeTruthy();
    expect(
      Array.isArray(result.generationSummary.analysisDetails.recommendedInterventions)
    ).toBe(true);
    expect(
      result.generationSummary.analysisDetails.recommendedInterventions.length
    ).toBeGreaterThan(0);
    result.generationSummary.analysisDetails.recommendedInterventions.forEach((intervention) => {
      expect(typeof intervention).toBe('string');
      expect(intervention.length).toBeGreaterThan(0);
    });

    // Assert: Verify readyForDelivery
    expect(result.readyForDelivery).toBe(
      result.allocationPlans.filter(
        (p) => p.feasibilityScore >= input.minimumFeasibilityThreshold!
      ).length > 0
    );
  });

  it('should respect minimum feasibility threshold with multiple work instructions', async () => {
    // Arrange
    const input: GenerateAllocationPlansInput = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'RJ-001',
          workInstructionId: 'WI-001',
          facilityId: 'FAC-001',
          teamId: 'TEAM-001',
          riskLevel: 'HIGH',
          delayPredictionDays: 3,
          currentProgressRate: 30,
          plannedProgressRate: 80,
          recommendedAction: 'Critical intervention needed',
        },
        {
          riskJudgmentId: 'RJ-002',
          workInstructionId: 'WI-002',
          facilityId: 'FAC-002',
          teamId: 'TEAM-002',
          riskLevel: 'MEDIUM',
          delayPredictionDays: 2,
          currentProgressRate: 40,
          plannedProgressRate: 75,
          recommendedAction: 'Intervention needed',
        },
      ],
      productivityData: [
        {
          workerId: 'W-001',
          facilityId: 'FAC-001',
          teamId: 'TEAM-001',
          productivityRate: 0.5,
          qualityScore: 50,
          proficiencyLevel: 'BEGINNER',
          recentWorkResults: [
            {
              workInstructionId: 'WI-001',
              completionRate: 0.3,
              errorCount: 10,
            },
          ],
        },
        {
          workerId: 'W-002',
          facilityId: 'FAC-002',
          teamId: 'TEAM-002',
          productivityRate: 0.55,
          qualityScore: 55,
          proficiencyLevel: 'BEGINNER',
          recentWorkResults: [
            {
              workInstructionId: 'WI-002',
              completionRate: 0.35,
              errorCount: 8,
            },
          ],
        },
      ],
      targetFacilityIds: ['FAC-001', 'FAC-002'],
      targetTeamIds: ['TEAM-001', 'TEAM-002'],
      workInstructionIds: ['WI-001', 'WI-002'],
      minimumFeasibilityThreshold: 70,
      requestedBy: 'USER-001',
    };

    // Setup mocks with lower scores
    calculateAllocationFeasibilityScoreMock.mockImplementation(
      (input: CalculateAllocationPlanFeasibilityScoreInput) => {
        expect(input).toHaveProperty('planId');
        expect(input).toHaveProperty('allocatedWorkers');
        return 55;
      }
    );

    applyDifficultyAdjustmentByProficiencyMock.mockImplementation(
      (input: ApplyDifficultyAdjustmentByProficiencyInput) => {
        expect(input).toHaveProperty('workerId');
        expect(input).toHaveProperty('proficiencyLevel');
        expect(input).toHaveProperty('baseDifficultyLevel');
        return 'EASY';
      }
    );

    // Act
    const result = await generateAllocationPlans(input);

    // Assert
    expect(result.allocationPlans).toBeDefined();
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    // Verify all plans are generated even if below threshold
    expect(result.allocationPlans.length).toBe(2);

    const plansAboveThreshold = result.allocationPlans.filter(
      (p) => p.feasibilityScore >= input.minimumFeasibilityThreshold!
    );

    expect(result.generationSummary.plansAboveThreshold).toBe(plansAboveThreshold.length);

    // Verify readyForDelivery reflects threshold compliance
    expect(result.readyForDelivery).toBe(plansAboveThreshold.length > 0);

    // Verify each plan corresponds to one of the input work instructions
    result.allocationPlans.forEach((plan) => {
      expect(['WI-001', 'WI-002']).toContain(plan.workInstructionId);
    });
  });
});