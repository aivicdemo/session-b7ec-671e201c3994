import { calculateAllocationFeasibilityScore, calculateWorkHours, calculateWeightedScore, validateReferentialIntegrity, validateNumericQuantity, judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';
import * as validationModule from '../../src/logic/validation-common-calculation';

jest.mock('../../src/logic/validation-common-calculation', () => {
  const actual = jest.requireActual('../../src/logic/validation-common-calculation');
  return {
    ...actual,
    calculateAllocationFeasibilityScore: jest.fn(actual.calculateAllocationFeasibilityScore),
    calculateWorkHours: jest.fn(),
    calculateWeightedScore: jest.fn(),
    validateReferentialIntegrity: jest.fn(),
    validateNumericQuantity: jest.fn(),
    judgeProficiencyLevel: jest.fn(),
  };
});

describe('SCEN-493: calculateAllocationFeasibilityScore - タイムゾーンデフォルト値テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (validationModule.validateReferentialIntegrity as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedReferences: [
        { fieldName: 'allocationPlanId', value: 'PLAN-TZ-TEST-001', exists: true, relationshipValid: true },
        { fieldName: 'facilityId', value: 'FAC-001', exists: true, relationshipValid: true },
        { fieldName: 'teamId', value: 'TEAM-A', exists: true, relationshipValid: true },
        { fieldName: 'workInstructionId', value: 'WI-001', exists: true, relationshipValid: true },
      ],
      violatedRules: [],
      missingReferences: [],
      invalidRelationships: [],
    });

    (validationModule.validateNumericQuantity as jest.Mock)
      .mockResolvedValueOnce({
        isValid: true,
        normalizedValue: 3,
        violatedRules: [],
      })
      .mockResolvedValueOnce({
        isValid: true,
        normalizedValue: 50,
        violatedRules: [],
      })
      .mockResolvedValueOnce({
        isValid: true,
        normalizedValue: 10,
        violatedRules: [],
      })
      .mockResolvedValueOnce({
        isValid: true,
        normalizedValue: 27,
        violatedRules: [],
      })
      .mockResolvedValueOnce({
        isValid: true,
        normalizedValue: 9.0,
        violatedRules: [],
      })
      .mockResolvedValueOnce({
        isValid: true,
        normalizedValue: 9.0,
        violatedRules: [],
      })
      .mockResolvedValueOnce({
        isValid: true,
        normalizedValue: 9.0,
        violatedRules: [],
      });

    (validationModule.judgeProficiencyLevel as jest.Mock)
      .mockResolvedValueOnce({
        workerId: 'W001',
        jobType: 'PICKING',
        proficiencyLevel: 'ADVANCED',
        evaluationDateTime: '2024-02-15T09:00:00Z',
        averageProductivityRate: 150,
        averageQualityScore: 95,
        evaluatedRecordCount: 30,
        judgmentReason: 'Advanced proficiency based on historical data',
        recommendedDifficultyLevel: 'HIGH',
      })
      .mockResolvedValueOnce({
        workerId: 'W002',
        jobType: 'PICKING',
        proficiencyLevel: 'INTERMEDIATE',
        evaluationDateTime: '2024-02-15T09:00:00Z',
        averageProductivityRate: 100,
        averageQualityScore: 85,
        evaluatedRecordCount: 25,
        judgmentReason: 'Intermediate proficiency based on historical data',
        recommendedDifficultyLevel: 'MEDIUM',
      })
      .mockResolvedValueOnce({
        workerId: 'W003',
        jobType: 'PICKING',
        proficiencyLevel: 'BEGINNER',
        evaluationDateTime: '2024-02-15T09:00:00Z',
        averageProductivityRate: 60,
        averageQualityScore: 70,
        evaluatedRecordCount: 10,
        judgmentReason: 'Beginner proficiency based on historical data',
        recommendedDifficultyLevel: 'LOW',
      });

    (validationModule.calculateWorkHours as jest.Mock).mockResolvedValue({
      workHoursForBusinessHours: 9.0,
      totalWorkMinutes: 540,
      businessHoursCovered: true,
    });

    (validationModule.calculateWeightedScore as jest.Mock).mockResolvedValue({
      weightedScore: 84,
    });
  });

  it('タイムゾーン引数を省略した場合、Asia/Tokyoをデフォルトとして適用し、配置開始・終了日時をJSTで正しく解釈する', async () => {
    const input = {
      allocationPlanId: 'PLAN-TZ-TEST-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-A',
      workInstructionId: 'WI-001',
      allocatedWorkerIds: ['W001', 'W002', 'W003'],
      requiredWorkerCount: 3,
      maxFacilityCapacity: 50,
      currentFacilityOccupancy: 10,
      planStartDateTime: '2024-02-15T09:00:00',
      planEndDateTime: '2024-02-15T18:00:00',
      workerProficiencyData: [
        { workerId: 'W001', proficiencyLevel: 'ADVANCED' as const, jobType: 'PICKING' },
        { workerId: 'W002', proficiencyLevel: 'INTERMEDIATE' as const, jobType: 'PICKING' },
        { workerId: 'W003', proficiencyLevel: 'BEGINNER' as const, jobType: 'PICKING' },
      ],
      workerMaxWorkingHours: [
        { workerId: 'W001', maxHours: 9.0 },
        { workerId: 'W002', maxHours: 9.0 },
        { workerId: 'W003', maxHours: 9.0 },
      ],
      plannedWorkHours: 27,
      requiredProficiencyLevel: 'INTERMEDIATE' as const,
      staffingWeightFactor: 0.4,
      proficiencyWeightFactor: 0.35,
      workingHoursWeightFactor: 0.25,
    };

    expect(input).not.toHaveProperty('timeZone');

    const result = await calculateAllocationFeasibilityScore(input);

    expect(result).toBeDefined();
    expect(result.isValid).toBe(true);
    expect(result.feasibilityScore).toBe(84);
    expect(result.violatedRules).toEqual([]);

    expect(validationModule.validateReferentialIntegrity).toHaveBeenCalled();
    expect(validationModule.validateNumericQuantity).toHaveBeenCalled();
    expect(validationModule.judgeProficiencyLevel).toHaveBeenCalled();
    expect(validationModule.calculateWorkHours).toHaveBeenCalledWith(
      expect.objectContaining({
        startDateTime: '2024-02-15T09:00:00',
        endDateTime: '2024-02-15T18:00:00',
        timeZone: 'Asia/Tokyo',
      })
    );
    expect(validationModule.calculateWeightedScore).toHaveBeenCalled();
  });
});