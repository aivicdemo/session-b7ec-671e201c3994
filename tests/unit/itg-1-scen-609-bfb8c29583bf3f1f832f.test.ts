import { listWorkersByCondition } from '../../src/logic/data-persistence';

describe('SCEN-609: 更新日時範囲で絞り込んだ作業者一覧取得', () => {
  it('更新日時範囲（開始日と終了日）で絞り込んだ作業者一覧が正常に返される', async () => {
    const updatedFromDate = '2024-01-01T00:00:00Z';
    const updatedToDate = '2024-01-31T23:59:59Z';

    const result = await listWorkersByCondition({
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workerNameKeyword: undefined,
      jobTypes: undefined,
      operatingStatuses: undefined,
      minHourlyRate: undefined,
      maxHourlyRate: undefined,
      minMaxWorkingHours: undefined,
      maxMaxWorkingHours: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate,
      updatedToDate,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });

    expect(result).toBeDefined();
    expect(result.workers).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(iso8601Regex.test(result.retrievedAt)).toBe(true);

    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();

    result.workers.forEach((worker) => {
      expect(worker.workerId).toBeDefined();
      expect(typeof worker.workerId).toBe('string');
      expect(worker.workerName).toBeDefined();
      expect(typeof worker.workerName).toBe('string');
      expect(worker.facilityId).toBeDefined();
      expect(typeof worker.facilityId).toBe('string');
      expect(worker.teamId).toBeDefined();
      expect(typeof worker.teamId).toBe('string');
      expect(worker.jobType).toBeDefined();
      expect(typeof worker.jobType).toBe('string');
      expect(worker.operatingStatus).toBeDefined();
      expect(typeof worker.operatingStatus).toBe('string');
      expect(worker.createdAt).toBeDefined();
      expect(typeof worker.createdAt).toBe('string');
      expect(iso8601Regex.test(worker.createdAt)).toBe(true);
      expect(worker.updatedAt).toBeDefined();
      expect(typeof worker.updatedAt).toBe('string');
      expect(iso8601Regex.test(worker.updatedAt)).toBe(true);
      expect(worker.createdBy).toBeDefined();
      expect(typeof worker.createdBy).toBe('string');

      const workerUpdatedDate = new Date(worker.updatedAt);
      const fromDate = new Date(updatedFromDate);
      const toDate = new Date(updatedToDate);
      expect(workerUpdatedDate.getTime()).toBeGreaterThanOrEqual(
        fromDate.getTime()
      );
      expect(workerUpdatedDate.getTime()).toBeLessThanOrEqual(toDate.getTime());
    });

    expect(result.workers.length).toBeLessThanOrEqual(result.totalCount);
  });
});