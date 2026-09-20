import { listWorkersByCondition, ListWorkersByConditionInput, ListWorkersByConditionOutput, GetWorkerByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-610: 複数の検索条件を組み合わせて絞り込んだ作業者一覧が正常に返される', () => {
  it('should return filtered workers with combined search conditions', async () => {
    // Arrange
    const input: ListWorkersByConditionInput = {
      facilityIds: ['F001', 'F002'],
      teamIds: ['T001'],
      jobTypes: ['作業員'],
      operatingStatuses: ['稼働中'],
      minHourlyRate: 1200,
      maxHourlyRate: 1800,
      sortBy: 'workerName',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 10,
    };

    // Act
    const result: ListWorkersByConditionOutput = await listWorkersByCondition(input);

    // Assert
    // (1) workers配列が指定条件に合致する作業者でソートされている
    expect(result.workers).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);
    
    result.workers.forEach((worker: GetWorkerByIdOutput) => {
      // facilityIdがF001またはF002に含まれる
      expect(['F001', 'F002']).toContain(worker.facilityId);
      // teamIdがT001である
      expect(worker.teamId).toBe('T001');
      // jobTypeが作業員である
      expect(worker.jobType).toBe('作業員');
      // operatingStatusが稼働中である
      expect(worker.operatingStatus).toBe('稼働中');
      // hourlyRateが1200以上1800以下である
      if (worker.hourlyRate !== undefined) {
        expect(worker.hourlyRate).toBeGreaterThanOrEqual(1200);
        expect(worker.hourlyRate).toBeLessThanOrEqual(1800);
      }
    });

    // (2) totalCountに検索条件に合致した作業者の総件数が格納される
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    // (3) pageNumberに1が格納される
    expect(result.pageNumber).toBe(1);

    // (4) pageSizeに10が格納される
    expect(result.pageSize).toBe(10);

    // (5) retrievedAtにISO 8601形式の現在日時が格納される
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
    expect(result.retrievedAt).toMatch(isoDateRegex);

    // workers配列が得られた場合、sortBy='workerName'でASC順になっていることを確認
    if (result.workers.length > 1) {
      for (let i = 0; i < result.workers.length - 1; i++) {
        expect(result.workers[i].workerName.localeCompare(result.workers[i + 1].workerName))
          .toBeLessThanOrEqual(0);
      }
    }

    // GetWorkerByIdOutput構造の確認（必須フィールド）
    result.workers.forEach((worker: GetWorkerByIdOutput) => {
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
      expect(worker.updatedAt).toBeDefined();
      expect(typeof worker.updatedAt).toBe('string');
      expect(worker.createdBy).toBeDefined();
      expect(typeof worker.createdBy).toBe('string');
    });
  });
});