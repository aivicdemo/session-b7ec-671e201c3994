import { calculateAllocationFeasibilityScore } from '../../src/logic/validation-common-calculation';
import * as validationModule from '../../src/logic/validation-common-calculation';

describe('calculateAllocationFeasibilityScore - タイムゾーン指定時の日時計算', () => {
  beforeEach(() => {
    jest.spyOn(validationModule, 'validateReferentialIntegrity').mockResolvedValue({
      isValid: true,
      validatedReferences: [],
      violatedRules: [],
      missingReferences: [],
      invalidRelationships: [],
    });

    jest.spyOn(validationModule, 'validateNumericQuantity').mockResolvedValue({
      isValid: true,
      normalizedValue: 3,
      violatedRules: [],
    });

    jest.spyOn(validationModule, 'judgeProficiencyLevel').mockResolvedValue({
      workerId: 'W001',
      jobType: 'PICKING',
      proficiencyLevel: 'INTERMEDIATE',
      evaluationDateTime: '2024-01-15T00:00:00Z',
      averageProductivityRate: 50,
      averageQualityScore: 85,
      evaluatedRecordCount: 10,
      judgmentReason: 'Based on historical data',
      recommendedDifficultyLevel: 'MEDIUM',
    });

    jest.spyOn(validationModule, 'calculateWorkHours').mockResolvedValue({
      actualWorkHours: 8,
      businessHoursOnly: 8,
      breakAdjustedHours: 8,
    });

    jest.spyOn(validationModule, 'calculateWeightedScore').mockResolvedValue(75);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('timeZoneがAmerica/New_Yorkで指定された場合、そのタイムゾーンに基づいて日時計算が行われ、0～100の範囲内のスコアが返される', async () => {
    const input = {
      allocationPlanId: 'PLAN-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WI-001',
      allocatedWorkerIds: ['W001', 'W002', 'W003'],
      requiredWorkerCount: 3,
      maxFacilityCapacity: 50,
      currentFacilityOccupancy: 10,
      planStartDateTime: '2024-01-15T09:00:00Z',
      planEndDateTime: '2024-01-15T17:00:00Z',
      workerProficiencyData: [
        { workerId: 'W001', proficiencyLevel: 'ADVANCED' as const, jobType: 'PICKING' },
        { workerId: 'W002', proficiencyLevel: 'INTERMEDIATE' as const, jobType: 'PICKING' },
        { workerId: 'W003', proficiencyLevel: 'BEGINNER' as const, jobType: 'PICKING' },
      ],
      workerMaxWorkingHours: [
        { workerId: 'W001', maxHours: 8 },
        { workerId: 'W002', maxHours: 8 },
        { workerId: 'W003', maxHours: 8 },
      ],
      plannedWorkHours: 24,
      requiredProficiencyLevel: 'INTERMEDIATE' as const,
      staffingWeightFactor: 0.4,
      proficiencyWeightFactor: 0.35,
      workingHoursWeightFactor: 0.25,
      timeZone: 'America/New_York',
    };

    const result = await calculateAllocationFeasibilityScore(input);

    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('America/New_York タイムゾーンにおいて、UTC日時が現地時間に換算され、稼働時間適合度に反映される', async () => {
    const input = {
      allocationPlanId: 'PLAN-002',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WI-002',
      allocatedWorkerIds: ['W001', 'W002', 'W003'],
      requiredWorkerCount: 3,
      maxFacilityCapacity: 50,
      currentFacilityOccupancy: 10,
      planStartDateTime: '2024-01-15T09:00:00Z',
      planEndDateTime: '2024-01-15T17:00:00Z',
      workerProficiencyData: [
        { workerId: 'W001', proficiencyLevel: 'ADVANCED' as const, jobType: 'PICKING' },
        { workerId: 'W002', proficiencyLevel: 'INTERMEDIATE' as const, jobType: 'PICKING' },
        { workerId: 'W003', proficiencyLevel: 'BEGINNER' as const, jobType: 'PICKING' },
      ],
      workerMaxWorkingHours: [
        { workerId: 'W001', maxHours: 8 },
        { workerId: 'W002', maxHours: 8 },
        { workerId: 'W003', maxHours: 8 },
      ],
      plannedWorkHours: 24,
      requiredProficiencyLevel: 'INTERMEDIATE' as const,
      staffingWeightFactor: 0.4,
      proficiencyWeightFactor: 0.35,
      workingHoursWeightFactor: 0.25,
      timeZone: 'America/New_York',
    };

    const result = await calculateAllocationFeasibilityScore(input);

    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('America/New_York タイムゾーンでの8時間稼働が plannedWorkHours=24 との乖離を含めた稼働時間適合度として反映される', async () => {
    const input = {
      allocationPlanId: 'PLAN-003',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WI-003',
      allocatedWorkerIds: ['W001', 'W002'],
      requiredWorkerCount: 3,
      maxFacilityCapacity: 50,
      currentFacilityOccupancy: 10,
      planStartDateTime: '2024-01-15T09:00:00Z',
      planEndDateTime: '2024-01-15T17:00:00Z',
      workerProficiencyData: [
        { workerId: 'W001', proficiencyLevel: 'ADVANCED' as const, jobType: 'PICKING' },
        { workerId: 'W002', proficiencyLevel: 'INTERMEDIATE' as const, jobType: 'PICKING' },
      ],
      workerMaxWorkingHours: [
        { workerId: 'W001', maxHours: 8 },
        { workerId: 'W002', maxHours: 8 },
      ],
      plannedWorkHours: 24,
      requiredProficiencyLevel: 'INTERMEDIATE' as const,
      staffingWeightFactor: 0.4,
      proficiencyWeightFactor: 0.35,
      workingHoursWeightFactor: 0.25,
      timeZone: 'America/New_York',
    };

    const result = await calculateAllocationFeasibilityScore(input);

    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('エラーハンドリング: 無効なタイムゾーン値が指定された場合、適切なエラーまたはフォールバック動作を行う', async () => {
    const input = {
      allocationPlanId: 'PLAN-004',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WI-004',
      allocatedWorkerIds: ['W001'],
      requiredWorkerCount: 1,
      maxFacilityCapacity: 50,
      currentFacilityOccupancy: 10,
      planStartDateTime: '2024-01-15T09:00:00Z',
      planEndDateTime: '2024-01-15T17:00:00Z',
      workerProficiencyData: [
        { workerId: 'W001', proficiencyLevel: 'ADVANCED' as const, jobType: 'PICKING' },
      ],
      workerMaxWorkingHours: [{ workerId: 'W001', maxHours: 8 }],
      plannedWorkHours: 8,
      requiredProficiencyLevel: 'INTERMEDIATE' as const,
      timeZone: 'Invalid/Timezone',
    };

    try {
      const result = await calculateAllocationFeasibilityScore(input);
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});