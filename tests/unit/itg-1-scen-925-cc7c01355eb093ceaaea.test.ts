import { listProgressDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-925: ページサイズが1未満の場合、エラーを返す', () => {
  it('pageSizeが0の場合、InvalidPaginationParameterエラーを返す', async () => {
    const input = {
      progressDataIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: undefined,
      maxDelayDays: undefined,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: 0,
    };

    await expect(listProgressDataByCondition(input)).rejects.toMatchObject({
      name: 'InvalidPaginationParameterError',
      message: 'ページネーションパラメータが不正です。ページ番号とページサイズは1以上である必要があります。',
    });
  });

  it('pageSizeが負の値の場合、InvalidPaginationParameterエラーを返す', async () => {
    const input = {
      progressDataIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      progressDateFrom: undefined,
      progressDateTo: undefined,
      minCompletionRate: undefined,
      maxCompletionRate: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDelayDays: undefined,
      maxDelayDays: undefined,
      delayFlagFilter: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: -1,
    };

    await expect(listProgressDataByCondition(input)).rejects.toMatchObject({
      name: 'InvalidPaginationParameterError',
      message: 'ページネーションパラメータが不正です。ページ番号とページサイズは1以上である必要があります。',
    });
  });
});