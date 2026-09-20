import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';

describe('SCEN-327: ハンディターミナルからのリアルタイムデータ送信 - 送信ペイロードが空またはnullの場合のエラーハンドリング', () => {
  describe('送信ペイロードが空またはnullの場合、エラーメッセージを返して処理を拒否する', () => {
    const baseInput = {
      workerId: 'W001',
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      workStartDateTime: '2024-01-15T09:00:00Z',
      workEndDateTime: '2024-01-15T09:30:00Z',
      completedQuantity: 100,
      defectiveQuantity: 0,
      handyTerminalId: 'HT001',
      transmissionTimestamp: '2024-01-15T09:30:05Z',
      allowableDelayMilliseconds: 5000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 1000,
    };

    it('送信ペイロードがnullの場合、validation_failedを返す', async () => {
      const input: any = {
        ...baseInput,
        payload: null,
      };

      const result = await receiveAndRetryHandyTerminalDataSync(input);

      expect(result.syncStatus).toBe('validation_failed');
      expect(result.retryAttemptCount).toBe(0);
      expect(result.workResultId).toBeNull();
      expect(result.adminNotificationSent).toBe(false);
      expect(result.errorMessage).toBe('ハンディターミナルデータ形式が不正です。');
      expect(result.processedDateTime).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      );
    });

    it('送信ペイロードが空オブジェクト{}の場合、validation_failedを返す', async () => {
      const input: any = {
        ...baseInput,
        payload: {},
      };

      const result = await receiveAndRetryHandyTerminalDataSync(input);

      expect(result.syncStatus).toBe('validation_failed');
      expect(result.retryAttemptCount).toBe(0);
      expect(result.workResultId).toBeNull();
      expect(result.adminNotificationSent).toBe(false);
      expect(result.errorMessage).toBe('ハンディターミナルデータ形式が不正です。');
      expect(result.processedDateTime).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      );
    });

    it('送信ペイロードが空配列[]の場合、validation_failedを返す', async () => {
      const input: any = {
        ...baseInput,
        payload: [],
      };

      const result = await receiveAndRetryHandyTerminalDataSync(input);

      expect(result.syncStatus).toBe('validation_failed');
      expect(result.retryAttemptCount).toBe(0);
      expect(result.workResultId).toBeNull();
      expect(result.adminNotificationSent).toBe(false);
      expect(result.errorMessage).toBe('ハンディターミナルデータ形式が不正です。');
      expect(result.processedDateTime).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      );
    });
  });
});