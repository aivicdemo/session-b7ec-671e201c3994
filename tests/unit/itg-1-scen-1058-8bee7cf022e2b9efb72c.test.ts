import { listWorkInstructionReceptionHistoryByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1058: 受領日時範囲で検索した場合、指定範囲内のレコードのみが返される', () => {
  it('should return only records within the specified reception date time range', async () => {
    const receptionDateFromDateTime = '2024-01-01T00:00:00Z';
    const receptionDateToDateTime = '2024-01-31T23:59:59Z';

    const input = {
      receptionDateFromDateTime,
      receptionDateToDateTime,
      receptionHistoryIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      receptionStatuses: undefined,
      deliveryMethods: undefined,
      confirmationDateFromDateTime: undefined,
      confirmationDateToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result).toBeDefined();
    expect(result.receptionHistories).toBeDefined();
    expect(Array.isArray(result.receptionHistories)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.retrievedAt).toBeDefined();

    if (result.receptionHistories.length > 0) {
      result.receptionHistories.forEach((record) => {
        const receptionDateTime = new Date(record.receptionDateTime);
        const fromDate = new Date(receptionDateFromDateTime);
        const toDate = new Date(receptionDateToDateTime);

        expect(receptionDateTime.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
        expect(receptionDateTime.getTime()).toBeLessThanOrEqual(toDate.getTime());
      });
    }

    expect(result.receptionHistories.length).toBe(result.totalCount);

    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.getTime()).toBeLessThanOrEqual(Date.now());
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);
  });
});