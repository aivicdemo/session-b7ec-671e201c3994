import { saveHandyTerminalSyncLog } from '../../src/logic/data-persistence';

describe('SCEN-1066: ハンディターミナルからのリアルタイムデータ連携ログ管理', () => {
  describe('error: 日時形式エラーチェック', () => {
    it('送信日時がISO 8601形式でなければ、InvalidDateTimeFormat エラーを返す', async () => {
      const invalidInput = {
        workerId: 'W001',
        handyTerminalId: 'HT001',
        facilityId: 'F001',
        syncType: 'work_result',
        syncStatus: 'success',
        sentDateTime: '2024-01-15',
        receivedDateTime: '2024-01-15T10:30:00Z',
        processingCompletedDateTime: '2024-01-15T10:35:00Z',
        syncContent: '{"result": "ok"}',
        errorMessage: null,
        retryCount: null,
        createdBy: 'USER001',
        updatedBy: null,
        handyTerminalSyncLogId: null,
      };

      await expect(saveHandyTerminalSyncLog(invalidInput)).rejects.toThrow(
        expect.objectContaining({
          code: 'InvalidDateTimeFormat',
          message: '日時形式が不正です。ISO 8601形式で指定してください。',
        })
      );
    });

    it('受信日時がISO 8601形式でなければ、InvalidDateTimeFormat エラーを返す', async () => {
      const invalidInput = {
        workerId: 'W001',
        handyTerminalId: 'HT001',
        facilityId: 'F001',
        syncType: 'work_result',
        syncStatus: 'success',
        sentDateTime: '2024-01-15T10:25:00Z',
        receivedDateTime: '2024-01-15',
        processingCompletedDateTime: '2024-01-15T10:35:00Z',
        syncContent: '{"result": "ok"}',
        errorMessage: null,
        retryCount: null,
        createdBy: 'USER001',
        updatedBy: null,
        handyTerminalSyncLogId: null,
      };

      await expect(saveHandyTerminalSyncLog(invalidInput)).rejects.toThrow(
        expect.objectContaining({
          code: 'InvalidDateTimeFormat',
          message: '日時形式が不正です。ISO 8601形式で指定してください。',
        })
      );
    });

    it('処理完了日時がISO 8601形式でなければ、InvalidDateTimeFormat エラーを返す', async () => {
      const invalidInput = {
        workerId: 'W001',
        handyTerminalId: 'HT001',
        facilityId: 'F001',
        syncType: 'work_result',
        syncStatus: 'success',
        sentDateTime: '2024-01-15T10:25:00Z',
        receivedDateTime: '2024-01-15T10:30:00Z',
        processingCompletedDateTime: '2024-01-15',
        syncContent: '{"result": "ok"}',
        errorMessage: null,
        retryCount: null,
        createdBy: 'USER001',
        updatedBy: null,
        handyTerminalSyncLogId: null,
      };

      await expect(saveHandyTerminalSyncLog(invalidInput)).rejects.toThrow(
        expect.objectContaining({
          code: 'InvalidDateTimeFormat',
          message: '日時形式が不正です。ISO 8601形式で指定してください。',
        })
      );
    });

    it('複数の日時フィールドが不正形式の場合、InvalidDateTimeFormat エラーを返す', async () => {
      const invalidInput = {
        workerId: 'W001',
        handyTerminalId: 'HT001',
        facilityId: 'F001',
        syncType: 'work_result',
        syncStatus: 'success',
        sentDateTime: '2024-01-15',
        receivedDateTime: '2024-01-15',
        processingCompletedDateTime: '2024-01-15',
        syncContent: '{"result": "ok"}',
        errorMessage: null,
        retryCount: null,
        createdBy: 'USER001',
        updatedBy: null,
        handyTerminalSyncLogId: null,
      };

      await expect(saveHandyTerminalSyncLog(invalidInput)).rejects.toThrow(
        expect.objectContaining({
          code: 'InvalidDateTimeFormat',
          message: '日時形式が不正です。ISO 8601形式で指定してください。',
        })
      );
    });
  });
});