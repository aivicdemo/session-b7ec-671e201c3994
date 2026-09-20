import { synchronizeDataWithWESAndWMS } from '../../src/logic/notification-and-integration';

describe('SCEN-794: WES・WMS連携を実行し、外部システムとのデータ送受信結果と同期状態を返す', () => {
  it('requestedByにシステムIDが指定されてスケジュール実行されて正常に完了し、スケジュール実行ユーザーとして記録される', async () => {
    const input = {
      targetSystems: ['WES', 'WMS'] as const,
      dataItemsToSync: ['progress_data', 'productivity_data'],
      syncStartTimestamp: '2024-01-01T00:00:00Z',
      syncEndTimestamp: '2024-01-01T23:59:59Z',
      syncDirection: 'BIDIRECTIONAL' as const,
      retryPolicy: {
        maxRetries: 3,
        retryIntervalSeconds: 5,
        backoffMultiplier: 2,
      },
      timeoutSeconds: 300,
      requestedBy: 'SCHEDULER_SYSTEM_001',
      correlationId: 'CORR_20240101_001',
    };

    const result = await synchronizeDataWithWESAndWMS(input);

    expect(result.success).toBe(true);
    expect(result.syncTrackingId).toBeDefined();
    expect(typeof result.syncTrackingId).toBe('string');
    expect(result.syncTrackingId.length).toBeGreaterThan(0);

    expect(result.syncStartedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.syncCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    expect(result.systemSyncResults).toHaveLength(2);

    const wesResult = result.systemSyncResults.find(r => r.systemName === 'WES');
    const wmsResult = result.systemSyncResults.find(r => r.systemName === 'WMS');

    expect(wesResult).toBeDefined();
    expect(wesResult!.syncSuccess).toBe(true);
    expect(wesResult!.recordsReceived).toBe(75);
    expect(wesResult!.recordsTransmitted).toBe(75);
    expect(wesResult!.recordsProcessed).toBe(75);
    expect(wesResult!.errorCount).toBe(0);
    expect(wesResult!.errorDetails).toBeUndefined();

    expect(wmsResult).toBeDefined();
    expect(wmsResult!.syncSuccess).toBe(true);
    expect(wmsResult!.recordsReceived).toBe(75);
    expect(wmsResult!.recordsTransmitted).toBe(75);
    expect(wmsResult!.recordsProcessed).toBe(75);
    expect(wmsResult!.errorCount).toBe(0);
    expect(wmsResult!.errorDetails).toBeUndefined();

    expect(result.dataItemsSyncStatus).toHaveLength(2);

    const progressDataItem = result.dataItemsSyncStatus.find(
      item => item.dataItemId === 'progress_data'
    );
    const productivityDataItem = result.dataItemsSyncStatus.find(
      item => item.dataItemId === 'productivity_data'
    );

    expect(progressDataItem).toBeDefined();
    expect(progressDataItem!.syncStatus).toBe('SUCCESS');
    expect(progressDataItem!.recordsProcessed).toBe(75);
    expect(progressDataItem!.recordsFailed).toBe(0);
    expect(progressDataItem!.failureReason).toBeNull();

    expect(productivityDataItem).toBeDefined();
    expect(productivityDataItem!.syncStatus).toBe('SUCCESS');
    expect(productivityDataItem!.recordsProcessed).toBe(75);
    expect(productivityDataItem!.recordsFailed).toBe(0);
    expect(productivityDataItem!.failureReason).toBeNull();

    expect(result.totalRecordsSynced).toBe(150);
    expect(result.totalRecordsFailed).toBe(0);
    expect(result.retryQueuedItems).toBe(0);

    expect(result.syncDurationSeconds).toBeGreaterThan(0);
    expect(result.syncDurationSeconds).toBeLessThanOrEqual(300);

    expect(result.errorMessage).toBeNull();
    expect(result.warningMessages).toStrictEqual([]);
  });
});