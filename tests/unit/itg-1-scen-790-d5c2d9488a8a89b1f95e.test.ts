import { ListAllocationPlansByConditionInput } from '../../src/logic/data-persistence';
import { listAllocationPlansByCondition } from '../../src/logic/data-persistence';

describe('SCEN-790: ページサイズが0以下の場合にエラーを返す', () => {
  it('pageSize が 0 の場合、PageParameterOutOfRangeError を発生させる', async () => {
    const input: ListAllocationPlansByConditionInput = {
      pageSize: 0,
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
      minEstimatedWorkHours: null,
      maxEstimatedWorkHours: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
    };

    await expect(listAllocationPlansByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'PageParameterOutOfRangeError',
        message: expect.stringContaining('ページ番号とページサイズは1以上である必要があります。'),
      })
    );
  });

  it('pageSize が負の値の場合、PageParameterOutOfRangeError を発生させる', async () => {
    const input: ListAllocationPlansByConditionInput = {
      pageSize: -1,
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
      pageNumber: undefined,
    };

    await expect(listAllocationPlansByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'PageParameterOutOfRangeError',
        message: expect.stringContaining('ページ番号とページサイズは1以上である必要があります。'),
      })
    );
  });
});