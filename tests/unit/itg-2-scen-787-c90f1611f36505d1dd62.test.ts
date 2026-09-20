import { synchronizeDataWithWESAndWMS } from '../../src/logic/notification-and-integration';

describe('SCEN-787: WES単一システムへのPULL同期リクエストが正常に完了し、外部システムからのデータ取得が成功する', () => {
  it('WES外部システムへのPULL同期が成功し、取得レコード数と同期完了データアイテムが正しく返される', async () => {
    const input = {
      targetSystems: ['WES'] as const,
      dataItemsToSync: ['progress_data', 'productivity_data'],
      syncStartTimestamp: '2024-01-01T00:00:00Z',
      syncEndTimestamp: '2024-01-01T23:59:59Z',
      syncDirection: 'PULL' as const,
      requestedBy: 'user_001',
      timeoutSeconds: 300,
    };

    const result = await synchronizeDataWithWESAndWMS(input);

    expect(result.success).toBe(true);
    expect(result.systemSyncResults).toHaveLength(1);
    expect(result.systemSyncResults[0].systemName).toBe('WES');
    expect(result.systemSyncResults[0].syncSuccess).toBe(true);
    expect(result.systemSyncResults[0].recordsReceived).toBe(100);
    expect(result.dataItemsSyncStatus).toHaveLength(2);
    expect(result.dataItemsSyncStatus).toContainEqual(
      expect.objectContaining({
        dataItemId: 'progress_data',
        syncStatus: 'SUCCESS',
      })
    );
    expect(result.dataItemsSyncStatus).toContainEqual(
      expect.objectContaining({
        dataItemId: 'productivity_data',
        syncStatus: 'SUCCESS',
      })
    );
    expect(result.totalRecordsSynced).toBe(100);
    expect(result.totalRecordsFailed).toBe(0);
    expect(result.retryQueuedItems).toBe(0);
    expect(result.syncDurationSeconds).toBeGreaterThan(0);
    expect(result.syncDurationSeconds).toBeLessThanOrEqual(300);
    expect(result.errorMessage).toBeNull();
    expect(result.warningMessages).toBeDefined();
    expect(Array.isArray(result.warningMessages)).toBe(true);
  });
});