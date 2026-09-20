import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';

describe('SCEN-789: ページ番号が0以下の場合にエラーを返す', () => {
  test('pageNumber が 0 の場合に PageParameterOutOfRangeError をスロー', async () => {
    const input = {
      pageNumber: 0,
      allocationPlanIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workInstructionIds: undefined,
      planNameKeyword: undefined,
      statuses: undefined,
      allocationStartFromDate: undefined,
      allocationStartToDate: undefined,
      allocationEndFromDate: undefined,
      allocationEndToDate: undefined,
      minEstimatedWorkHours: undefined,
      maxEstimatedWorkHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageSize: undefined,
    };

    await expect(listAllocationPlansByCondition(input)).rejects.toThrow(
      'ページ番号とページサイズは1以上である必要があります。'
    );
  });

  test('pageNumber が負数の場合に PageParameterOutOfRangeError をスロー', async () => {
    const input = {
      pageNumber: -1,
      allocationPlanIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workInstructionIds: undefined,
      planNameKeyword: undefined,
      statuses: undefined,
      allocationStartFromDate: undefined,
      allocationStartToDate: undefined,
      allocationEndFromDate: undefined,
      allocationEndToDate: undefined,
      minEstimatedWorkHours: undefined,
      maxEstimatedWorkHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageSize: undefined,
    };

    await expect(listAllocationPlansByCondition(input)).rejects.toThrow(
      'ページ番号とページサイズは1以上である必要があります。'
    );
  });
});