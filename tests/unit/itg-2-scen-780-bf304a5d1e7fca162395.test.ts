import { synchronizeDataWithWESAndWMS } from '../../src/logic/notification-and-integration';

describe('SCEN-780: WES・WMS連携を実行し、外部システムとのデータ送受信結果と同期状態を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常な同期リクエストでWES・WMS両方と双方向同期が完了し、全レコードが正常に同期される', async () => {
    const input = {
      targetSystems: ['WES', 'WMS'] as const,
      dataItemsToSync: ['進捗データID', '生産性データID', '配置計画ID'],
      syncStartTimestamp: '2024-01-01T00:00:00Z',
      syncEndTimestamp: '2024-01-31T23:59:59Z',
      syncDirection: 'BIDIRECTIONAL' as const,
      retryPolicy: {
        maxRetries: 3,
        retryIntervalSeconds: 5,
        backoffMultiplier: 2,
      },
      timeoutSeconds: 300,
      requestedBy: 'USER-001',
      correlationId: 'CORR-TEST-780',
    };

    const startTime = Date.now();
    const result = await synchronizeDataWithWESAndWMS(input);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    expect(result.success).toBe(true);
    expect(result.systemSyncResults).toHaveLength(2);
    
    const wesSyncResult = result.systemSyncResults.find(r => r.systemName === 'WES');
    const wmsSyncResult = result.systemSyncResults.find(r => r.systemName === 'WMS');
    
    expect(wesSyncResult).toBeDefined();
    expect(wesSyncResult?.syncSuccess).toBe(true);
    expect(wesSyncResult?.recordsReceived).toBe(100);
    expect(wesSyncResult?.recordsTransmitted).toBe(100);
    expect(wesSyncResult?.recordsProcessed).toBe(100);
    expect(wesSyncResult?.errorCount).toBe(0);
    
    expect(wmsSyncResult).toBeDefined();
    expect(wmsSyncResult?.syncSuccess).toBe(true);
    expect(wmsSyncResult?.recordsReceived).toBe(150);
    expect(wmsSyncResult?.recordsTransmitted).toBe(150);
    expect(wmsSyncResult?.recordsProcessed).toBe(150);
    expect(wmsSyncResult?.errorCount).toBe(0);
    
    expect(result.dataItemsSyncStatus).toHaveLength(3);
    result.dataItemsSyncStatus.forEach(status => {
      expect(status.syncStatus).toBe('SUCCESS');
      expect(status.recordsFailed).toBe(0);
    });
    
    expect(result.totalRecordsSynced).toBe(250);
    expect(result.totalRecordsFailed).toBe(0);
    expect(result.dataInconsistenciesDetected).toHaveLength(0);
    expect(result.retryQueuedItems).toBe(0);
    expect(result.syncDurationSeconds).toBeLessThanOrEqual(60);
    expect(result.errorMessage).toBeNull();
    expect(result.warningMessages).toHaveLength(0);
    expect(typeof result.syncTrackingId).toBe('string');
    expect(result.syncTrackingId.length).toBeGreaterThan(0);
    expect(result.syncStartedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|(\+|-)\d{2}:\d{2})$/);
    expect(result.syncCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|(\+|-)\d{2}:\d{2})$/);
    expect(result.syncStartedAt).toBeLessThanOrEqual(result.syncCompletedAt);
  });
});