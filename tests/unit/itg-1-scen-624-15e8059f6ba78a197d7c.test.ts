import { listWorkersByCondition } from '../../src/logic/data-persistence';

describe('SCEN-624: 検索条件に合致する作業者が0件の場合、空配列と件数0が返される', () => {
  it('should return empty array and totalCount 0 when no workers match the search condition', async () => {
    const input = {
      workerIds: null,
      facilityIds: null,
      teamIds: null,
      workerNameKeyword: null,
      jobTypes: null,
      operatingStatuses: null,
      minHourlyRate: null,
      maxHourlyRate: null,
      minMaxWorkingHours: null,
      maxMaxWorkingHours: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result = await listWorkersByCondition(input);

    expect(result.workers).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/.test(result.retrievedAt)).toBe(true);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
  });
});