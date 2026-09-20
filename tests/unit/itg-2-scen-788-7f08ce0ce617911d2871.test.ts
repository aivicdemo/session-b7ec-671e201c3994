import { synchronizeDataWithWESAndWMS } from '../../src/logic/notification-and-integration';

describe('SCEN-788: WMS単一システムへのPUSH同期', () => {
  it('WMS単一システムへのPUSH同期リクエストが正常に完了し、システムから外部システムへのデータ送信が成功する', async () => {
    const input = {
      targetSystems: ['WMS'] as const,
      dataItemsToSync: ['productivity-data'],
      syncStartTimestamp: '2024-01-01T00:00:00Z',
      syncEndTimestamp: '2024-01-01T23:59:59Z',
      syncDirection: 'PUSH' as const,
      requestedBy: 'user-123',
    };

    const result = await synchronizeDataWithWESAndWMS(input);

    expect(result.success).toBe(true);

    expect(result.systemSyncResults).toHaveLength(1);
    expect(result.systemSyncResults[0].systemName).toBe('WMS');
    expect(result.systemSyncResults[0].syncSuccess).toBe(true);

    expect(result.dataItemsSyncStatus).toContainEqual(
      expect.objectContaining({
        dataItemId: 'productivity-data',
        syncStatus: 'SUCCESS',
      })
    );

    expect(result.totalRecordsSynced).toBeGreaterThanOrEqual(1);

    expect(result.totalRecordsFailed).toBe(0);

    expect(result.syncTrackingId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    const startTime = new Date(result.syncStartedAt).getTime();
    const endTime = new Date(result.syncCompletedAt).getTime();
    expect(startTime).toBeGreaterThan(0);
    expect(endTime).toBeGreaterThanOrEqual(startTime);

    expect(result.errorMessage).toBeNull();

    expect(result.retryQueuedItems).toBe(0);
  });
});