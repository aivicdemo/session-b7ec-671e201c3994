import { listWmsSyncLogByCondition, SaveWmsSyncLogInput } from '../../src/logic/data-persistence';

describe('SCEN-1129: ISO 8601形式の日時が正しく解析され、指定範囲内のレコードが取得される', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // テストデータを準備する
    // ISO 8601形式の日時を含むWMS連携ログレコードを複数件投入
    const testDataToInsert: SaveWmsSyncLogInput[] = [
      {
        syncType: 'progress_data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'facility-001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-15T10:00:00Z',
        syncCompletedDateTime: '2024-01-15T10:30:00Z',
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        createdBy: 'test-user',
      },
      {
        syncType: 'progress_data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'facility-002',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-16T14:00:00Z',
        syncCompletedDateTime: '2024-01-16T14:45:00Z',
        processedItemCount: 150,
        successItemCount: 150,
        failureItemCount: 0,
        createdBy: 'test-user',
      },
      {
        syncType: 'progress_data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'facility-003',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-17T09:00:00Z',
        syncCompletedDateTime: '2024-01-17T09:15:00Z',
        processedItemCount: 200,
        successItemCount: 200,
        failureItemCount: 0,
        createdBy: 'test-user',
      },
      // 範囲外のレコード
      {
        syncType: 'progress_data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'facility-004',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-14T23:59:59Z',
        syncCompletedDateTime: '2024-01-15T00:00:30Z',
        processedItemCount: 50,
        successItemCount: 50,
        failureItemCount: 0,
        createdBy: 'test-user',
      },
      {
        syncType: 'progress_data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'facility-005',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-18T00:00:01Z',
        syncCompletedDateTime: '2024-01-18T00:15:00Z',
        processedItemCount: 75,
        successItemCount: 75,
        failureItemCount: 0,
        createdBy: 'test-user',
      },
    ];

    // 注: テストデータの実際の永続化は、実装時に対応するデータベース操作またはモック設定で行う
    // ここでは、入力データの準備を示す
  });

  test('指定された日時範囲内のWMS連携ログレコードのみが返される', async () => {
    const input = {
      syncStartFromDateTime: '2024-01-15T00:00:00Z',
      syncStartToDateTime: '2024-01-17T23:59:59Z',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWmsSyncLogByCondition(input);

    // 期待結果: 3件のレコードが返される
    expect(result.wmsSyncLogs).toHaveLength(3);

    // 返されたレコードのsyncStartDateTimeを確認
    const startTimes = result.wmsSyncLogs.map((log) => log.syncStartDateTime);
    expect(startTimes).toContain('2024-01-15T10:00:00Z');
    expect(startTimes).toContain('2024-01-16T14:00:00Z');
    expect(startTimes).toContain('2024-01-17T09:00:00Z');

    // 各レコードが指定範囲内にあることを確認
    result.wmsSyncLogs.forEach((log) => {
      const startDateTime = new Date(log.syncStartDateTime).getTime();
      const fromRange = new Date('2024-01-15T00:00:00Z').getTime();
      const toRange = new Date('2024-01-17T23:59:59Z').getTime();
      expect(startDateTime).toBeGreaterThanOrEqual(fromRange);
      expect(startDateTime).toBeLessThanOrEqual(toRange);
    });

    // totalCountが3であることを確認
    expect(result.totalCount).toBe(3);

    // ページネーション情報が正しいことを確認
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);

    // retrievedAtがISO 8601形式であることを確認
    expect(result.retrievedAt).toBeDefined();
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate.getTime()).toBeGreaterThan(0);
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);
  });

  test('ISO 8601形式の日時が正確に解析されること', async () => {
    const input = {
      syncStartFromDateTime: '2024-01-15T10:00:00Z',
      syncStartToDateTime: '2024-01-17T23:59:59Z',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWmsSyncLogByCondition(input);

    result.wmsSyncLogs.forEach((log) => {
      expect(log.syncStartDateTime).toBeDefined();

      // 日時が有効なタイムスタンプに解析されることを確認
      const startDateTime = new Date(log.syncStartDateTime).getTime();
      expect(startDateTime).toBeGreaterThan(0);

      // ISO 8601形式の検証
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      expect(log.syncStartDateTime).toMatch(iso8601Regex);
    });

    // ページネーション情報の検証
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
  });

  test('範囲外の日時は正しく除外されること', async () => {
    const input = {
      syncStartFromDateTime: '2024-01-15T00:00:00Z',
      syncStartToDateTime: '2024-01-17T23:59:59Z',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWmsSyncLogByCondition(input);

    // 各レコードが指定範囲内にあることを確認
    result.wmsSyncLogs.forEach((log) => {
      const startDateTime = new Date(log.syncStartDateTime).getTime();
      const fromRange = new Date('2024-01-15T00:00:00Z').getTime();
      const toRange = new Date('2024-01-17T23:59:59Z').getTime();
      expect(startDateTime).toBeGreaterThanOrEqual(fromRange);
      expect(startDateTime).toBeLessThanOrEqual(toRange);
    });

    // 範囲外のレコードが含まれていないことを確認
    const startTimes = result.wmsSyncLogs.map((log) => log.syncStartDateTime);
    expect(startTimes).not.toContain('2024-01-14T23:59:59Z');
    expect(startTimes).not.toContain('2024-01-18T00:00:01Z');
  });

  test('retrievedAtが現在日時を示すISO 8601形式の文字列であること', async () => {
    const input = {
      syncStartFromDateTime: '2024-01-15T00:00:00Z',
      syncStartToDateTime: '2024-01-17T23:59:59Z',
      pageNumber: 1,
      pageSize: 10,
    };

    const beforeCallTime = new Date();
    const result = await listWmsSyncLogByCondition(input);
    const afterCallTime = new Date();

    expect(result.retrievedAt).toBeDefined();

    // ISO 8601形式の検証
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);

    // 取得日時が関数実行時刻の前後であることを確認
    const retrievedDate = new Date(result.retrievedAt);
    expect(retrievedDate.getTime()).toBeGreaterThanOrEqual(beforeCallTime.getTime());
    expect(retrievedDate.getTime()).toBeLessThanOrEqual(afterCallTime.getTime() + 1000);
  });

  test('ページネーション情報が正しく返されること', async () => {
    const input = {
      syncStartFromDateTime: '2024-01-15T00:00:00Z',
      syncStartToDateTime: '2024-01-17T23:59:59Z',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWmsSyncLogByCondition(input);

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.totalCount).toBe(3);
  });
});