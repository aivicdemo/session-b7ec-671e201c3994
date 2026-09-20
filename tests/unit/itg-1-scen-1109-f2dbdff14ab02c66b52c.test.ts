import { saveWmsSyncLog } from '../../src/logic/data-persistence';

describe('SCEN-1109: WMS連携ログの更新時に更新者ユーザーIDが記録される', () => {
  it('更新時に更新者ユーザーIDが指定される場合、そのユーザーIDが記録される', async () => {
    // Arrange
    const existingLogId = 'log-12345';
    const updateByUserId = 'user-0002';

    const input = {
      wmsSyncLogId: existingLogId,
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND',
      facilityId: 'facility-001',
      syncStatus: 'SUCCESS',
      syncStartDateTime: '2025-01-15T09:00:00Z',
      syncCompletedDateTime: '2025-01-15T09:05:00Z',
      processedItemCount: 100,
      successItemCount: 100,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: null,
      wmsRequestId: 'req-9999',
      createdBy: 'user-0001',
      updatedBy: updateByUserId,
    };

    // Act
    const result = await saveWmsSyncLog(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.wmsSyncLogId).toBe(existingLogId);
    expect(result.syncType).toBe('進捗データ取得');
    expect(result.syncDirection).toBe('INBOUND');
    expect(result.facilityId).toBe('facility-001');
    expect(result.syncStatus).toBe('SUCCESS');
    expect(result.processedItemCount).toBe(100);
    expect(result.successItemCount).toBe(100);
    expect(result.failureItemCount).toBe(0);
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    expect(result.isNewRecord).toBe(false);
  });
});