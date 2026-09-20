import { listWorkersByCondition } from '../../src/logic/data-persistence';

describe('SCEN-604: 職種配列で絞り込んだ作業者一覧が正常に返される', () => {
  it('should return workers filtered by jobTypes array', async () => {
    const input = {
      jobTypes: ['electrician', 'welder'],
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workerNameKeyword: undefined,
      operatingStatuses: undefined,
      minHourlyRate: undefined,
      maxHourlyRate: undefined,
      minMaxWorkingHours: undefined,
      maxMaxWorkingHours: undefined,
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
    expect(result.workers).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);
    
    result.workers.forEach((worker) => {
      expect(['electrician', 'welder']).toContain(worker.jobType);
    });

    expect(result.totalCount).toEqual(result.workers.length);
    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(isoDateRegex.test(result.retrievedAt)).toBe(true);
  });
});