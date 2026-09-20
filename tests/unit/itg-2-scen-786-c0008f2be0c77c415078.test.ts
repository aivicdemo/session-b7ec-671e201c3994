import { synchronizeDataWithWESAndWMS } from '../../src/logic/notification-and-integration';

describe('SCEN-786: WES・WMS連携の部分失敗時のPartialSyncFailureError', () => {
  it('複数の同期対象のうち一部が失敗してPartialSyncFailureErrorが発生し、成功項目は反映されて失敗項目はリトライキューに登録される', async () => {
    const syncStartTime = new Date().toISOString();
    const syncEndTime = new Date(Date.now() + 60000).toISOString();

    const input = {
      targetSystems: ['WES', 'WMS'] as const,
      dataItemsToSync: ['progress_data', 'productivity_data', 'allocation_plan'],
      syncStartTimestamp: syncStartTime,
      syncEndTimestamp: syncEndTime,
      syncDirection: 'BIDIRECTIONAL' as const,
      retryPolicy: {
        maxRetries: 3,
        retryIntervalSeconds: 5,
        backoffMultiplier: 2,
      },
      timeoutSeconds: 300,
      requestedBy: 'user123',
      correlationId: 'corr-123',
    };

    const result = await synchronizeDataWithWESAndWMS(input);

    // (1) successはfalse（一部失敗のため全体成功ではない）
    expect(result.success).toBe(false);

    // (2) systemSyncResultsには、WESの結果にはsuccess=true、WMSの結果にはsuccess=falseが含まれる
    expect(result.systemSyncResults).toBeDefined();
    expect(result.systemSyncResults.length).toBeGreaterThan(0);
    
    const wesResult = result.systemSyncResults.find(r => r.systemName === 'WES');
    const wmsResult = result.systemSyncResults.find(r => r.systemName === 'WMS');
    
    expect(wesResult).toBeDefined();
    expect(wesResult?.syncSuccess).toBe(true);
    
    expect(wmsResult).toBeDefined();
    expect(wmsResult?.syncSuccess).toBe(false);

    // (3) dataItemsSyncStatusには、progress_dataはstatus='SUCCESS'、productivity_dataはstatus='FAILED'、allocation_planはstatus='SUCCESS'が含まれる
    expect(result.dataItemsSyncStatus).toBeDefined();
    expect(result.dataItemsSyncStatus.length).toBeGreaterThanOrEqual(3);
    
    const progressItem = result.dataItemsSyncStatus.find(item => item.dataItemId === 'progress_data');
    const productivityItem = result.dataItemsSyncStatus.find(item => item.dataItemId === 'productivity_data');
    const allocationItem = result.dataItemsSyncStatus.find(item => item.dataItemId === 'allocation_plan');
    
    expect(progressItem).toBeDefined();
    expect(progressItem?.syncStatus).toBe('SUCCESS');
    
    expect(productivityItem).toBeDefined();
    expect(productivityItem?.syncStatus).toBe('FAILURE');
    
    expect(allocationItem).toBeDefined();
    expect(allocationItem?.syncStatus).toBe('SUCCESS');

    // (4) totalRecordsFailedは0より大きい値
    expect(result.totalRecordsFailed).toBeGreaterThan(0);

    // (5) retryQueuedItemsは1以上の値（失敗した生産性データがリトライキューに登録されている）
    expect(result.retryQueuedItems).toBeGreaterThanOrEqual(1);

    // (6) errorMessageはnullではなくPartialSyncFailureErrorの文言を含む
    expect(result.errorMessage).toBeDefined();
    expect(result.errorMessage).not.toBeNull();
    expect(result.errorMessage).toContain('一部のデータ同期に失敗しました');
    expect(result.errorMessage).toContain('成功した項目は反映され');
    expect(result.errorMessage).toContain('失敗項目は再試行キューに登録されます');

    // (7) warningMessagesに同期中の警告情報が含まれる
    expect(result.warningMessages).toBeDefined();
    expect(Array.isArray(result.warningMessages)).toBe(true);
    if (result.warningMessages && result.warningMessages.length > 0) {
      expect(result.warningMessages[0]).toBeTruthy();
    }

    // (8) syncTrackingIdは追跡可能な値が格納される
    expect(result.syncTrackingId).toBeDefined();
    expect(typeof result.syncTrackingId).toBe('string');
    expect(result.syncTrackingId.length).toBeGreaterThan(0);

    // 同期開始・完了時刻が正しい形式
    expect(result.syncStartedAt).toBeDefined();
    expect(result.syncCompletedAt).toBeDefined();
    expect(typeof result.syncStartedAt).toBe('string');
    expect(typeof result.syncCompletedAt).toBe('string');

    // 実行時間が計測されている
    expect(result.syncDurationSeconds).toBeGreaterThanOrEqual(0);
  });
});