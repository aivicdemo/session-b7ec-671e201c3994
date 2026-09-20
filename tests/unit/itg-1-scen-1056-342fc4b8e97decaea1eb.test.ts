import { listWorkInstructionReceptionHistoryByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1056: ページネーション指定がない場合、全件が1ページで返される', () => {
  it('ページネーション指定なしで検索条件を満たす全受領履歴データを取得する', async () => {
    const input = {
      receptionHistoryIds: null,
      workInstructionIds: null,
      workerIds: null,
      receptionStatuses: null,
      deliveryMethods: null,
      receptionDateFromDateTime: null,
      receptionDateToDateTime: null,
      confirmationDateFromDateTime: null,
      confirmationDateToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result = await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result).toBeDefined();
    expect(result.receptionHistories).toBeInstanceOf(Array);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    if (result.totalCount > 0) {
      expect(result.receptionHistories.length).toBe(result.totalCount);
      
      result.receptionHistories.forEach((history) => {
        expect(history.receptionHistoryId).toBeDefined();
        expect(history.workInstructionId).toBeDefined();
        expect(history.workerId).toBeDefined();
        expect(history.receptionDateTime).toBeDefined();
        expect(history.receptionStatus).toBeDefined();
        expect(history.deliveryMethod).toBeDefined();
        expect(history.createdAt).toBeDefined();
        expect(history.updatedAt).toBeDefined();
        expect(history.createdBy).toBeDefined();
      });
    }
  });
});