import { synchronizeDataWithWESAndWMS } from '../../src/logic/notification-and-integration';

describe('SCEN-791: リトライポリシーが指定されずに同期リクエストされても、デフォルトのリトライポリシーが適用されて正常に完了する', () => {
  it('should apply default retry policy when retryPolicy is not specified', async () => {
    const input = {
      targetSystems: ['WES', 'WMS'] as const,
      dataItemsToSync: ['progress', 'productivity'],
      syncStartTimestamp: '2024-01-01T00:00:00Z',
      syncEndTimestamp: '2024-01-01T23:59:59Z',
      syncDirection: 'BIDIRECTIONAL' as const,
      timeoutSeconds: 300,
      requestedBy: 'USER001',
      correlationId: 'corr-12345',
      retryPolicy: undefined,
    };

    const result = await synchronizeDataWithWESAndWMS(input);

    expect(result.success).toBe(true);
    expect(result.syncTrackingId).toBeDefined();
    expect(result.syncTrackingId).not.toBe('');
    expect(result.systemSyncResults).toHaveLength(2);
    expect(result.systemSyncResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          systemName: 'WES',
          syncSuccess: true,
        }),
        expect.objectContaining({
          systemName: 'WMS',
          syncSuccess: true,
        }),
      ])
    );
    expect(result.totalRecordsFailed).toBe(0);
    expect(result.retryQueuedItems).toBe(0);
    expect(result.syncDurationSeconds).toBeGreaterThan(0);
    expect(result.syncDurationSeconds).toBeLessThanOrEqual(300);
    expect(result.errorMessage).toBeNull();
  });
});