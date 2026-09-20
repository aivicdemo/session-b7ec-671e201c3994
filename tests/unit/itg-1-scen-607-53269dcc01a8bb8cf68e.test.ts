import { listWorkersByCondition } from '../../src/logic/data-persistence';

describe('SCEN-607: 最大稼働時間範囲で絞り込んだ作業者一覧取得', () => {
  it('指定された最大稼働時間範囲に合致する作業者一覧が正常に返される', async () => {
    const input = {
      minMaxWorkingHours: 20,
      maxMaxWorkingHours: 40,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workerNameKeyword: undefined,
      jobTypes: undefined,
      operatingStatuses: undefined,
      minHourlyRate: undefined,
      maxHourlyRate: undefined,
      minMaxWorkingHours: 20,
      maxMaxWorkingHours: 40,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await listWorkersByCondition(input);

    expect(result).toBeDefined();
    expect(result.workers).toBeInstanceOf(Array);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCount).toBe('number');

    result.workers.forEach((worker) => {
      if (worker.maxWorkingHours !== undefined) {
        expect(worker.maxWorkingHours).toBeGreaterThanOrEqual(20);
        expect(worker.maxWorkingHours).toBeLessThanOrEqual(40);
      }
    });

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);

    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();
  });
});