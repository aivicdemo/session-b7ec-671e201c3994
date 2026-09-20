import { saveWmsSyncLog, getWmsSyncLogById } from '../../src/logic/data-persistence';

describe('SCEN-1106: WMS連携ログ保存時のリトライ回数デフォルト値処理', () => {
  it('リトライ回数がnullの場合、デフォルト値 0 として保存される', async () => {
    const input = {
      wmsSyncLogId: null as any,
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND',
      facilityId: 'FAC001',
      syncStatus: 'SUCCESS',
      syncStartDateTime: '2024-01-15T09:00:00Z',
      syncCompletedDateTime: '2024-01-15T09:05:00Z',
      processedItemCount: 100,
      successItemCount: 100,
      failureItemCount: 0,
      errorMessage: null,
      retryCount: null,
      wmsRequestId: 'REQ12345',
      createdBy: 'USER001',
      updatedBy: null,
    };

    const result = await saveWmsSyncLog(input);

    expect(result.wmsSyncLogId).toBeDefined();
    expect(result.wmsSyncLogId).not.toEqual('');
    expect(result.isNewRecord).toBe(true);
    expect(result.syncType).toBe('進捗データ取得');
    expect(result.syncDirection).toBe('INBOUND');
    expect(result.facilityId).toBe('FAC001');
    expect(result.syncStatus).toBe('SUCCESS');
    expect(result.processedItemCount).toBe(100);
    expect(result.successItemCount).toBe(100);
    expect(result.failureItemCount).toBe(0);

    const savedAtDate = new Date(result.savedAt);
    const now = new Date();
    const timeDiffMs = Math.abs(now.getTime() - savedAtDate.getTime());
    expect(timeDiffMs).toBeLessThan(5000);

    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.savedAt)).toBe(true);

    // 保存されたWMS連携ログデータベースレコードを直接参照してretryCountの値を検証
    const savedRecord = await getWmsSyncLogById({
      wmsSyncLogId: result.wmsSyncLogId,
    });

    expect(savedRecord.retryCount).toBe(0);
  });
});