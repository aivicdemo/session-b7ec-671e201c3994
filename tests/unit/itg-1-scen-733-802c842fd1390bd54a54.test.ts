import { listWorkResultsByCondition } from '../../src/logic/data-persistence';

describe('SCEN-733: 更新日時の範囲で検索して合致するデータが返される', () => {
  it('should return work result data matching the specified updated date range', async () => {
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
      updatedFromDate: '2024-01-01T00:00:00Z',
      updatedToDate: '2024-01-31T23:59:59Z',
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listWorkResultsByCondition(input);

    expect(result).toBeDefined();
    expect(result.workResults).toBeDefined();
    expect(Array.isArray(result.workResults)).toBe(true);

    if (result.workResults.length > 0) {
      result.workResults.forEach((workResult) => {
        const updatedAtDate = new Date(workResult.updatedAt);
        const fromDate = new Date('2024-01-01T00:00:00Z');
        const toDate = new Date('2024-01-31T23:59:59Z');

        expect(updatedAtDate.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
        expect(updatedAtDate.getTime()).toBeLessThanOrEqual(toDate.getTime());
      });
    }

    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(isoDatePattern);
  });
});