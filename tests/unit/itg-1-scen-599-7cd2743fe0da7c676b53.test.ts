import { listWorkersByCondition } from '../../src/logic/data-persistence';

describe('SCEN-599: 検索条件なし（全件取得）で作業者一覧が正常に返される', () => {
  it('should return all workers from master data when all search conditions are null/undefined', async () => {
    // Arrange: 検索条件をすべてnull/undefinedで初期化
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

    // Act: listWorkersByCondition関数を実行
    const result = await listWorkersByCondition(input);

    // Assert: 戻り値のフィールド存在確認
    expect(result).toBeDefined();
    expect(result).toHaveProperty('workers');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('pageNumber');
    expect(result).toHaveProperty('pageSize');
    expect(result).toHaveProperty('retrievedAt');

    // Assert: workers配列の型確認
    expect(Array.isArray(result.workers)).toBe(true);

    // Assert: totalCountはnumber型で0以上
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    // Assert: workers配列の件数とtotalCountが一致
    if (result.pageNumber === null || result.pageSize === null) {
      // ページングなしの場合、workers配列の件数がtotalCountと一致
      expect(result.workers.length).toBe(result.totalCount);
    }

    // Assert: workers配列内の各要素がGetWorkerByIdOutput型を持つ
    result.workers.forEach((worker) => {
      expect(worker).toHaveProperty('workerId');
      expect(worker).toHaveProperty('workerName');
      expect(worker).toHaveProperty('facilityId');
      expect(worker).toHaveProperty('teamId');
      expect(worker).toHaveProperty('jobType');
      expect(worker).toHaveProperty('operatingStatus');
      expect(worker).toHaveProperty('createdAt');
      expect(worker).toHaveProperty('updatedAt');
      expect(worker).toHaveProperty('createdBy');

      // 型チェック
      expect(typeof worker.workerId).toBe('string');
      expect(typeof worker.workerName).toBe('string');
      expect(typeof worker.facilityId).toBe('string');
      expect(typeof worker.teamId).toBe('string');
      expect(typeof worker.jobType).toBe('string');
      expect(typeof worker.operatingStatus).toBe('string');
      expect(typeof worker.createdAt).toBe('string');
      expect(typeof worker.updatedAt).toBe('string');
      expect(typeof worker.createdBy).toBe('string');
    });

    // Assert: retrievedAtがISO 8601形式の日時文字列
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.getTime()).not.toBeNaN();
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Assert: 実行時刻から数秒以内であることを確認（±10秒の許容範囲）
    const now = Date.now();
    const retrievedTime = retrievedAtDate.getTime();
    expect(Math.abs(now - retrievedTime)).toBeLessThan(10000);

    // Assert: pageNumber, pageSizeの確認
    // ページング指定がない場合、nullまたはデフォルト値
    if (result.pageNumber !== null) {
      expect(typeof result.pageNumber).toBe('number');
      expect(result.pageNumber).toBeGreaterThanOrEqual(1);
    }
    if (result.pageSize !== null) {
      expect(typeof result.pageSize).toBe('number');
      expect(result.pageSize).toBeGreaterThanOrEqual(1);
    }

    // Assert: エラーが発生していないことを確認（例外が投げられていない）
    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
  });

  it('should handle undefined values in input fields', async () => {
    // Arrange: すべてのフィールドをundefinedで初期化
    const input: any = {
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

    // Act
    const result = await listWorkersByCondition(input);

    // Assert: 正常に全件を返すこと
    expect(result).toBeDefined();
    expect(Array.isArray(result.workers)).toBe(true);
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
  });

  it('should return workers with all required fields populated', async () => {
    // Arrange
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

    // Act
    const result = await listWorkersByCondition(input);

    // Assert: 各作業者に必須フィールドが存在すること
    if (result.workers.length > 0) {
      const firstWorker = result.workers[0];

      expect(firstWorker.workerId).toBeTruthy();
      expect(firstWorker.workerName).toBeTruthy();
      expect(firstWorker.facilityId).toBeTruthy();
      expect(firstWorker.teamId).toBeTruthy();
      expect(firstWorker.jobType).toBeTruthy();
      expect(firstWorker.operatingStatus).toBeTruthy();
      expect(firstWorker.createdAt).toBeTruthy();
      expect(firstWorker.updatedAt).toBeTruthy();
      expect(firstWorker.createdBy).toBeTruthy();
    }
  });

  it('should return consistent retrievedAt timestamp format', async () => {
    // Arrange
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

    // Act
    const result = await listWorkersByCondition(input);

    // Assert: retrievedAtがISO 8601形式
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);
  });
});