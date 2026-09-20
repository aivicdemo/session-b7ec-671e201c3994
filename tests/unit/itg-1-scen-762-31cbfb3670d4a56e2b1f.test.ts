import { saveAllocationPlan } from '../../src/logic/data-persistence';

describe('SCEN-762: saveAllocationPlan - FacilityNotFound error when facilityId does not exist', () => {
  it('should raise FacilityNotFound error when specified facilityId is not found in facility master', async () => {
    const input = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_追加配置案',
      facilityId: 'FACILITY_INVALID_001',
      teamId: 'TEAM_001',
      workInstructionId: 'WI_001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-31',
      estimatedWorkHours: 80,
      estimatedCompletionDate: '2024-01-31',
      status: '提案中',
      description: null,
      createdBy: 'USER_001',
      updatedBy: null,
    };

    await expect(saveAllocationPlan(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'FacilityNotFound',
        message: '指定された拠点が見つかりません。拠点IDを確認してください。',
      })
    );
  });
});