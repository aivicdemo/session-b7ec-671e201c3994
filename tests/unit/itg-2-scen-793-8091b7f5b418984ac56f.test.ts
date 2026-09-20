import { synchronizeDataWithWESAndWMS } from '../../src/logic/notification-and-integration';
import { SynchronizeDataWithWESAndWMSInput, SynchronizeDataWithWESAndWMSOutput } from '../../src/logic/notification-and-integration';

describe('synchronizeDataWithWESAndWMS - SCEN-793: Same Start and End Timestamp', () => {
  it('should complete successfully when syncStartTimestamp and syncEndTimestamp are identical', async () => {
    const sameTimestamp = '2024-01-15T10:30:00Z';
    
    const input: SynchronizeDataWithWESAndWMSInput = {
      targetSystems: ['WES', 'WMS'],
      dataItemsToSync: ['progress_data', 'productivity_data'],
      syncStartTimestamp: sameTimestamp,
      syncEndTimestamp: sameTimestamp,
      syncDirection: 'BIDIRECTIONAL',
      requestedBy: 'user_001',
    };

    const result: SynchronizeDataWithWESAndWMSOutput = await synchronizeDataWithWESAndWMS(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.syncTrackingId).toBeTruthy();
    expect(result.syncStartedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.syncCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    
    expect(result.systemSyncResults).toBeDefined();
    expect(Array.isArray(result.systemSyncResults)).toBe(true);
    expect(result.systemSyncResults.length).toBeGreaterThan(0);
    
    result.systemSyncResults.forEach((systemResult) => {
      expect(['WES', 'WMS']).toContain(systemResult.systemName);
      expect(typeof systemResult.syncSuccess).toBe('boolean');
      expect(typeof systemResult.recordsReceived).toBe('number');
      expect(systemResult.recordsReceived).toBeGreaterThanOrEqual(0);
      expect(typeof systemResult.recordsTransmitted).toBe('number');
      expect(systemResult.recordsTransmitted).toBeGreaterThanOrEqual(0);
      expect(typeof systemResult.recordsProcessed).toBe('number');
      expect(systemResult.recordsProcessed).toBeGreaterThanOrEqual(0);
      expect(typeof systemResult.errorCount).toBe('number');
      expect(systemResult.errorCount).toBeGreaterThanOrEqual(0);
    });

    expect(result.dataItemsSyncStatus).toBeDefined();
    expect(Array.isArray(result.dataItemsSyncStatus)).toBe(true);
    expect(result.dataItemsSyncStatus.length).toBeGreaterThan(0);

    result.dataItemsSyncStatus.forEach((itemStatus) => {
      expect(itemStatus.dataItemId).toBeTruthy();
      expect(itemStatus.dataItemName).toBeTruthy();
      expect(['SUCCESS', 'FAILURE', 'PARTIAL_SUCCESS', 'SKIPPED']).toContain(itemStatus.syncStatus);
      expect(typeof itemStatus.recordsProcessed).toBe('number');
      expect(itemStatus.recordsProcessed).toBeGreaterThanOrEqual(0);
      expect(typeof itemStatus.recordsFailed).toBe('number');
      expect(itemStatus.recordsFailed).toBeGreaterThanOrEqual(0);
    });

    expect(typeof result.totalRecordsSynced).toBe('number');
    expect(result.totalRecordsSynced).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalRecordsFailed).toBe('number');
    expect(result.totalRecordsFailed).toBeGreaterThanOrEqual(0);
    expect(typeof result.retryQueuedItems).toBe('number');
    expect(result.retryQueuedItems).toBeGreaterThanOrEqual(0);
    expect(typeof result.syncDurationSeconds).toBe('number');
    expect(result.syncDurationSeconds).toBeGreaterThanOrEqual(0);

    expect(result.errorMessage).toBeNull();
    expect(Array.isArray(result.warningMessages)).toBe(true);
    result.warningMessages?.forEach((warning) => {
      expect(typeof warning).toBe('string');
    });
  });
});