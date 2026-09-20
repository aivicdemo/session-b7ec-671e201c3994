import { saveWmsSyncLog } from '../../src/logic/data-persistence';

describe('SCEN-1108: WMS連携ログデータ永続化', () => {
  describe('エラーメッセージがnullの場合でも、ログが正常に保存される', () => {
    it('errorMessageがnullで新規作成時に全フィールドが正常に保存される', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: '進捗データ取得',
        syncDirection: 'INBOUND',
        facilityId: 'FAC-001',
        syncStatus: 'FAILURE',
        syncStartDateTime: '2024-01-15T10:00:00Z',
        syncCompletedDateTime: '2024-01-15T10:05:00Z',
        processedItemCount: 100,
        successItemCount: 50,
        failureItemCount: 50,
        errorMessage: null,
        retryCount: null,
        wmsRequestId: 'REQ-12345',
        createdBy: 'USER-001',
        updatedBy: null,
      };

      const result = await saveWmsSyncLog(input);

      expect(result).toMatchObject({
        syncType: '進捗データ取得',
        syncDirection: 'INBOUND',
        facilityId: 'FAC-001',
        syncStatus: 'FAILURE',
        processedItemCount: 100,
        successItemCount: 50,
        failureItemCount: 50,
        isNewRecord: true,
      });

      expect(result.wmsSyncLogId).toBeDefined();
      expect(typeof result.wmsSyncLogId).toBe('string');
      expect(result.wmsSyncLogId.length).toBeGreaterThan(0);

      expect(result.savedAt).toBeDefined();
      expect(typeof result.savedAt).toBe('string');
      expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.savedAt)).toBe(true);
    });

    it('保存されたログが全ての必須フィールドを含む', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: '進捗データ取得',
        syncDirection: 'INBOUND',
        facilityId: 'FAC-001',
        syncStatus: 'FAILURE',
        syncStartDateTime: '2024-01-15T10:00:00Z',
        syncCompletedDateTime: '2024-01-15T10:05:00Z',
        processedItemCount: 100,
        successItemCount: 50,
        failureItemCount: 50,
        errorMessage: null,
        retryCount: null,
        wmsRequestId: 'REQ-12345',
        createdBy: 'USER-001',
        updatedBy: null,
      };

      const result = await saveWmsSyncLog(input);

      expect(result).toHaveProperty('wmsSyncLogId');
      expect(result).toHaveProperty('syncType');
      expect(result).toHaveProperty('syncDirection');
      expect(result).toHaveProperty('facilityId');
      expect(result).toHaveProperty('syncStatus');
      expect(result).toHaveProperty('processedItemCount');
      expect(result).toHaveProperty('successItemCount');
      expect(result).toHaveProperty('failureItemCount');
      expect(result).toHaveProperty('savedAt');
      expect(result).toHaveProperty('isNewRecord');

      expect(result.wmsSyncLogId).not.toBeNull();
      expect(result.savedAt).not.toBeNull();
      expect(result.isNewRecord).toBe(true);
    });

    it('nullのerrorMessageが出力に含まれても型安全である', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: '作業実績送信',
        syncDirection: 'OUTBOUND',
        facilityId: 'FAC-002',
        syncStatus: 'FAILURE',
        syncStartDateTime: '2024-01-15T11:00:00Z',
        syncCompletedDateTime: '2024-01-15T11:05:00Z',
        processedItemCount: 50,
        successItemCount: 40,
        failureItemCount: 10,
        errorMessage: null,
        retryCount: null,
        wmsRequestId: 'REQ-67890',
        createdBy: 'USER-002',
        updatedBy: null,
      };

      const result = await saveWmsSyncLog(input);

      expect(result.wmsSyncLogId).toBeTruthy();
      expect(result.syncType).toBe('作業実績送信');
      expect(result.syncDirection).toBe('OUTBOUND');
      expect(result.syncStatus).toBe('FAILURE');
    });

    it('isNewRecordがtrueで返却される', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: '進捗データ取得',
        syncDirection: 'INBOUND',
        facilityId: 'FAC-001',
        syncStatus: 'FAILURE',
        syncStartDateTime: '2024-01-15T10:00:00Z',
        syncCompletedDateTime: '2024-01-15T10:05:00Z',
        processedItemCount: 100,
        successItemCount: 50,
        failureItemCount: 50,
        errorMessage: null,
        retryCount: null,
        wmsRequestId: 'REQ-12345',
        createdBy: 'USER-001',
        updatedBy: null,
      };

      const result = await saveWmsSyncLog(input);

      expect(result.isNewRecord).toBe(true);
    });

    it('日時が妥当なISO 8601形式である', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: '進捗データ取得',
        syncDirection: 'INBOUND',
        facilityId: 'FAC-001',
        syncStatus: 'FAILURE',
        syncStartDateTime: '2024-01-15T10:00:00Z',
        syncCompletedDateTime: '2024-01-15T10:05:00Z',
        processedItemCount: 100,
        successItemCount: 50,
        failureItemCount: 50,
        errorMessage: null,
        retryCount: null,
        wmsRequestId: 'REQ-12345',
        createdBy: 'USER-001',
        updatedBy: null,
      };

      const result = await saveWmsSyncLog(input);

      const savedAtDate = new Date(result.savedAt);
      expect(isNaN(savedAtDate.getTime())).toBe(false);
    });
  });
});