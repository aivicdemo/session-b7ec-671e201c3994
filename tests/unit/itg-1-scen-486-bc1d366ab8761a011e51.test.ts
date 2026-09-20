import { calculateAllocationFeasibilityScore, CalculateAllocationFeasibilityScoreInput } from '../../src/logic/validation-common-calculation';

describe('SCEN-486: calculateAllocationFeasibilityScore - InvalidAllocationPlanDataError validation', () => {
  it('should throw InvalidAllocationPlanDataError when allocationPlanId is null', async () => {
    const input: CalculateAllocationFeasibilityScoreInput = {
      allocationPlanId: null as any,
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionId: 'work-001',
      allocatedWorkerIds: ['worker-001', 'worker-002'],
      requiredWorkerCount: 2,
      maxFacilityCapacity: 100,
      currentFacilityOccupancy: 50,
      planStartDateTime: '2024-01-01T09:00:00Z',
      planEndDateTime: '2024-01-01T18:00:00Z',
      workerProficiencyData: [
        { workerId: 'worker-001', proficiencyLevel: 'INTERMEDIATE', jobType: 'assembly' },
        { workerId: 'worker-002', proficiencyLevel: 'ADVANCED', jobType: 'assembly' },
      ],
      workerMaxWorkingHours: [
        { workerId: 'worker-001', maxHours: 8 },
        { workerId: 'worker-002', maxHours: 8 },
      ],
      plannedWorkHours: 16,
      requiredProficiencyLevel: 'INTERMEDIATE',
    };

    await expect(calculateAllocationFeasibilityScore(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidAllocationPlanDataError',
        message: '人員配置案データが不完全または不正です。必須フィールドと参照整合性を確認してください。',
      })
    );
  });

  it('should throw InvalidAllocationPlanDataError when allocationPlanId is undefined', async () => {
    const input: any = {
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionId: 'work-001',
      allocatedWorkerIds: ['worker-001', 'worker-002'],
      requiredWorkerCount: 2,
      maxFacilityCapacity: 100,
      currentFacilityOccupancy: 50,
      planStartDateTime: '2024-01-01T09:00:00Z',
      planEndDateTime: '2024-01-01T18:00:00Z',
      workerProficiencyData: [
        { workerId: 'worker-001', proficiencyLevel: 'INTERMEDIATE', jobType: 'assembly' },
        { workerId: 'worker-002', proficiencyLevel: 'ADVANCED', jobType: 'assembly' },
      ],
      workerMaxWorkingHours: [
        { workerId: 'worker-001', maxHours: 8 },
        { workerId: 'worker-002', maxHours: 8 },
      ],
      plannedWorkHours: 16,
      requiredProficiencyLevel: 'INTERMEDIATE',
    };

    await expect(calculateAllocationFeasibilityScore(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidAllocationPlanDataError',
        message: '人員配置案データが不完全または不正です。必須フィールドと参照整合性を確認してください。',
      })
    );
  });

  it('should throw InvalidAllocationPlanDataError when facilityId is null', async () => {
    const input: CalculateAllocationFeasibilityScoreInput = {
      allocationPlanId: 'plan-001',
      facilityId: null as any,
      teamId: 'team-001',
      workInstructionId: 'work-001',
      allocatedWorkerIds: ['worker-001', 'worker-002'],
      requiredWorkerCount: 2,
      maxFacilityCapacity: 100,
      currentFacilityOccupancy: 50,
      planStartDateTime: '2024-01-01T09:00:00Z',
      planEndDateTime: '2024-01-01T18:00:00Z',
      workerProficiencyData: [
        { workerId: 'worker-001', proficiencyLevel: 'INTERMEDIATE', jobType: 'assembly' },
        { workerId: 'worker-002', proficiencyLevel: 'ADVANCED', jobType: 'assembly' },
      ],
      workerMaxWorkingHours: [
        { workerId: 'worker-001', maxHours: 8 },
        { workerId: 'worker-002', maxHours: 8 },
      ],
      plannedWorkHours: 16,
      requiredProficiencyLevel: 'INTERMEDIATE',
    };

    await expect(calculateAllocationFeasibilityScore(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidAllocationPlanDataError',
        message: '人員配置案データが不完全または不正です。必須フィールドと参照整合性を確認してください。',
      })
    );
  });

  it('should throw InvalidAllocationPlanDataError when allocatedWorkerIds is empty', async () => {
    const input: CalculateAllocationFeasibilityScoreInput = {
      allocationPlanId: 'plan-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionId: 'work-001',
      allocatedWorkerIds: [],
      requiredWorkerCount: 2,
      maxFacilityCapacity: 100,
      currentFacilityOccupancy: 50,
      planStartDateTime: '2024-01-01T09:00:00Z',
      planEndDateTime: '2024-01-01T18:00:00Z',
      workerProficiencyData: [
        { workerId: 'worker-001', proficiencyLevel: 'INTERMEDIATE', jobType: 'assembly' },
      ],
      workerMaxWorkingHours: [
        { workerId: 'worker-001', maxHours: 8 },
      ],
      plannedWorkHours: 16,
      requiredProficiencyLevel: 'INTERMEDIATE',
    };

    await expect(calculateAllocationFeasibilityScore(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidAllocationPlanDataError',
        message: '人員配置案データが不完全または不正です。必須フィールドと参照整合性を確認してください。',
      })
    );
  });

  it('should throw InvalidAllocationPlanDataError when requiredWorkerCount is missing', async () => {
    const input: any = {
      allocationPlanId: 'plan-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionId: 'work-001',
      allocatedWorkerIds: ['worker-001', 'worker-002'],
      maxFacilityCapacity: 100,
      currentFacilityOccupancy: 50,
      planStartDateTime: '2024-01-01T09:00:00Z',
      planEndDateTime: '2024-01-01T18:00:00Z',
      workerProficiencyData: [
        { workerId: 'worker-001', proficiencyLevel: 'INTERMEDIATE', jobType: 'assembly' },
        { workerId: 'worker-002', proficiencyLevel: 'ADVANCED', jobType: 'assembly' },
      ],
      workerMaxWorkingHours: [
        { workerId: 'worker-001', maxHours: 8 },
        { workerId: 'worker-002', maxHours: 8 },
      ],
      plannedWorkHours: 16,
      requiredProficiencyLevel: 'INTERMEDIATE',
    };

    await expect(calculateAllocationFeasibilityScore(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidAllocationPlanDataError',
        message: '人員配置案データが不完全または不正です。必須フィールドと参照整合性を確認してください。',
      })
    );
  });

  it('should throw InvalidAllocationPlanDataError when planStartDateTime is null', async () => {
    const input: CalculateAllocationFeasibilityScoreInput = {
      allocationPlanId: 'plan-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionId: 'work-001',
      allocatedWorkerIds: ['worker-001', 'worker-002'],
      requiredWorkerCount: 2,
      maxFacilityCapacity: 100,
      currentFacilityOccupancy: 50,
      planStartDateTime: null as any,
      planEndDateTime: '2024-01-01T18:00:00Z',
      workerProficiencyData: [
        { workerId: 'worker-001', proficiencyLevel: 'INTERMEDIATE', jobType: 'assembly' },
        { workerId: 'worker-002', proficiencyLevel: 'ADVANCED', jobType: 'assembly' },
      ],
      workerMaxWorkingHours: [
        { workerId: 'worker-001', maxHours: 8 },
        { workerId: 'worker-002', maxHours: 8 },
      ],
      plannedWorkHours: 16,
      requiredProficiencyLevel: 'INTERMEDIATE',
    };

    await expect(calculateAllocationFeasibilityScore(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidAllocationPlanDataError',
        message: '人員配置案データが不完全または不正です。必須フィールドと参照整合性を確認してください。',
      })
    );
  });

  it('should throw InvalidAllocationPlanDataError when workerProficiencyData is empty', async () => {
    const input: CalculateAllocationFeasibilityScoreInput = {
      allocationPlanId: 'plan-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionId: 'work-001',
      allocatedWorkerIds: ['worker-001', 'worker-002'],
      requiredWorkerCount: 2,
      maxFacilityCapacity: 100,
      currentFacilityOccupancy: 50,
      planStartDateTime: '2024-01-01T09:00:00Z',
      planEndDateTime: '2024-01-01T18:00:00Z',
      workerProficiencyData: [],
      workerMaxWorkingHours: [
        { workerId: 'worker-001', maxHours: 8 },
        { workerId: 'worker-002', maxHours: 8 },
      ],
      plannedWorkHours: 16,
      requiredProficiencyLevel: 'INTERMEDIATE',
    };

    await expect(calculateAllocationFeasibilityScore(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidAllocationPlanDataError',
        message: '人員配置案データが不完全または不正です。必須フィールドと参照整合性を確認してください。',
      })
    );
  });

  it('should throw InvalidAllocationPlanDataError when requiredProficiencyLevel is null', async () => {
    const input: CalculateAllocationFeasibilityScoreInput = {
      allocationPlanId: 'plan-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionId: 'work-001',
      allocatedWorkerIds: ['worker-001', 'worker-002'],
      requiredWorkerCount: 2,
      maxFacilityCapacity: 100,
      currentFacilityOccupancy: 50,
      planStartDateTime: '2024-01-01T09:00:00Z',
      planEndDateTime: '2024-01-01T18:00:00Z',
      workerProficiencyData: [
        { workerId: 'worker-001', proficiencyLevel: 'INTERMEDIATE', jobType: 'assembly' },
        { workerId: 'worker-002', proficiencyLevel: 'ADVANCED', jobType: 'assembly' },
      ],
      workerMaxWorkingHours: [
        { workerId: 'worker-001', maxHours: 8 },
        { workerId: 'worker-002', maxHours: 8 },
      ],
      plannedWorkHours: 16,
      requiredProficiencyLevel: null as any,
    };

    await expect(calculateAllocationFeasibilityScore(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidAllocationPlanDataError',
        message: '人員配置案データが不完全または不正です。必須フィールドと参照整合性を確認してください。',
      })
    );
  });
});