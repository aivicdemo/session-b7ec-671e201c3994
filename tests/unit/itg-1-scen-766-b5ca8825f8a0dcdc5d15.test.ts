import { saveAllocationPlan, SaveAllocationPlanInput } from '../../src/logic/data-persistence';

describe('SCEN-766: 配置開始日または配置終了日の形式が不正である場合、InvalidDateRangeエラーが発生する', () => {
  it('不正な日付形式を指定した場合、InvalidDateRangeエラーをスロー する', async () => {
    const input: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: 'テスト配置案',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionId: 'work-instruction-001',
      allocationStartDate: '2024-13-45',
      allocationEndDate: '2024-12-31',
      estimatedWorkHours: 100,
      estimatedCompletionDate: '2024-12-31',
      status: 'proposal',
      createdBy: 'user-001',
    };

    await expect(saveAllocationPlan(input)).rejects.toMatchObject({
      name: 'InvalidDateRange',
      message: '配置期間が不正です。配置開始日は配置終了日より前である必要があります。',
    });
  });

  it('allocationEndDateが不正な形式の場合、InvalidDateRangeエラーをスロー する', async () => {
    const input: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: 'テスト配置案',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionId: 'work-instruction-001',
      allocationStartDate: '2024-12-01',
      allocationEndDate: '2024-99-99',
      estimatedWorkHours: 100,
      estimatedCompletionDate: '2024-12-31',
      status: 'proposal',
      createdBy: 'user-001',
    };

    await expect(saveAllocationPlan(input)).rejects.toMatchObject({
      name: 'InvalidDateRange',
      message: '配置期間が不正です。配置開始日は配置終了日より前である必要があります。',
    });
  });

  it('allocationStartDateがallocationEndDateより後の場合、InvalidDateRangeエラーをスロー する', async () => {
    const input: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: 'テスト配置案',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionId: 'work-instruction-001',
      allocationStartDate: '2024-12-31',
      allocationEndDate: '2024-12-01',
      estimatedWorkHours: 100,
      estimatedCompletionDate: '2024-12-31',
      status: 'proposal',
      createdBy: 'user-001',
    };

    await expect(saveAllocationPlan(input)).rejects.toMatchObject({
      name: 'InvalidDateRange',
      message: '配置期間が不正です。配置開始日は配置終了日より前である必要があります。',
    });
  });
});