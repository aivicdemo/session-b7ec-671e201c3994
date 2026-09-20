import { listWorkResultsByCondition } from '../../src/logic/data-persistence';

describe('SCEN-748: ページサイズが1未満の場合、ページネーション条件不正エラーが発生する', () => {
  it('pageSize が 0 の場合、InvalidPaginationError が発生する', async () => {
    const input = {
      workResultIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workStatuses: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDefectCount: undefined,
      maxDefectCount: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: 0,
    };

    await expect(listWorkResultsByCondition(input)).rejects.toThrow('ページネーション条件が不正です。');
  });
});