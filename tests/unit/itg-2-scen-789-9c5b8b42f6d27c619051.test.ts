import { synchronizeDataWithWESAndWMS } from '../../src/logic/notification-and-integration';

describe('SCEN-789: WES・WMS連携 - 同期対象データ項目がない状態での処理', () => {
  it('dataItemsToSyncが空配列の場合、有効な同期処理として完了し、totalRecordsSyncedが0で返される', async () => {
    const input = {
      targetSystems: ['WES', 'WMS'] as const,
      dataItemsToSync: [],
      syncStartTimestamp: '2024-01-01T00:00:00Z',
      syncEndTimestamp: '2024-01-01T23:59:59Z',
      syncDirection: 'BIDIRECTIONAL' as const,
      requestedBy: 'SYSTEM_SCHEDULER',
      timeoutSeconds: 300,
    };

    const result = await synchronizeDataWithWESAndWMS(input);

    expect(result.success).toBe(true);
    expect(result.syncTrackingId).toBeDefined();
    expect(typeof result.syncTrackingId).toBe('string');
    expect(result.syncTrackingId.length).toBeGreaterThan(0);

    expect(result.syncStartedAt).toBeDefined();
    expect(result.syncCompletedAt).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(result.syncStartedAt)).toBe(true);
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(result.syncCompletedAt)).toBe(true);

    expect(Array.isArray(result.systemSyncResults)).toBe(true);
    expect(result.systemSyncResults.length).toBeGreaterThanOrEqual(2);

    const wesSyncResult = result.systemSyncResults.find(r => r.systemName === 'WES');
    const wmsSyncResult = result.systemSyncResults.find(r => r.systemName === 'WMS');

    expect(wesSyncResult).toBeDefined();
    expect(wmsSyncResult).toBeDefined();
    expect(wesSyncResult!.syncSuccess).toBe(true);
    expect(wmsSyncResult!.syncSuccess).toBe(true);

    expect(Array.isArray(result.dataItemsSyncStatus)).toBe(true);
    expect(result.dataItemsSyncStatus.length).toBe(0);

    expect(result.totalRecordsSynced).toBe(0);
    expect(result.totalRecordsFailed).toBe(0);
    expect(result.retryQueuedItems).toBe(0);

    expect(typeof result.syncDurationSeconds).toBe('number');
    expect(result.syncDurationSeconds).toBeGreaterThan(0);

    expect(result.errorMessage).toBeNull();

    expect(Array.isArray(result.warningMessages)).toBe(true);
    expect(result.warningMessages.length).toBe(0);
  });
});