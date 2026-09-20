import {
  listWmsSyncLogByCondition,
  ListWmsSyncLogByConditionInput,
  ListWmsSyncLogByConditionOutput,
  GetWmsSyncLogByIdOutput,
} from '../../src/logic/data-persistence';

describe('SCEN-1131: リトライ回数の範囲指定時にフィルタリングされたWMS連携ログが返される', () => {
  let mockDatabase: GetWmsSyncLogByIdOutput[];

  beforeEach(() => {
    // テストデータ: リトライ回数 0, 1, 2, 3, 4, 5 のレコードを各複数件用意
    mockDatabase = [
      // リトライ回数 0 (複数件)
      {
        wmsSyncLogId: 'log-001',
        syncType: 'progress_data_fetch',
        syncDirection: 'inbound',
        facilityId: 'fac-001',
        syncStatus: 'success',
        syncStartDateTime: '2024-01-15T09:00:00Z',
        syncCompletedDateTime: '2024-01-15T09:01:00Z',
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: 0,
        wmsRequestId: 'req-001',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:01:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        wmsSyncLogId: 'log-001-b',
        syncType: 'inventory_sync',
        syncDirection: 'inbound',
        facilityId: 'fac-002',
        syncStatus: 'success',
        syncStartDateTime: '2024-01-15T08:30:00Z',
        syncCompletedDateTime: '2024-01-15T08:31:00Z',
        processedItemCount: 80,
        successItemCount: 80,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: 0,
        wmsRequestId: 'req-001-b',
        createdAt: '2024-01-15T08:30:00Z',
        updatedAt: '2024-01-15T08:31:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      // リトライ回数 1 (複数件)
      {
        wmsSyncLogId: 'log-002',
        syncType: 'inventory_sync',
        syncDirection: 'inbound',
        facilityId: 'fac-001',
        syncStatus: 'success',
        syncStartDateTime: '2024-01-15T10:00:00Z',
        syncCompletedDateTime: '2024-01-15T10:02:00Z',
        processedItemCount: 50,
        successItemCount: 50,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: 1,
        wmsRequestId: 'req-002',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:02:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        wmsSyncLogId: 'log-002-b',
        syncType: 'work_instruction_delivery',
        syncDirection: 'outbound',
        facilityId: 'fac-003',
        syncStatus: 'success',
        syncStartDateTime: '2024-01-15T10:30:00Z',
        syncCompletedDateTime: '2024-01-15T10:31:30Z',
        processedItemCount: 45,
        successItemCount: 45,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: 1,
        wmsRequestId: 'req-002-b',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:31:30Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      // リトライ回数 2 (複数件)
      {
        wmsSyncLogId: 'log-003',
        syncType: 'work_instruction_delivery',
        syncDirection: 'outbound',
        facilityId: 'fac-002',
        syncStatus: 'success',
        syncStartDateTime: '2024-01-15T11:00:00Z',
        syncCompletedDateTime: '2024-01-15T11:01:30Z',
        processedItemCount: 30,
        successItemCount: 30,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: 2,
        wmsRequestId: 'req-003',
        createdAt: '2024-01-15T11:00:00Z',
        updatedAt: '2024-01-15T11:01:30Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        wmsSyncLogId: 'log-003-b',
        syncType: 'progress_data_fetch',
        syncDirection: 'inbound',
        facilityId: 'fac-003',
        syncStatus: 'partial_failure',
        syncStartDateTime: '2024-01-15T11:30:00Z',
        syncCompletedDateTime: '2024-01-15T11:32:00Z',
        processedItemCount: 80,
        successItemCount: 75,
        failureItemCount: 5,
        errorMessage: 'Partial sync failure',
        retryCount: 2,
        wmsRequestId: 'req-003-b',
        createdAt: '2024-01-15T11:30:00Z',
        updatedAt: '2024-01-15T11:32:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      // リトライ回数 3 (複数件)
      {
        wmsSyncLogId: 'log-004',
        syncType: 'inventory_sync',
        syncDirection: 'inbound',
        facilityId: 'fac-002',
        syncStatus: 'success',
        syncStartDateTime: '2024-01-15T12:00:00Z',
        syncCompletedDateTime: '2024-01-15T12:03:00Z',
        processedItemCount: 60,
        successItemCount: 60,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: 3,
        wmsRequestId: 'req-004',
        createdAt: '2024-01-15T12:00:00Z',
        updatedAt: '2024-01-15T12:03:00Z',
        createdBy: 'user-002',
        updatedBy: null,
      },
      {
        wmsSyncLogId: 'log-004-b',
        syncType: 'progress_data_fetch',
        syncDirection: 'inbound',
        facilityId: 'fac-001',
        syncStatus: 'failure',
        syncStartDateTime: '2024-01-15T12:15:00Z',
        syncCompletedDateTime: '2024-01-15T12:18:00Z',
        processedItemCount: 70,
        successItemCount: 65,
        failureItemCount: 5,
        errorMessage: 'Partial connection loss',
        retryCount: 3,
        wmsRequestId: 'req-004-b',
        createdAt: '2024-01-15T12:15:00Z',
        updatedAt: '2024-01-15T12:18:00Z',
        createdBy: 'user-002',
        updatedBy: null,
      },
      // リトライ回数 4 (複数件)
      {
        wmsSyncLogId: 'log-005',
        syncType: 'work_instruction_delivery',
        syncDirection: 'outbound',
        facilityId: 'fac-001',
        syncStatus: 'failure',
        syncStartDateTime: '2024-01-15T13:00:00Z',
        syncCompletedDateTime: '2024-01-15T13:04:00Z',
        processedItemCount: 40,
        successItemCount: 20,
        failureItemCount: 20,
        errorMessage: 'Connection timeout after 4 retries',
        retryCount: 4,
        wmsRequestId: 'req-005',
        createdAt: '2024-01-15T13:00:00Z',
        updatedAt: '2024-01-15T13:04:00Z',
        createdBy: 'user-002',
        updatedBy: 'user-003',
      },
      {
        wmsSyncLogId: 'log-005-b',
        syncType: 'inventory_sync',
        syncDirection: 'inbound',
        facilityId: 'fac-002',
        syncStatus: 'retry_pending',
        syncStartDateTime: '2024-01-15T13:20:00Z',
        syncCompletedDateTime: null,
        processedItemCount: 55,
        successItemCount: 35,
        failureItemCount: 20,
        errorMessage: 'Network timeout',
        retryCount: 4,
        wmsRequestId: 'req-005-b',
        createdAt: '2024-01-15T13:20:00Z',
        updatedAt: '2024-01-15T13:24:00Z',
        createdBy: 'user-002',
        updatedBy: null,
      },
      // リトライ回数 5 (複数件)
      {
        wmsSyncLogId: 'log-006',
        syncType: 'progress_data_fetch',
        syncDirection: 'inbound',
        facilityId: 'fac-003',
        syncStatus: 'failure',
        syncStartDateTime: '2024-01-15T14:00:00Z',
        syncCompletedDateTime: '2024-01-15T14:05:00Z',
        processedItemCount: 0,
        successItemCount: 0,
        failureItemCount: 100,
        errorMessage: 'Max retries exceeded',
        retryCount: 5,
        wmsRequestId: 'req-006',
        createdAt: '2024-01-15T14:00:00Z',
        updatedAt: '2024-01-15T14:05:00Z',
        createdBy: 'user-002',
        updatedBy: null,
      },
      {
        wmsSyncLogId: 'log-006-b',
        syncType: 'work_instruction_delivery',
        syncDirection: 'outbound',
        facilityId: 'fac-001',
        syncStatus: 'failure',
        syncStartDateTime: '2024-01-15T14:10:00Z',
        syncCompletedDateTime: '2024-01-15T14:15:00Z',
        processedItemCount: 0,
        successItemCount: 0,
        failureItemCount: 50,
        errorMessage: 'Max retries exceeded - unable to connect',
        retryCount: 5,
        wmsRequestId: 'req-006-b',
        createdAt: '2024-01-15T14:10:00Z',
        updatedAt: '2024-01-15T14:15:00Z',
        createdBy: 'user-003',
        updatedBy: null,
      },
    ];

    jest.resetAllMocks();
  });

  it('リトライ回数が2以上4以下のレコードのみを返す', async () => {
    // 入力条件: minRetryCount=2, maxRetryCount=4
    const input: ListWmsSyncLogByConditionInput = {
      minRetryCount: 2,
      maxRetryCount: 4,
    };

    // 実装の関数を直接呼び出す
    const result = await listWmsSyncLogByCondition(input);

    // 検証: wmsSyncLogsが返される
    expect(result).toBeDefined();
    expect(result.wmsSyncLogs).toBeInstanceOf(Array);

    // 検証: 返却されたレコードがすべて条件に合致している
    result.wmsSyncLogs.forEach(log => {
      expect(log.retryCount).toBeDefined();
      expect(log.retryCount).toBeGreaterThanOrEqual(2);
      expect(log.retryCount).toBeLessThanOrEqual(4);
    });

    // 検証: 条件に合致しないレコードが含まれていない
    const retryCountsInResult = result.wmsSyncLogs.map(log => log.retryCount);
    expect(retryCountsInResult).not.toContain(0);
    expect(retryCountsInResult).not.toContain(1);
    expect(retryCountsInResult).not.toContain(5);

    // 検証: totalCountが正確
    const expectedCount = mockDatabase.filter(
      log => log.retryCount !== null && log.retryCount >= 2 && log.retryCount <= 4
    ).length;
    expect(result.totalCount).toBe(expectedCount);

    // 検証: retrievedAtがISO 8601形式の日時
    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/
    );
  });

  it('リトライ回数2のレコードが複数件ある場合、すべてが返される', async () => {
    const input: ListWmsSyncLogByConditionInput = {
      minRetryCount: 2,
      maxRetryCount: 2,
    };

    const result = await listWmsSyncLogByCondition(input);

    // 検証: リトライ回数が2のレコードがすべて含まれている
    const expectedRetryCount2Logs = mockDatabase.filter(log => log.retryCount === 2);
    expect(result.wmsSyncLogs.length).toBe(expectedRetryCount2Logs.length);
    result.wmsSyncLogs.forEach(log => {
      expect(log.retryCount).toBe(2);
    });
  });

  it('範囲内にレコードがない場合、空配列が返される', async () => {
    const input: ListWmsSyncLogByConditionInput = {
      minRetryCount: 10,
      maxRetryCount: 15,
    };

    const result = await listWmsSyncLogByCondition(input);

    expect(result.wmsSyncLogs).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it('minRetryCountのみ指定した場合、その値以上のレコードが返される', async () => {
    const input: ListWmsSyncLogByConditionInput = {
      minRetryCount: 3,
    };

    const result = await listWmsSyncLogByCondition(input);

    result.wmsSyncLogs.forEach(log => {
      expect(log.retryCount).toBeGreaterThanOrEqual(3);
    });

    const expectedCount = mockDatabase.filter(
      log => log.retryCount !== null && log.retryCount >= 3
    ).length;
    expect(result.totalCount).toBe(expectedCount);
  });

  it('maxRetryCountのみ指定した場合、その値以下のレコードが返される', async () => {
    const input: ListWmsSyncLogByConditionInput = {
      maxRetryCount: 2,
    };

    const result = await listWmsSyncLogByCondition(input);

    result.wmsSyncLogs.forEach(log => {
      expect(log.retryCount).toBeLessThanOrEqual(2);
    });

    const expectedCount = mockDatabase.filter(
      log => log.retryCount !== null && log.retryCount <= 2
    ).length;
    expect(result.totalCount).toBe(expectedCount);
  });
});