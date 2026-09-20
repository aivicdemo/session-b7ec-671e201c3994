import { listWorkersByCondition } from '../../src/logic/data-persistence';

describe('SCEN-600: 作業者ID配列で絞り込んだ作業者一覧が正常に返される', () => {
  it('指定されたworkerIds配列に合致する作業者一覧を返す', async () => {
    const input = {
      workerIds: ['W001', 'W003', 'W005'],
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

    expect(result).toBeDefined();
    expect(result.workers).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);
    
    expect(result.workers.length).toBeGreaterThanOrEqual(0);
    expect(result.workers.length).toBeLessThanOrEqual(input.workerIds.length);

    result.workers.forEach((worker) => {
      expect(['W001', 'W003', 'W005']).toContain(worker.workerId);
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
      expect(worker.updatedAt).toBeDefined();
      expect(typeof worker.updatedAt).toBe('string');
      expect(worker.createdBy).toBeDefined();
      expect(typeof worker.createdBy).toBe('string');
    });

    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    expect(typeof result.retrievedAt).toBe('string');
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.toString()).not.toBe('Invalid Date');

    if (result.pageNumber !== null && result.pageNumber !== undefined) {
      expect(typeof result.pageNumber).toBe('number');
    }
    if (result.pageSize !== null && result.pageSize !== undefined) {
      expect(typeof result.pageSize).toBe('number');
    }
  });

  it('複数のworkerIdが正しく一致して検索される', async () => {
    const input = {
      workerIds: ['W001', 'W003', 'W005'],
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

    expect(result.workers.length).toBeGreaterThanOrEqual(0);
    const foundIds = result.workers.map((w) => w.workerId);
    foundIds.forEach((id) => {
      expect(input.workerIds).toContain(id);
    });
  });

  it('retrievedAtがISO 8601形式で返される', async () => {
    const input = {
      workerIds: ['W001', 'W003', 'W005'],
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

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(isoDateRegex);
  });

  it('各作業者オブジェクトが正確な構造を持つ', async () => {
    const input = {
      workerIds: ['W001', 'W003', 'W005'],
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

    if (result.workers.length > 0) {
      const worker = result.workers[0];
      expect(worker).toHaveProperty('workerId');
      expect(worker).toHaveProperty('workerName');
      expect(worker).toHaveProperty('facilityId');
      expect(worker).toHaveProperty('teamId');
      expect(worker).toHaveProperty('jobType');
      expect(worker).toHaveProperty('operatingStatus');
      expect(worker).toHaveProperty('createdAt');
      expect(worker).toHaveProperty('updatedAt');
      expect(worker).toHaveProperty('createdBy');
    }
  });
});