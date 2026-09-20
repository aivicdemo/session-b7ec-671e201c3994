import { synchronizeDataWithWESAndWMS } from '../../src/logic/notification-and-integration';

describe('SCEN-792: synchronizeDataWithWESAndWMS - correlationId自動生成', () => {
  it('correlationIdが指定されずに同期リクエストされても、システムが一意の追跡IDを生成して正常に完了する', async () => {
    // Arrange
    const input = {
      targetSystems: ['WES', 'WMS'] as const,
      dataItemsToSync: ['productivity-001', 'placement-001'],
      syncStartTimestamp: '2024-01-01T00:00:00Z',
      syncEndTimestamp: '2024-01-01T23:59:59Z',
      syncDirection: 'BIDIRECTIONAL' as const,
      requestedBy: 'system-scheduler',
      timeoutSeconds: 300,
    };

    // Act
    const result = await synchronizeDataWithWESAndWMS(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.syncTrackingId).toBeDefined();
    expect(result.syncTrackingId).not.toBe('');
    expect(result.syncStartedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.syncCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(Array.isArray(result.systemSyncResults)).toBe(true);
    expect(result.systemSyncResults.length).toBeGreaterThanOrEqual(0);
    result.systemSyncResults.forEach((systemResult) => {
      expect(['WES', 'WMS']).toContain(systemResult.systemName);
      expect(typeof systemResult.syncSuccess).toBe('boolean');
      expect(typeof systemResult.recordsReceived).toBe('number');
      expect(typeof systemResult.recordsTransmitted).toBe('number');
      expect(typeof systemResult.recordsProcessed).toBe('number');
      expect(typeof systemResult.errorCount).toBe('number');
      expect(systemResult.lastSyncTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });
    expect(Array.isArray(result.dataItemsSyncStatus)).toBe(true);
    result.dataItemsSyncStatus.forEach((itemStatus) => {
      expect(typeof itemStatus.dataItemId).toBe('string');
      expect(typeof itemStatus.dataItemName).toBe('string');
      expect(['SUCCESS', 'FAILURE', 'PARTIAL_SUCCESS', 'SKIPPED']).toContain(itemStatus.syncStatus);
      expect(typeof itemStatus.recordsProcessed).toBe('number');
      expect(typeof itemStatus.recordsFailed).toBe('number');
    });
    expect(typeof result.totalRecordsSynced).toBe('number');
    expect(result.totalRecordsSynced).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalRecordsFailed).toBe('number');
    expect(typeof result.retryQueuedItems).toBe('number');
    expect(typeof result.syncDurationSeconds).toBe('number');
    expect(result.errorMessage).toBeNull();
  });
});