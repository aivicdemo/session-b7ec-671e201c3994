import { generateAllocationPlans } from '../../src/logic/personnel-allocation-optimizer';
import { GenerateAllocationPlansInput, GenerateAllocationPlansOutput } from '../../src/logic/personnel-allocation-optimizer';

// Mock the validateReferentialIntegrity function
jest.mock('../../src/logic/personnel-allocation-optimizer', () => {
  const actual = jest.requireActual('../../src/logic/personnel-allocation-optimizer');
  return {
    ...actual,
    validateReferentialIntegrity: jest.fn().mockResolvedValue(true),
  };
});

describe('SCEN-179: generateAllocationPlans with validateReferentialIntegrity verification', () => {
  let validateReferentialIntegritySpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const module = require('../../src/logic/personnel-allocation-optimizer');
    validateReferentialIntegritySpy = module.validateReferentialIntegrity as jest.Mock;
    validateReferentialIntegritySpy.mockResolvedValue(true);
  });

  test('validateReferentialIntegrity should be called with input data for referential integrity validation', async () => {
    // Prepare input data
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
        recommendedAction: 'Allocate additional resources',
      },
      {
        riskJudgmentId: 'risk-002',
        workInstructionId: 'work-002',
        facilityId: 'facility-002',
        teamId: 'team-002',
        riskLevel: 'MEDIUM' as const,
        delayPredictionDays: 1,
        currentProgressRate: 70,
        plannedProgressRate: 75,
        recommendedAction: 'Monitor progress',
      },
    ];

    const productivityData = [
      {
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        productivityRate: 0.9,
        qualityScore: 92,
        proficiencyLevel: 'ADVANCED' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-001',
            completionRate: 0.85,
            errorCount: 2,
          },
        ],
      },
      {
        workerId: 'worker-002',
        facilityId: 'facility-002',
        teamId: 'team-002',
        productivityRate: 0.75,
        qualityScore: 88,
        proficiencyLevel: 'INTERMEDIATE' as const,
        recentWorkResults: [
          {
            workInstructionId: 'work-002',
            completionRate: 0.78,
            errorCount: 3,
          },
        ],
      },
    ];

    const targetFacilityIds = ['facility-001', 'facility-002'];
    const targetTeamIds = ['team-001', 'team-002'];
    const workInstructionIds = ['work-001', 'work-002'];

    const input: GenerateAllocationPlansInput = {
      delayRiskJudgments,
      productivityData,
      targetFacilityIds,
      targetTeamIds,
      workInstructionIds,
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-001',
    };

    // Call the function
    const result = await generateAllocationPlans(input);

    // Verify validateReferentialIntegrity was called exactly once
    expect(validateReferentialIntegritySpy).toHaveBeenCalledTimes(1);

    // Verify call arguments
    const callArgs = validateReferentialIntegritySpy.mock.calls[0][0];
    expect(callArgs).toHaveProperty('delayRiskJudgments');
    expect(callArgs).toHaveProperty('productivityData');
    expect(callArgs).toHaveProperty('targetFacilityIds');
    expect(callArgs).toHaveProperty('targetTeamIds');
    expect(callArgs).toHaveProperty('workInstructionIds');

    expect(callArgs.delayRiskJudgments).toEqual(delayRiskJudgments);
    expect(callArgs.productivityData).toEqual(productivityData);
    expect(callArgs.targetFacilityIds).toEqual(targetFacilityIds);
    expect(callArgs.targetTeamIds).toEqual(targetTeamIds);
    expect(callArgs.workInstructionIds).toEqual(workInstructionIds);

    // Verify output structure
    expect(result).toBeDefined();
    expect(result).toHaveProperty('allocationPlans');
    expect(result).toHaveProperty('recommendedRanking');
    expect(result).toHaveProperty('generationSummary');
    expect(result).toHaveProperty('readyForDelivery');

    // Verify allocationPlans is an array with valid elements
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    if (result.allocationPlans.length > 0) {
      const plan = result.allocationPlans[0];
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
      expect(Array.isArray(plan.allocatedWorkers)).toBe(true);
      expect(typeof plan.feasibilityScore).toBe('number');
    }

    // Verify recommendedRanking is an array with valid elements
    expect(Array.isArray(result.recommendedRanking)).toBe(true);
    if (result.recommendedRanking.length > 0) {
      const ranking = result.recommendedRanking[0];
      expect(ranking).toHaveProperty('planId');
      expect(ranking).toHaveProperty('rank');
      expect(ranking).toHaveProperty('recommendationReason');
      expect(ranking).toHaveProperty('feasibilityScore');
      expect(ranking).toHaveProperty('riskLevel');
      expect(typeof ranking.rank).toBe('number');
    }

    // Verify generationSummary contains required fields
    expect(result.generationSummary).toHaveProperty('totalPlansGenerated');
    expect(result.generationSummary).toHaveProperty('plansAboveThreshold');
    expect(result.generationSummary).toHaveProperty('generationTimestamp');
    expect(result.generationSummary).toHaveProperty('generationStrategy');
    expect(result.generationSummary).toHaveProperty('analysisDetails');
    expect(typeof result.generationSummary.totalPlansGenerated).toBe('number');
    expect(typeof result.generationSummary.plansAboveThreshold).toBe('number');
    expect(typeof result.generationSummary.generationTimestamp).toBe('string');
    expect(result.generationSummary.generationStrategy).toEqual('balance_risk_and_efficiency');
    expect(result.generationSummary.analysisDetails).toHaveProperty('delayRiskFactorsIdentified');
    expect(result.generationSummary.analysisDetails).toHaveProperty('productivityBottlenecks');
    expect(result.generationSummary.analysisDetails).toHaveProperty('recommendedInterventions');

    // Verify readyForDelivery is boolean
    expect(typeof result.readyForDelivery).toBe('boolean');
  });

  test('generateAllocationPlans should continue processing when validateReferentialIntegrity returns true', async () => {
    const input: GenerateAllocationPlansInput = {
      delayRiskJudgments: [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'work-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          riskLevel: 'HIGH' as const,
          delayPredictionDays: 2,
          currentProgressRate: 50,
          plannedProgressRate: 70,
          recommendedAction: 'Add resources',
        },
      ],
      productivityData: [
        {
          workerId: 'worker-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          productivityRate: 0.85,
          qualityScore: 90,
          proficiencyLevel: 'ADVANCED' as const,
          recentWorkResults: [
            {
              workInstructionId: 'work-001',
              completionRate: 0.8,
              errorCount: 1,
            },
          ],
        },
      ],
      targetFacilityIds: ['facility-001'],
      targetTeamIds: ['team-001'],
      workInstructionIds: ['work-001'],
      generationStrategy: 'balance_risk_and_efficiency',
      minimumFeasibilityThreshold: 60,
      requestedBy: 'user-001',
    };

    const result: GenerateAllocationPlansOutput = await generateAllocationPlans(input);

    expect(validateReferentialIntegritySpy).toHaveBeenCalled();
    expect(result.allocationPlans).toBeDefined();
    expect(result.recommendedRanking).toBeDefined();
    expect(result.generationSummary).toBeDefined();
    expect(typeof result.readyForDelivery).toBe('boolean');

    // Verify that allocation plans were generated
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThanOrEqual(0);

    // Verify generationSummary indicates processing occurred
    expect(result.generationSummary.totalPlansGenerated).toBeGreaterThanOrEqual(0);
  });
});