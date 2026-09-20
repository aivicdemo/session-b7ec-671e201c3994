import { calculateAllocationFeasibilityScore, CalculateAllocationFeasibilityScoreInput } from '../../src/logic/validation-common-calculation';
import * as validationModule from '../../src/logic/validation-common-calculation';

describe('calculateAllocationFeasibilityScore - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw CalculationFailureError when calculateWeightedScore returns NaN', async () => {
    jest.spyOn(validationModule, 'validateReferentialIntegrity').mockResolvedValue({
      isValid: true,
      validatedReferences: [],
      violatedRules: [],
      missingReferences: [],
      invalidRelationships: []
    });

    jest.spyOn(validationModule, 'validateNumericQuantity').mockReturnValue({
      isValid: true,
      normalizedValue: 24,
      violatedRules: []
    });

    jest.spyOn(validationModule, 'judgeProficiencyLevel').mockResolvedValue({
      workerId: 'W001',
      jobType: 'picking',
      proficiencyLevel: 'INTERMEDIATE',
      evaluationDateTime: '2024-01-15T09:00:00Z',
      averageProductivityRate: 50,
      averageQualityScore: 85,
      evaluatedRecordCount: 10,
      judgmentReason: 'Based on past performance',
      recommendedDifficultyLevel: 'MEDIUM'
    });

    jest.spyOn(validationModule, 'calculateWorkHours').mockResolvedValue({
      actualWorkHours: 8,
      businessHoursApplied: true,
      breakAdjustmentApplied: true
    });

    jest.spyOn(validationModule, 'calculateWeightedScore').mockReturnValue(NaN);

    const input: CalculateAllocationFeasibilityScoreInput = {
      allocationPlanId: 'PLAN-001',
      facilityId: 'FAC-01',
      teamId: 'TEAM-A',
      workInstructionId: 'WORK-001',
      allocatedWorkerIds: ['W001', 'W002', 'W003'],
      requiredWorkerCount: 3,
      maxFacilityCapacity: 50,
      currentFacilityOccupancy: 10,
      planStartDateTime: '2024-01-15T09:00:00Z',
      planEndDateTime: '2024-01-15T18:00:00Z',
      workerProficiencyData: [
        { workerId: 'W001', proficiencyLevel: 'ADVANCED', jobType: 'picking' },
        { workerId: 'W002', proficiencyLevel: 'INTERMEDIATE', jobType: 'picking' },
        { workerId: 'W003', proficiencyLevel: 'BEGINNER', jobType: 'picking' }
      ],
      workerMaxWorkingHours: [
        { workerId: 'W001', maxHours: 8 },
        { workerId: 'W002', maxHours: 8 },
        { workerId: 'W003', maxHours: 8 }
      ],
      plannedWorkHours: 24,
      requiredProficiencyLevel: 'INTERMEDIATE',
      staffingWeightFactor: 0.4,
      proficiencyWeightFactor: 0.35,
      workingHoursWeightFactor: 0.25,
      timeZone: 'Asia/Tokyo'
    };

    await expect(calculateAllocationFeasibilityScore(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'CalculationFailureError',
        message: expect.stringContaining('実現可能性スコアの計算に失敗しました')
      })
    );
  });

  it('should throw CalculationFailureError when calculateWeightedScore returns Infinity', async () => {
    jest.spyOn(validationModule, 'validateReferentialIntegrity').mockResolvedValue({
      isValid: true,
      validatedReferences: [],
      violatedRules: [],
      missingReferences: [],
      invalidRelationships: []
    });

    jest.spyOn(validationModule, 'validateNumericQuantity').mockReturnValue({
      isValid: true,
      normalizedValue: 24,
      violatedRules: []
    });

    jest.spyOn(validationModule, 'judgeProficiencyLevel').mockResolvedValue({
      workerId: 'W001',
      jobType: 'picking',
      proficiencyLevel: 'INTERMEDIATE',
      evaluationDateTime: '2024-01-15T09:00:00Z',
      averageProductivityRate: 50,
      averageQualityScore: 85,
      evaluatedRecordCount: 10,
      judgmentReason: 'Based on past performance',
      recommendedDifficultyLevel: 'MEDIUM'
    });

    jest.spyOn(validationModule, 'calculateWorkHours').mockResolvedValue({
      actualWorkHours: 8,
      businessHoursApplied: true,
      breakAdjustmentApplied: true
    });

    jest.spyOn(validationModule, 'calculateWeightedScore').mockReturnValue(Infinity);

    const input: CalculateAllocationFeasibilityScoreInput = {
      allocationPlanId: 'PLAN-001',
      facilityId: 'FAC-01',
      teamId: 'TEAM-A',
      workInstructionId: 'WORK-001',
      allocatedWorkerIds: ['W001', 'W002', 'W003'],
      requiredWorkerCount: 3,
      maxFacilityCapacity: 50,
      currentFacilityOccupancy: 10,
      planStartDateTime: '2024-01-15T09:00:00Z',
      planEndDateTime: '2024-01-15T18:00:00Z',
      workerProficiencyData: [
        { workerId: 'W001', proficiencyLevel: 'ADVANCED', jobType: 'picking' },
        { workerId: 'W002', proficiencyLevel: 'INTERMEDIATE', jobType: 'picking' },
        { workerId: 'W003', proficiencyLevel: 'BEGINNER', jobType: 'picking' }
      ],
      workerMaxWorkingHours: [
        { workerId: 'W001', maxHours: 8 },
        { workerId: 'W002', maxHours: 8 },
        { workerId: 'W003', maxHours: 8 }
      ],
      plannedWorkHours: 24,
      requiredProficiencyLevel: 'INTERMEDIATE',
      staffingWeightFactor: 0.4,
      proficiencyWeightFactor: 0.35,
      workingHoursWeightFactor: 0.25,
      timeZone: 'Asia/Tokyo'
    };

    await expect(calculateAllocationFeasibilityScore(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'CalculationFailureError',
        message: expect.stringContaining('実現可能性スコアの計算に失敗しました')
      })
    );
  });

  it('should throw CalculationFailureError when calculateWeightedScore returns undefined', async () => {
    jest.spyOn(validationModule, 'validateReferentialIntegrity').mockResolvedValue({
      isValid: true,
      validatedReferences: [],
      violatedRules: [],
      missingReferences: [],
      invalidRelationships: []
    });

    jest.spyOn(validationModule, 'validateNumericQuantity').mockReturnValue({
      isValid: true,
      normalizedValue: 24,
      violatedRules: []
    });

    jest.spyOn(validationModule, 'judgeProficiencyLevel').mockResolvedValue({
      workerId: 'W001',
      jobType: 'picking',
      proficiencyLevel: 'INTERMEDIATE',
      evaluationDateTime: '2024-01-15T09:00:00Z',
      averageProductivityRate: 50,
      averageQualityScore: 85,
      evaluatedRecordCount: 10,
      judgmentReason: 'Based on past performance',
      recommendedDifficultyLevel: 'MEDIUM'
    });

    jest.spyOn(validationModule, 'calculateWorkHours').mockResolvedValue({
      actualWorkHours: 8,
      businessHoursApplied: true,
      breakAdjustmentApplied: true
    });

    jest.spyOn(validationModule, 'calculateWeightedScore').mockReturnValue(undefined as any);

    const input: CalculateAllocationFeasibilityScoreInput = {
      allocationPlanId: 'PLAN-001',
      facilityId: 'FAC-01',
      teamId: 'TEAM-A',
      workInstructionId: 'WORK-001',
      allocatedWorkerIds: ['W001', 'W002', 'W003'],
      requiredWorkerCount: 3,
      maxFacilityCapacity: 50,
      currentFacilityOccupancy: 10,
      planStartDateTime: '2024-01-15T09:00:00Z',
      planEndDateTime: '2024-01-15T18:00:00Z',
      workerProficiencyData: [
        { workerId: 'W001', proficiencyLevel: 'ADVANCED', jobType: 'picking' },
        { workerId: 'W002', proficiencyLevel: 'INTERMEDIATE', jobType: 'picking' },
        { workerId: 'W003', proficiencyLevel: 'BEGINNER', jobType: 'picking' }
      ],
      workerMaxWorkingHours: [
        { workerId: 'W001', maxHours: 8 },
        { workerId: 'W002', maxHours: 8 },
        { workerId: 'W003', maxHours: 8 }
      ],
      plannedWorkHours: 24,
      requiredProficiencyLevel: 'INTERMEDIATE',
      staffingWeightFactor: 0.4,
      proficiencyWeightFactor: 0.35,
      workingHoursWeightFactor: 0.25,
      timeZone: 'Asia/Tokyo'
    };

    await expect(calculateAllocationFeasibilityScore(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'CalculationFailureError',
        message: expect.stringContaining('実現可能性スコアの計算に失敗しました')
      })
    );
  });
});