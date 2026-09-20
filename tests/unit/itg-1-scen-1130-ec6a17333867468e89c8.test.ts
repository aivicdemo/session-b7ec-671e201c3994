import { listWmsSyncLogByCondition, ListWmsSyncLogByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-1130: WMS連携ログの処理件数範囲指定検索', () => {
  it('処理件数の範囲指定時に、最小値以上かつ最大値以下のレコードが返される', async () => {
    // テスト用のWMS連携ログレコード群をデータベースに事前作成
    const testRecords = [
      {
        wmsSyncLogId: 'wms-log-005',
        syncType: 'progress_data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'fac-001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-15T09:00:00Z',
        syncCompletedDateTime: '2024-01-15T09:01:00Z',
        processedItemCount: 5,
        successItemCount: 5,
        failureItemCount: 0,
        retryCount: 0,
      },
      {
        wmsSyncLogId: 'wms-log-010',
        syncType: 'progress_data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'fac-001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-15T09:05:00Z',
        syncCompletedDateTime: '2024-01-15T09:06:00Z',
        processedItemCount: 10,
        successItemCount: 10,
        failureItemCount: 0,
        retryCount: 0,
      },
      {
        wmsSyncLogId: 'wms-log-015',
        syncType: 'progress_data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'fac-001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-15T09:10:00Z',
        syncCompletedDateTime: '2024-01-15T09:11:00Z',
        processedItemCount: 15,
        successItemCount: 15,
        failureItemCount: 0,
        retryCount: 0,
      },
      {
        wmsSyncLogId: 'wms-log-020',
        syncType: 'progress_data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'fac-001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-15T09:15:00Z',
        syncCompletedDateTime: '2024-01-15T09:16:00Z',
        processedItemCount: 20,
        successItemCount: 20,
        failureItemCount: 0,
        retryCount: 0,
      },
      {
        wmsSyncLogId: 'wms-log-025',
        syncType: 'progress_data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'fac-001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-15T09:20:00Z',
        syncCompletedDateTime: '2024-01-15T09:21:00Z',
        processedItemCount: 25,
        successItemCount: 25,
        failureItemCount: 0,
        retryCount: 0,
      },
      {
        wmsSyncLogId: 'wms-log-030',
        syncType: 'progress_data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'fac-001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2024-01-15T09:25:00Z',
        syncCompletedDateTime: '2024-01-15T09:26:00Z',
        processedItemCount: 30,
        successItemCount: 30,
        failureItemCount: 0,
        retryCount: 0,
      },
    ];

    // テストレコードをデータベースに保存する（前提データの準備）
    for (const record of testRecords) {
      await (global as any).__testDataPersistence?.insertWmsSyncLog?.(record);
    }

    const input: ListWmsSyncLogByConditionInput = {
      minProcessedItemCount: 10,
      maxProcessedItemCount: 20,
      wmsSyncLogIds: undefined,
      syncTypes: undefined,
      syncDirections: undefined,
      facilityIds: undefined,
      syncStatuses: undefined,
      syncStartFromDateTime: undefined,
      syncStartToDateTime: undefined,
      syncCompletedFromDateTime: undefined,
      syncCompletedToDateTime: undefined,
      maxRetryCount: undefined,
      minRetryCount: undefined,
      wmsRequestIds: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await listWmsSyncLogByCondition(input);

    // wmsSyncLogs配列内の全レコードを確認する
    expect(result.wmsSyncLogs).toBeDefined();
    expect(Array.isArray(result.wmsSyncLogs)).toBe(true);

    // 返却されるレコード数が3であることを確認
    expect(result.wmsSyncLogs.length).toBe(3);
    expect(result.totalCount).toBe(3);

    // 各レコードが範囲条件に合致することを検証する
    result.wmsSyncLogs.forEach((log) => {
      expect(log.processedItemCount).toBeGreaterThanOrEqual(10);
      expect(log.processedItemCount).toBeLessThanOrEqual(20);
    });

    // 含まれるレコードの処理件数が10、15、20のみであることを確認
    const processedItemCounts = result.wmsSyncLogs.map((log) => log.processedItemCount).sort((a, b) => a - b);
    expect(processedItemCounts).toEqual([10, 15, 20]);

    // 5件、25件、30件のレコードが含まれていないことを確認
    const excludedCounts = processedItemCounts.filter((count) => count === 5 || count === 25 || count === 30);
    expect(excludedCounts.length).toBe(0);

    // retrievedAtフィールドがISO 8601形式であることを確認
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/;
    expect(iso8601Regex.test(result.retrievedAt)).toBe(true);
  });
});