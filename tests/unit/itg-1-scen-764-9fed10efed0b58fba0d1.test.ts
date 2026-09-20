import { saveAllocationPlan } from '../../src/logic/data-persistence';

describe('SCEN-764: saveAllocationPlan - WorkInstructionNotFound Error', () => {
  it('should throw WorkInstructionNotFound error when work instruction ID does not exist', async () => {
    const input = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_追加配置案',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WI-999-NOT-EXIST',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 40,
      estimatedCompletionDate: '2024-01-20',
      status: '承認済み',
      description: null,
      createdBy: 'USER-001',
      updatedBy: null,
    };

    await expect(saveAllocationPlan(input)).rejects.toMatchObject({
      name: 'WorkInstructionNotFound',
      message: '指定された作業指示が見つかりません。作業指示IDを確認してください。',
    });
  });
});