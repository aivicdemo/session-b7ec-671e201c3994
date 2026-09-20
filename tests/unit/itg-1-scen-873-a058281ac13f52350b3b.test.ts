import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';
import { ListAllocationExecutionStatusByConditionInput } from '../../src/logic/data-persistence';

describe('listAllocationExecutionStatusByCondition - ページ番号が0以下の場合にエラーを返す', () => {
  it('pageNumber が 0 の場合、InvalidConditionFormatError を発生させる', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      pageNumber: 0,
      allocationExecutionStatusIds: null,
      allocationPlanIds: null,
      workInstructionIds: null,
      workerIds: null,
      facilityIds: null,
      teamIds: null,
      allocationStates: null,
      delayFlagFilter: null,
      minProgressRate: null,
      maxProgressRate: null,
      plannedStartFromDateTime: null,
      plannedStartToDateTime: null,
      plannedEndFromDateTime: null,
      plannedEndToDateTime: null,
      actualStartFromDateTime: null,
      actualStartToDateTime: null,
      actualEndFromDateTime: null,
      actualEndToDateTime: null,
      minPlannedWorkHours: null,
      maxPlannedWorkHours: null,
      minActualWorkHours: null,
      maxActualWorkHours: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageSize: null,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      'InvalidConditionFormatError'
    );

    try {
      await listAllocationExecutionStatusByCondition(input);
    } catch (error: any) {
      expect(error.message).toBe(
        '検索条件の形式が不正です。日時はISO8601形式、ページ番号は1以上、ページサイズは1以上を指定してください。'
      );
    }
  });

  it('pageNumber が負の値の場合、InvalidConditionFormatError を発生させる', async () => {
    const input: ListAllocationExecutionStatusByConditionInput = {
      pageNumber: -1,
      allocationExecutionStatusIds: null,
      allocationPlanIds: null,
      workInstructionIds: null,
      workerIds: null,
      facilityIds: null,
      teamIds: null,
      allocationStates: null,
      delayFlagFilter: null,
      minProgressRate: null,
      maxProgressRate: null,
      plannedStartFromDateTime: null,
      plannedStartToDateTime: null,
      plannedEndFromDateTime: null,
      plannedEndToDateTime: null,
      actualStartFromDateTime: null,
      actualStartToDateTime: null,
      actualEndFromDateTime: null,
      actualEndToDateTime: null,
      minPlannedWorkHours: null,
      maxPlannedWorkHours: null,
      minActualWorkHours: null,
      maxActualWorkHours: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageSize: null,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      'InvalidConditionFormatError'
    );

    try {
      await listAllocationExecutionStatusByCondition(input);
    } catch (error: any) {
      expect(error.message).toBe(
        '検索条件の形式が不正です。日時はISO8601形式、ページ番号は1以上、ページサイズは1以上を指定してください。'
      );
    }
  });
});