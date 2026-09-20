import {
  listAllocationPlansByCondition,
  ListAllocationPlansByConditionInput,
} from '../../src/logic/data-persistence';

describe('SCEN-788: listAllocationPlansByCondition - 予想工数の最小値が最大値より大きい場合', () => {
  it('minEstimatedWorkHours > maxEstimatedWorkHours の場合、InvalidSearchConditionError を発生させる', async () => {
    const input: ListAllocationPlansByConditionInput = {
      minEstimatedWorkHours: 100,
      maxEstimatedWorkHours: 50,
      allocationPlanIds: null,
      facilityIds: null,
      teamIds: null,
      workInstructionIds: null,
      planNameKeyword: null,
      statuses: null,
      allocationStartFromDate: null,
      allocationStartToDate: null,
      allocationEndFromDate: null,
      allocationEndToDate: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    await expect(listAllocationPlansByCondition(input)).rejects.toMatchObject({
      name: 'InvalidSearchConditionError',
      message: '検索条件の日付または数値範囲が無効です。開始日時は終了日時以前、最小値は最大値以下である必要があります。',
    });
  });
});