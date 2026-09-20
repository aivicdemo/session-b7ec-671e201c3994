import { calculateAllocationFeasibilityScore } from '../../src/logic/validation-common-calculation';

describe('SCEN-488: 人員配置案の実現可能性スコア計算 - 負の稼働時間エラー', () => {
  it('should throw InvalidWorkingHoursDataError when workerMaxWorkingHours contains negative value', async () => {
    const input = {
      allocationPlanId: 'PLAN-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WI-001',
      allocatedWorkerIds: ['W001', 'W002'],
      requiredWorkerCount: 2,
      maxFacilityCapacity: 50,
      currentFacilityOccupancy: 10,
      planStartDateTime: '2025-04-01T08:00:00Z',
      planEndDateTime: '2025-04-01T17:00:00Z',
      workerProficiencyData: [
        { workerId: 'W001', proficiencyLevel: 'ADVANCED' as const, jobType: 'picking' },
        { workerId: 'W002', proficiencyLevel: 'INTERMEDIATE' as const, jobType: 'packing' }
      ],
      workerMaxWorkingHours: [
        { workerId: 'W001', maxHours: -5 },
        { workerId: 'W002', maxHours: 8 }
      ],
      plannedWorkHours: 8,
      requiredProficiencyLevel: 'INTERMEDIATE' as const,
      staffingWeightFactor: 0.4,
      proficiencyWeightFactor: 0.35,
      workingHoursWeightFactor: 0.25,
      timeZone: 'Asia/Tokyo'
    };

    await expect(calculateAllocationFeasibilityScore(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidWorkingHoursDataError',
        message: expect.stringContaining('作業者の稼働時間制約が不正です。最大稼働時間とスケジュールを確認してください。')
      })
    );
  });
});