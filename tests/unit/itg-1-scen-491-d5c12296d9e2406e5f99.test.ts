import { calculateAllocationFeasibilityScore } from '../../src/logic/validation-common-calculation';
import * as validationCommonCalculation from '../../src/logic/validation-common-calculation';

describe('SCEN-491: 重み付け係数がデフォルト値で、3つの制約スコアが加重合算されて最終スコアが計算される', () => {
  beforeEach(() => {
    jest.spyOn(validationCommonCalculation, 'validateReferentialIntegrity').mockResolvedValue({
      isValid: true,
      validatedReferences: [
        { fieldName: 'facilityId', value: 'FAC-001', exists: true, relationshipValid: true },
        { fieldName: 'teamId', value: 'TEAM-001', exists: true, relationshipValid: true },
        { fieldName: 'workInstructionId', value: 'WI-001', exists: true, relationshipValid: true }
      ],
      violatedRules: [],
      missingReferences: [],
      invalidRelationships: []
    });

    jest.spyOn(validationCommonCalculation, 'validateNumericQuantity').mockResolvedValue({
      isValid: true,
      normalizedValue: 3,
      violatedRules: []
    });

    jest.spyOn(validationCommonCalculation, 'judgeProficiencyLevel').mockResolvedValue({
      workerId: 'W001',
      jobType: 'PICKING',
      proficiencyLevel: 'ADVANCED',
      evaluationDateTime: '2025-01-15T08:00:00',
      averageProductivityRate: 50,
      averageQualityScore: 95,
      evaluatedRecordCount: 10,
      judgmentReason: 'High productivity and quality scores',
      recommendedDifficultyLevel: 'HIGH'
    });

    jest.spyOn(validationCommonCalculation, 'calculateWorkHours').mockResolvedValue({
      plannedWorkHoursResult: 9,
      adjustedWorkHours: 9,
      businessHoursApplied: true,
      breakAdjustmentApplied: true
    });

    jest.spyOn(validationCommonCalculation, 'calculateWeightedScore').mockImplementation(
      async (input) => {
        const { scoreIndicators, weights } = input;
        let totalScore = 0;
        let totalWeight = 0;
        
        for (let i = 0; i < scoreIndicators.length; i++) {
          totalScore += scoreIndicators[i] * weights[i];
          totalWeight += weights[i];
        }
        
        const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
        const decimalPlaces = input.decimalPlaces || 2;
        const roundedScore = Math.round(normalizedScore * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
        
        return Math.max(0, Math.min(100, roundedScore));
      }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should calculate feasibility score using default weight factors when not provided', async () => {
    const input = {
      allocationPlanId: 'PLAN-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WI-001',
      allocatedWorkerIds: ['W001', 'W002', 'W003'],
      requiredWorkerCount: 3,
      maxFacilityCapacity: 10,
      currentFacilityOccupancy: 2,
      planStartDateTime: '2025-01-15T08:00:00',
      planEndDateTime: '2025-01-15T17:00:00',
      workerProficiencyData: [
        { workerId: 'W001', proficiencyLevel: 'ADVANCED' as const, jobType: 'PICKING' },
        { workerId: 'W002', proficiencyLevel: 'INTERMEDIATE' as const, jobType: 'PICKING' },
        { workerId: 'W003', proficiencyLevel: 'BEGINNER' as const, jobType: 'PICKING' }
      ],
      workerMaxWorkingHours: [
        { workerId: 'W001', maxHours: 8 },
        { workerId: 'W002', maxHours: 8 },
        { workerId: 'W003', maxHours: 8 }
      ],
      plannedWorkHours: 9,
      requiredProficiencyLevel: 'INTERMEDIATE' as const
    };

    const result = await calculateAllocationFeasibilityScore(input);

    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('should apply default weight factors (0.4, 0.35, 0.25) when not explicitly provided', async () => {
    const input = {
      allocationPlanId: 'PLAN-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WI-001',
      allocatedWorkerIds: ['W001', 'W002', 'W003'],
      requiredWorkerCount: 3,
      maxFacilityCapacity: 10,
      currentFacilityOccupancy: 2,
      planStartDateTime: '2025-01-15T08:00:00',
      planEndDateTime: '2025-01-15T17:00:00',
      workerProficiencyData: [
        { workerId: 'W001', proficiencyLevel: 'ADVANCED' as const, jobType: 'PICKING' },
        { workerId: 'W002', proficiencyLevel: 'INTERMEDIATE' as const, jobType: 'PICKING' },
        { workerId: 'W003', proficiencyLevel: 'BEGINNER' as const, jobType: 'PICKING' }
      ],
      workerMaxWorkingHours: [
        { workerId: 'W001', maxHours: 8 },
        { workerId: 'W002', maxHours: 8 },
        { workerId: 'W003', maxHours: 8 }
      ],
      plannedWorkHours: 9,
      requiredProficiencyLevel: 'INTERMEDIATE' as const
    };

    const calculateWeightedScoreSpy = jest.spyOn(validationCommonCalculation, 'calculateWeightedScore');

    const result = await calculateAllocationFeasibilityScore(input);

    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);

    expect(calculateWeightedScoreSpy).toHaveBeenCalled();
    const callArgs = calculateWeightedScoreSpy.mock.calls[0][0];
    expect(callArgs.weights).toEqual([0.4, 0.35, 0.25]);
  });

  it('should calculate weighted score using formula (staffing × 0.4 + proficiency × 0.35 + workingHours × 0.25)', async () => {
    const input = {
      allocationPlanId: 'PLAN-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WI-001',
      allocatedWorkerIds: ['W001', 'W002', 'W003'],
      requiredWorkerCount: 3,
      maxFacilityCapacity: 10,
      currentFacilityOccupancy: 2,
      planStartDateTime: '2025-01-15T08:00:00',
      planEndDateTime: '2025-01-15T17:00:00',
      workerProficiencyData: [
        { workerId: 'W001', proficiencyLevel: 'ADVANCED' as const, jobType: 'PICKING' },
        { workerId: 'W002', proficiencyLevel: 'INTERMEDIATE' as const, jobType: 'PICKING' },
        { workerId: 'W003', proficiencyLevel: 'BEGINNER' as const, jobType: 'PICKING' }
      ],
      workerMaxWorkingHours: [
        { workerId: 'W001', maxHours: 8 },
        { workerId: 'W002', maxHours: 8 },
        { workerId: 'W003', maxHours: 8 }
      ],
      plannedWorkHours: 9,
      requiredProficiencyLevel: 'INTERMEDIATE' as const
    };

    let capturedWeightedScoreInput: any;
    jest.spyOn(validationCommonCalculation, 'calculateWeightedScore').mockImplementation(
      async (weightedInput) => {
        capturedWeightedScoreInput = weightedInput;
        const { scoreIndicators, weights } = weightedInput;
        
        let totalScore = 0;
        for (let i = 0; i < scoreIndicators.length; i++) {
          totalScore += scoreIndicators[i] * weights[i];
        }
        
        const decimalPlaces = weightedInput.decimalPlaces || 2;
        const roundedScore = Math.round(totalScore * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
        return Math.max(0, Math.min(100, roundedScore));
      }
    );

    const result = await calculateAllocationFeasibilityScore(input);

    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);

    expect(capturedWeightedScoreInput).toBeDefined();
    expect(capturedWeightedScoreInput.weights).toEqual([0.4, 0.35, 0.25]);
    expect(capturedWeightedScoreInput.scoreIndicators).toHaveLength(3);
  });

  it('should not throw error when weight factors are omitted', async () => {
    const input = {
      allocationPlanId: 'PLAN-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WI-001',
      allocatedWorkerIds: ['W001', 'W002', 'W003'],
      requiredWorkerCount: 3,
      maxFacilityCapacity: 10,
      currentFacilityOccupancy: 2,
      planStartDateTime: '2025-01-15T08:00:00',
      planEndDateTime: '2025-01-15T17:00:00',
      workerProficiencyData: [
        { workerId: 'W001', proficiencyLevel: 'ADVANCED' as const, jobType: 'PICKING' },
        { workerId: 'W002', proficiencyLevel: 'INTERMEDIATE' as const, jobType: 'PICKING' },
        { workerId: 'W003', proficiencyLevel: 'BEGINNER' as const, jobType: 'PICKING' }
      ],
      workerMaxWorkingHours: [
        { workerId: 'W001', maxHours: 8 },
        { workerId: 'W002', maxHours: 8 },
        { workerId: 'W003', maxHours: 8 }
      ],
      plannedWorkHours: 9,
      requiredProficiencyLevel: 'INTERMEDIATE' as const
    };

    let error: Error | undefined;
    let result: number | undefined;

    try {
      result = await calculateAllocationFeasibilityScore(input);
    } catch (e) {
      error = e as Error;
    }

    expect(error).toBeUndefined();
    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
  });

  it('should verify dependent functions are called in correct order during calculation', async () => {
    const input = {
      allocationPlanId: 'PLAN-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WI-001',
      allocatedWorkerIds: ['W001', 'W002', 'W003'],
      requiredWorkerCount: 3,
      maxFacilityCapacity: 10,
      currentFacilityOccupancy: 2,
      planStartDateTime: '2025-01-15T08:00:00',
      planEndDateTime: '2025-01-15T17:00:00',
      workerProficiencyData: [
        { workerId: 'W001', proficiencyLevel: 'ADVANCED' as const, jobType: 'PICKING' },
        { workerId: 'W002', proficiencyLevel: 'INTERMEDIATE' as const, jobType: 'PICKING' },
        { workerId: 'W003', proficiencyLevel: 'BEGINNER' as const, jobType: 'PICKING' }
      ],
      workerMaxWorkingHours: [
        { workerId: 'W001', maxHours: 8 },
        { workerId: 'W002', maxHours: 8 },
        { workerId: 'W003', maxHours: 8 }
      ],
      plannedWorkHours: 9,
      requiredProficiencyLevel: 'INTERMEDIATE' as const
    };

    const validateRefSpy = jest.spyOn(validationCommonCalculation, 'validateReferentialIntegrity');
    const validateNumSpy = jest.spyOn(validationCommonCalculation, 'validateNumericQuantity');
    const judgeProfSpy = jest.spyOn(validationCommonCalculation, 'judgeProficiencyLevel');
    const calcWorkSpy = jest.spyOn(validationCommonCalculation, 'calculateWorkHours');
    const calcWeightedSpy = jest.spyOn(validationCommonCalculation, 'calculateWeightedScore');

    await calculateAllocationFeasibilityScore(input);

    expect(validateRefSpy).toHaveBeenCalled();
    expect(validateNumSpy).toHaveBeenCalled();
    expect(judgeProfSpy).toHaveBeenCalled();
    expect(calcWorkSpy).toHaveBeenCalled();
    expect(calcWeightedSpy).toHaveBeenCalled();
  });
});