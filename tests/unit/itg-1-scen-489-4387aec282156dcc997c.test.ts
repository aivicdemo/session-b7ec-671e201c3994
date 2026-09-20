import { calculateAllocationFeasibilityScore } from '../../src/logic/validation-common-calculation';

describe('SCEN-489: 配置案の実現可能性スコア算出 - 人員数制約検証', () => {
  it('配置案に必要な人員数が拠点の最大収容人員数を超える場合、InsufficientCapacityErrorが発生する', async () => {
    const input = {
      allocationPlanId: 'PLAN-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WI-001',
      allocatedWorkerIds: ['W001', 'W002', 'W003'],
      requiredWorkerCount: 5,
      maxFacilityCapacity: 10,
      currentFacilityOccupancy: 6,
      planStartDateTime: '2025-01-20T09:00:00Z',
      planEndDateTime: '2025-01-20T18:00:00Z',
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
      plannedWorkHours: 8,
      requiredProficiencyLevel: 'INTERMEDIATE' as const,
      staffingWeightFactor: 0.4,
      proficiencyWeightFactor: 0.35,
      workingHoursWeightFactor: 0.25,
      timeZone: 'Asia/Tokyo',
    };

    try {
      await calculateAllocationFeasibilityScore(input);
      fail('InsufficientCapacityErrorが発生することを期待しています');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('InsufficientCapacityError');
      expect(error.message).toContain('配置案の人員数が拠点の収容可能人員を超えています');
      expect(error.message).toContain('人員数または拠点を調整してください');
    }
  });
});