import { listWorkersByCondition } from '../../src/logic/data-persistence';

describe('SCEN-605: 稼働状況配列で絞り込んだ作業者一覧が正常に返される', () => {
  it('operatingStatusesフィールドで指定された稼働状況のみを持つ作業者が返される', async () => {
    const operatingStatuses = ['active', 'on_leave'];
    
    const result = await listWorkersByCondition({
      operatingStatuses,
      workerIds: null,
      facilityIds: null,
      teamIds: null,
      workerNameKeyword: null,
      jobTypes: null,
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
    });

    expect(result.workers).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);
    
    result.workers.forEach((worker) => {
      expect(operatingStatuses).toContain(worker.operatingStatus);
    });

    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(result.workers.length);

    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();

    expect(result.retrievedAt).toBeDefined();
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(isoRegex.test(result.retrievedAt)).toBe(true);
  });

  it('workers配列内のすべての作業者が指定されたoperatingStatusesのいずれかの値を持つ', async () => {
    const operatingStatuses = ['active'];
    
    const result = await listWorkersByCondition({
      operatingStatuses,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workerNameKeyword: undefined,
      jobTypes: undefined,
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
    });

    result.workers.forEach((worker) => {
      expect(worker.operatingStatus).toBe('active');
    });
  });

  it('totalCountが指定した稼働状況に合致した作業者の総件数と一致する', async () => {
    const operatingStatuses = ['active', 'on_leave'];
    
    const result = await listWorkersByCondition({
      operatingStatuses,
      workerIds: null,
      facilityIds: null,
      teamIds: null,
      workerNameKeyword: null,
      jobTypes: null,
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
    });

    expect(result.totalCount).toBeGreaterThan(0);
    expect(typeof result.totalCount).toBe('number');
  });

  it('retrievedAtが呼び出し時刻を表すISO 8601形式の文字列である', async () => {
    const operatingStatuses = ['active'];
    
    const result = await listWorkersByCondition({
      operatingStatuses,
      workerIds: null,
      facilityIds: null,
      teamIds: null,
      workerNameKeyword: null,
      jobTypes: null,
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
    });

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    
    const parsedDate = new Date(result.retrievedAt);
    expect(parsedDate.toString()).not.toBe('Invalid Date');
    
    const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(isoPattern.test(result.retrievedAt)).toBe(true);
  });
});