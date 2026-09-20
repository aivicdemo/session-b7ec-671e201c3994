import { listWorkersByCondition, type ListWorkersByConditionInput, type ListWorkersByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-625: 全入力パラメータがnullまたはundefinedである場合、全件が返される', () => {
  it('全入力パラメータがnullまたはundefinedの場合、全件を返す', async () => {
    const input: ListWorkersByConditionInput = {
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

    const result: ListWorkersByConditionOutput = await listWorkersByCondition(input);

    expect(result).toBeDefined();
    expect(result.workers).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.workers.length).toBe(result.totalCount);
    
    if (result.totalCount > 0) {
      result.workers.forEach(worker => {
        expect(worker.workerId).toBeDefined();
        expect(worker.workerName).toBeDefined();
        expect(worker.facilityId).toBeDefined();
        expect(worker.teamId).toBeDefined();
        expect(worker.jobType).toBeDefined();
        expect(worker.operatingStatus).toBeDefined();
        expect(worker.createdAt).toBeDefined();
        expect(worker.updatedAt).toBeDefined();
        expect(worker.createdBy).toBeDefined();
      });
    }

    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate.getTime()).toBeGreaterThan(0);
  });

  it('全入力パラメータがundefinedの場合、全件を返す', async () => {
    const input: ListWorkersByConditionInput = {
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
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListWorkersByConditionOutput = await listWorkersByCondition(input);

    expect(result).toBeDefined();
    expect(result.workers).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.workers.length).toBe(result.totalCount);
    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();
    expect(result.retrievedAt).toBeDefined();
  });

  it('空の条件オブジェクトで呼び出した場合、全件を返す', async () => {
    const input: ListWorkersByConditionInput = {};

    const result: ListWorkersByConditionOutput = await listWorkersByCondition(input);

    expect(result).toBeDefined();
    expect(result.workers).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.workers.length).toBe(result.totalCount);
    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();
    expect(result.retrievedAt).toBeDefined();
  });

  it('返却されたデータがISO 8601形式の日時を含む', async () => {
    const input: ListWorkersByConditionInput = {
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

    const result: ListWorkersByConditionOutput = await listWorkersByCondition(input);

    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    
    if (result.workers.length > 0) {
      result.workers.forEach(worker => {
        expect(worker.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(worker.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    }
  });
});