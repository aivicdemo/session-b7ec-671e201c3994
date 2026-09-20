import { saveWmsSyncLog } from '../../src/logic/data-persistence';

describe('SCEN-1097: WMS連携ログ新規作成・更新時の必須フィールド検証', () => {
  describe('必須フィールド欠落時のエラー処理', () => {
    it('パターン1: syncType が null の場合、InvalidWmsSyncLogInput エラーがスロー', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: null as any,
        syncDirection: 'INBOUND',
        facilityId: 'FAC001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2025-01-15T10:00:00Z',
        syncCompletedDateTime: null,
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: null,
        wmsRequestId: null,
        createdBy: 'USER001',
        updatedBy: null,
      };

      await expect(saveWmsSyncLog(input)).rejects.toThrow('WMS連携ログの入力データが不正です。必須フィールドを確認してください。');
    });

    it('パターン2: syncDirection が null の場合、InvalidWmsSyncLogInput エラーがスロー', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'progress_fetch',
        syncDirection: null as any,
        facilityId: 'FAC001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2025-01-15T10:00:00Z',
        syncCompletedDateTime: null,
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: null,
        wmsRequestId: null,
        createdBy: 'USER001',
        updatedBy: null,
      };

      await expect(saveWmsSyncLog(input)).rejects.toThrow('WMS連携ログの入力データが不正です。必須フィールドを確認してください。');
    });

    it('パターン3: facilityId が null の場合、InvalidWmsSyncLogInput エラーがスロー', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'progress_fetch',
        syncDirection: 'INBOUND',
        facilityId: null as any,
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2025-01-15T10:00:00Z',
        syncCompletedDateTime: null,
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: null,
        wmsRequestId: null,
        createdBy: 'USER001',
        updatedBy: null,
      };

      await expect(saveWmsSyncLog(input)).rejects.toThrow('WMS連携ログの入力データが不正です。必須フィールドを確認してください。');
    });

    it('パターン4: syncStatus が null の場合、InvalidWmsSyncLogInput エラーがスロー', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'progress_fetch',
        syncDirection: 'INBOUND',
        facilityId: 'FAC001',
        syncStatus: null as any,
        syncStartDateTime: '2025-01-15T10:00:00Z',
        syncCompletedDateTime: null,
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: null,
        wmsRequestId: null,
        createdBy: 'USER001',
        updatedBy: null,
      };

      await expect(saveWmsSyncLog(input)).rejects.toThrow('WMS連携ログの入力データが不正です。必須フィールドを確認してください。');
    });

    it('パターン5: syncStartDateTime が null の場合、InvalidWmsSyncLogInput エラーがスロー', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'progress_fetch',
        syncDirection: 'INBOUND',
        facilityId: 'FAC001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: null as any,
        syncCompletedDateTime: null,
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        errorMessage: null,
        retryCount: null,
        wmsRequestId: null,
        createdBy: 'USER001',
        updatedBy: null,
      };

      await expect(saveWmsSyncLog(input)).rejects.toThrow('WMS連携ログの入力データが不正です。必須フィールドを確認してください。');
    });
  });
});