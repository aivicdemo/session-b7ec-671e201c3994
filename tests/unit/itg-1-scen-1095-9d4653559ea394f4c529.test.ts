import { saveWmsSyncLog } from '../../src/logic/data-persistence';

describe('SCEN-1095: WMS連携ログを新規作成する', () => {
  it('新規作成対象として必須フィールドが揃っていると、新規レコードとして保存され isNewRecord=true が返される', async () => {
    const input = {
      wmsSyncLogId: null,
      syncType: '進捗データ取得',
      syncDirection: 'INBOUND',
      facilityId: 'FAC-001',
      syncStatus: 'SUCCESS',
      syncStartDateTime: '2024-01-15T09:00:00Z',
      processedItemCount: 100,
      successItemCount: 95,
      failureItemCount: 5,
      createdBy: 'USER-123',
      syncCompletedDateTime: '2024-01-15T09:15:30Z',
      errorMessage: null,
      retryCount: 0,
      wmsRequestId: 'REQ-XYZ789',
      updatedBy: null,
    };

    const result = await saveWmsSyncLog(input);

    expect(result.wmsSyncLogId).toBeDefined();
    expect(result.wmsSyncLogId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.syncType).toBe('進捗データ取得');
    expect(result.syncDirection).toBe('INBOUND');
    expect(result.facilityId).toBe('FAC-001');
    expect(result.syncStatus).toBe('SUCCESS');
    expect(result.processedItemCount).toBe(100);
    expect(result.successItemCount).toBe(95);
    expect(result.failureItemCount).toBe(5);
    expect(result.savedAt).toBeDefined();
    const savedAtDate = new Date(result.savedAt);
    expect(savedAtDate.getTime()).toBeGreaterThanOrEqual(new Date('2024-01-15T09:00:00Z').getTime() - 60000);
    expect(savedAtDate.getTime()).toBeLessThanOrEqual(Date.now() + 60000);
    expect(result.isNewRecord).toBe(true);
  });
});