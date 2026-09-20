import { listWorkInstructionReceptionHistoryByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1053: ページサイズが1未満の場合、ページネーション条件エラーが発生する', () => {
  test('pageSize が 0 のとき InvalidPaginationError が発生する', async () => {
    const input = {
      pageSize: 0,
      receptionHistoryIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      receptionStatuses: undefined,
      deliveryMethods: undefined,
      receptionDateFromDateTime: undefined,
      receptionDateToDateTime: undefined,
      confirmationDateFromDateTime: undefined,
      confirmationDateToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
    };

    await expect(
      listWorkInstructionReceptionHistoryByCondition(input)
    ).rejects.toMatchObject({
      name: 'InvalidPaginationError',
      message: 'ページネーション条件が不正です。',
    });
  });

  test('pageSize が null のとき InvalidPaginationError が発生する', async () => {
    const input = {
      pageSize: null as any,
      receptionHistoryIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      receptionStatuses: undefined,
      deliveryMethods: undefined,
      receptionDateFromDateTime: undefined,
      receptionDateToDateTime: undefined,
      confirmationDateFromDateTime: undefined,
      confirmationDateToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
    };

    await expect(
      listWorkInstructionReceptionHistoryByCondition(input)
    ).rejects.toMatchObject({
      name: 'InvalidPaginationError',
      message: 'ページネーション条件が不正です。',
    });
  });

  test('pageSize が負数のとき InvalidPaginationError が発生する', async () => {
    const input = {
      pageSize: -1,
      receptionHistoryIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      receptionStatuses: undefined,
      deliveryMethods: undefined,
      receptionDateFromDateTime: undefined,
      receptionDateToDateTime: undefined,
      confirmationDateFromDateTime: undefined,
      confirmationDateToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
    };

    await expect(
      listWorkInstructionReceptionHistoryByCondition(input)
    ).rejects.toMatchObject({
      name: 'InvalidPaginationError',
      message: 'ページネーション条件が不正です。',
    });
  });
});