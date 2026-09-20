import { listWorkResultsByCondition } from '../../src/logic/data-persistence';

describe('SCEN-744: 更新日時の開始日が終了日より後の場合、日時範囲不正エラーが発生する', () => {
  it('updatedFromDate が updatedToDate より後の場合、InvalidSearchConditionError を発生させる', async () => {
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
      updatedFromDate: '2024-01-15T10:00:00Z',
      updatedToDate: '2024-01-10T10:00:00Z',
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(listWorkResultsByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidSearchConditionError',
        message: '検索条件の日時または数値範囲が不正です。',
      })
    );
  });
});