import { calculateAllocationFeasibilityScore, InvalidWorkerProficiencyDataError } from '../../src/logic/validation-common-calculation';

describe('SCEN-487: calculateAllocationFeasibilityScore - InvalidWorkerProficiencyDataError', () => {
  it('should throw InvalidWorkerProficiencyDataError when workerProficiencyData is null', () => {
    const input = {
      allocationPlanId: 'PLAN-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WI-001',
      allocatedWorkerIds: ['W001', 'W002'],
      requiredWorkerCount: 2,
      maxFacilityCapacity: 10,
      currentFacilityOccupancy: 5,
      planStartDateTime: '2025-01-15T08:00:00Z',
      planEndDateTime: '2025-01-15T17:00:00Z',
      workerProficiencyData: null as any,
      workerMaxWorkingHours: [
        { workerId: 'W001', maxHours: 8 },
        { workerId: 'W002', maxHours: 8 },
      ],
      plannedWorkHours: 16,
      requiredProficiencyLevel: 'INTERMEDIATE' as const,
    };

    expect(() => calculateAllocationFeasibilityScore(input)).toThrow(InvalidWorkerProficiencyDataError);
    expect(() => calculateAllocationFeasibilityScore(input)).toThrow(
      /作業者の習熟度データが利用できません。評価日時と習熟度レベルを確認してください。/
    );
  });

  it('should throw InvalidWorkerProficiencyDataError when workerProficiencyData is empty array', () => {
    const input = {
      allocationPlanId: 'PLAN-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WI-001',
      allocatedWorkerIds: ['W001', 'W002'],
      requiredWorkerCount: 2,
      maxFacilityCapacity: 10,
      currentFacilityOccupancy: 5,
      planStartDateTime: '2025-01-15T08:00:00Z',
      planEndDateTime: '2025-01-15T17:00:00Z',
      workerProficiencyData: [],
      workerMaxWorkingHours: [
        { workerId: 'W001', maxHours: 8 },
        { workerId: 'W002', maxHours: 8 },
      ],
      plannedWorkHours: 16,
      requiredProficiencyLevel: 'INTERMEDIATE' as const,
    };

    expect(() => calculateAllocationFeasibilityScore(input)).toThrow(InvalidWorkerProficiencyDataError);
    expect(() => calculateAllocationFeasibilityScore(input)).toThrow(
      /作業者の習熟度データが利用できません。評価日時と習熟度レベルを確認してください。/
    );
  });
});