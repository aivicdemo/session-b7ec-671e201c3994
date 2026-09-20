import { saveWmsSyncLog } from '../../src/logic/data-persistence';

describe('SCEN-1098: WMS連携ログの入力データ形式検証', () => {
  describe('saveWmsSyncLog関数のエラーハンドリング', () => {
    it('syncTypeフィールドが空文字列の場合、InvalidWmsSyncLogInputエラーをスロー', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: '',
        syncDirection: 'INBOUND',
        facilityId: 'facility-001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2025-01-15T10:00:00Z',
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        createdBy: 'user-001',
      };

      await expect(saveWmsSyncLog(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidWmsSyncLogInput',
          message: 'WMS連携ログの入力データが不正です。必須フィールドを確認してください。',
        })
      );
    });

    it('syncDirectionフィールドが不正な値の場合、InvalidWmsSyncLogInputエラーをスロー', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'data_sync',
        syncDirection: 'INVALID_DIRECTION',
        facilityId: 'facility-001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2025-01-15T10:00:00Z',
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        createdBy: 'user-001',
      };

      await expect(saveWmsSyncLog(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidWmsSyncLogInput',
          message: 'WMS連携ログの入力データが不正です。必須フィールドを確認してください。',
        })
      );
    });

    it('facilityIdフィールドがnullの場合、InvalidWmsSyncLogInputエラーをスロー', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'data_sync',
        syncDirection: 'INBOUND',
        facilityId: null as any,
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2025-01-15T10:00:00Z',
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        createdBy: 'user-001',
      };

      await expect(saveWmsSyncLog(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidWmsSyncLogInput',
          message: 'WMS連携ログの入力データが不正です。必須フィールドを確認してください。',
        })
      );
    });

    it('facilityIdフィールドがundefinedの場合、InvalidWmsSyncLogInputエラーをスロー', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'data_sync',
        syncDirection: 'INBOUND',
        facilityId: undefined as any,
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2025-01-15T10:00:00Z',
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        createdBy: 'user-001',
      };

      await expect(saveWmsSyncLog(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidWmsSyncLogInput',
          message: 'WMS連携ログの入力データが不正です。必須フィールドを確認してください。',
        })
      );
    });

    it('syncStatusフィールドが契約で定義されていない値の場合、InvalidWmsSyncLogInputエラーをスロー', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'facility-001',
        syncStatus: 'UNKNOWN_STATUS',
        syncStartDateTime: '2025-01-15T10:00:00Z',
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        createdBy: 'user-001',
      };

      await expect(saveWmsSyncLog(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidWmsSyncLogInput',
          message: 'WMS連携ログの入力データが不正です。必須フィールドを確認してください。',
        })
      );
    });

    it('syncStartDateTimeフィールドがISO 8601形式ではない場合、InvalidWmsSyncLogInputエラーをスロー', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'facility-001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2025-13-45T99:99:99Z',
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        createdBy: 'user-001',
      };

      await expect(saveWmsSyncLog(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidWmsSyncLogInput',
          message: 'WMS連携ログの入力データが不正です。必須フィールドを確認してください。',
        })
      );
    });

    it('syncStartDateTimeフィールドが不正な文字列の場合、InvalidWmsSyncLogInputエラーをスロー', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'facility-001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: 'not-a-date',
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        createdBy: 'user-001',
      };

      await expect(saveWmsSyncLog(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidWmsSyncLogInput',
          message: 'WMS連携ログの入力データが不正です。必須フィールドを確認してください。',
        })
      );
    });

    it('processedItemCountフィールドに負の数を指定した場合、InvalidWmsSyncLogInputエラーをスロー', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'facility-001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2025-01-15T10:00:00Z',
        processedItemCount: -50,
        successItemCount: 0,
        failureItemCount: 0,
        createdBy: 'user-001',
      };

      await expect(saveWmsSyncLog(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidWmsSyncLogInput',
          message: 'WMS連携ログの入力データが不正です。必須フィールドを確認してください。',
        })
      );
    });

    it('createdByフィールドが空文字列の場合、InvalidWmsSyncLogInputエラーをスロー', async () => {
      const input = {
        wmsSyncLogId: null,
        syncType: 'data_sync',
        syncDirection: 'INBOUND',
        facilityId: 'facility-001',
        syncStatus: 'SUCCESS',
        syncStartDateTime: '2025-01-15T10:00:00Z',
        processedItemCount: 100,
        successItemCount: 100,
        failureItemCount: 0,
        createdBy: '',
      };

      await expect(saveWmsSyncLog(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidWmsSyncLogInput',
          message: 'WMS連携ログの入力データが不正です。必須フィールドを確認してください。',
        })
      );
    });
  });
});