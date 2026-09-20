import { synchronizeDataWithWESAndWMS } from '../../src/logic/notification-and-integration';
import type {
  SynchronizeDataWithWESAndWMSInput,
  SynchronizeDataWithWESAndWMSOutput,
} from '../../src/logic/notification-and-integration';

describe('SCEN-790: WES・WMS連携のタイムアウト秒数指定', () => {
  it('タイムアウト秒数が既定値300秒より小さい値で指定されて正常に同期が完了し、指定されたタイムアウト値が適用される', async () => {
    const input: SynchronizeDataWithWESAndWMSInput = {
      targetSystems: ['WES', 'WMS'],
      dataItemsToSync: ['progress_data', 'productivity_data'],
      syncStartTimestamp: '2024-01-01T00:00:00Z',
      syncEndTimestamp: '2024-01-01T01:00:00Z',
      syncDirection: 'BIDIRECTIONAL',
      timeoutSeconds: 150,
      requestedBy: 'user_001',
      correlationId: 'corr_790',
    };

    const startTime = Date.now();
    const result = await synchronizeDataWithWESAndWMS(input);
    const endTime = Date.now();
    const executionTimeSeconds = (endTime - startTime) / 1000;

    // success フラグの検証
    expect(result.success).toBe(true);

    // syncTrackingId は UUID形式
    expect(result.syncTrackingId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // タイムスタンプの検証
    expect(result.syncStartedAt).toBe('2024-01-01T00:00:00Z');
    const completedAt = new Date(result.syncCompletedAt);
    const startedAt = new Date(result.syncStartedAt);
    expect(completedAt.getTime()).toBeGreaterThanOrEqual(startedAt.getTime());

    // systemSyncResults の検証
    expect(result.systemSyncResults).toHaveLength(2);

    const wesSyncResult = result.systemSyncResults.find(
      (r) => r.systemName === 'WES'
    );
    expect(wesSyncResult).toBeDefined();
    expect(wesSyncResult!.syncSuccess).toBe(true);
    expect(wesSyncResult!.recordsReceived).toBe(150);
    expect(wesSyncResult!.recordsTransmitted).toBe(150);
    expect(wesSyncResult!.recordsProcessed).toBe(150);
    expect(wesSyncResult!.errorCount).toBe(0);

    const wmsSyncResult = result.systemSyncResults.find(
      (r) => r.systemName === 'WMS'
    );
    expect(wmsSyncResult).toBeDefined();
    expect(wmsSyncResult!.syncSuccess).toBe(true);
    expect(wmsSyncResult!.recordsReceived).toBe(150);
    expect(wmsSyncResult!.recordsTransmitted).toBe(150);
    expect(wmsSyncResult!.recordsProcessed).toBe(150);
    expect(wmsSyncResult!.errorCount).toBe(0);

    // dataItemsSyncStatus の検証
    expect(result.dataItemsSyncStatus).toHaveLength(2);

    const progressSyncStatus = result.dataItemsSyncStatus.find(
      (s) => s.dataItemId === 'progress_data'
    );
    expect(progressSyncStatus).toBeDefined();
    expect(progressSyncStatus!.syncStatus).toBe('SUCCESS');
    expect(progressSyncStatus!.recordsFailed).toBe(0);

    const productivitySyncStatus = result.dataItemsSyncStatus.find(
      (s) => s.dataItemId === 'productivity_data'
    );
    expect(productivitySyncStatus).toBeDefined();
    expect(productivitySyncStatus!.syncStatus).toBe('SUCCESS');
    expect(productivitySyncStatus!.recordsFailed).toBe(0);

    // 同期件数の検証
    expect(result.totalRecordsSynced).toBe(300);
    expect(result.totalRecordsFailed).toBe(0);
    expect(result.retryQueuedItems).toBe(0);

    // 実行時間がタイムアウト値以内であることを検証
    expect(executionTimeSeconds).toBeLessThanOrEqual(150);
    expect(result.syncDurationSeconds).toBeLessThanOrEqual(150);

    // エラーメッセージなし
    expect(result.errorMessage).toBeNull();

    // 警告メッセージは空配列
    expect(result.warningMessages).toEqual([]);
  });
});