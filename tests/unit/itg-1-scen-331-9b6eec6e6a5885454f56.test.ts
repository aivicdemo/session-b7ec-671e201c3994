import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';

describe('SCEN-331: ハンディターミナルからのリアルタイムデータ送信の再試行ロジック', () => {
  const baseTime = new Date('2024-01-01T10:00:00Z');
  const transmissionTime = new Date(baseTime.getTime() - 7000); // 7秒前
  const currentTime = baseTime;

  // 共通の入力データ構造
  const createInputData = (retryAttempt: number = 0, previousSyncLogId?: string) => ({
    workerId: 'worker-001',
    workInstructionId: 'instr-001',
    facilityId: 'facility-001',
    teamId: 'team-001',
    workStartDateTime: '2024-01-01T09:00:00Z',
    workEndDateTime: '2024-01-01T10:00:00Z',
    completedQuantity: 100,
    defectiveQuantity: 5,
    remarks: 'Test work result',
    handyTerminalId: 'terminal-001',
    transmissionTimestamp: transmissionTime.toISOString(),
    allowableDelayMilliseconds: 5000,
    maxRetryAttempts: 3,
    retryIntervalMilliseconds: 1000,
    currentRetryAttempt: retryAttempt,
    previousSyncLogId,
  });

  // 待機時間計算式: nextRetryDelayMs = 1000 * Math.pow(2, currentRetryCount)
  const getExpectedRetryDelay = (retryCount: number): number => {
    return 1000 * Math.pow(2, retryCount);
  };

  describe('指数バックオフによる待機時間の計算', () => {
    it('第1回呼び出し: 再試行回数0時の待機時間が1000ms（1 * 2^0）で計算される', async () => {
      const delayMs = currentTime.getTime() - transmissionTime.getTime();
      const expectedRetryDelay = getExpectedRetryDelay(0); // 1000ms

      const input = createInputData(0);
      const result = await receiveAndRetryHandyTerminalDataSync(input);

      expect(result.syncStatus).toBe('pending_retry');
      expect(result.retryAttemptCount).toBe(0);
      expect(result.actualDelayMilliseconds).toBe(delayMs);
      expect(delayMs).toBe(7000); // 許容値5000msを2000ms超過
      expect(result.workResultId).toBeNull();
      expect(result.adminNotificationSent).toBe(false);
      expect(result.errorMessage).toBeNull();
      // 次回再試行の予定日時が正しい待機時間を反映しているか確認
      if (result.nextRetryScheduledDateTime) {
        const nextRetryTime = new Date(result.nextRetryScheduledDateTime).getTime();
        const scheduledDelay = nextRetryTime - result.processedDateTime
          ? new Date(result.processedDateTime).getTime()
          : currentTime.getTime();
        expect(Math.abs(nextRetryTime - (currentTime.getTime() + expectedRetryDelay))).toBeLessThan(100);
      }
    });

    it('第2回呼び出し: 再試行回数1時の待機時間が2000ms（1 * 2^1）で計算される', async () => {
      const delayMs = currentTime.getTime() - transmissionTime.getTime();
      const expectedRetryDelay = getExpectedRetryDelay(1); // 2000ms

      const input = createInputData(1, 'sync-log-0');
      const result = await receiveAndRetryHandyTerminalDataSync(input);

      expect(result.syncStatus).toBe('pending_retry');
      expect(result.retryAttemptCount).toBe(1);
      expect(result.actualDelayMilliseconds).toBe(delayMs);
      expect(result.workResultId).toBeNull();
      expect(result.adminNotificationSent).toBe(false);
      expect(result.errorMessage).toBeNull();
      // 次回再試行の予定日時が正しい待機時間を反映しているか確認
      if (result.nextRetryScheduledDateTime) {
        const nextRetryTime = new Date(result.nextRetryScheduledDateTime).getTime();
        const baseScheduleTime = new Date(result.processedDateTime).getTime();
        expect(Math.abs(nextRetryTime - (baseScheduleTime + expectedRetryDelay))).toBeLessThan(100);
      }
    });

    it('第3回呼び出し: 再試行回数2時の待機時間が4000ms（1 * 2^2）で計算される', async () => {
      const delayMs = currentTime.getTime() - transmissionTime.getTime();
      const expectedRetryDelay = getExpectedRetryDelay(2); // 4000ms

      const input = createInputData(2, 'sync-log-1');
      const result = await receiveAndRetryHandyTerminalDataSync(input);

      expect(result.syncStatus).toBe('pending_retry');
      expect(result.retryAttemptCount).toBe(2);
      expect(result.actualDelayMilliseconds).toBe(delayMs);
      expect(result.workResultId).toBeNull();
      expect(result.adminNotificationSent).toBe(false);
      expect(result.errorMessage).toBeNull();
      // 次回再試行の予定日時が正しい待機時間を反映しているか確認
      if (result.nextRetryScheduledDateTime) {
        const nextRetryTime = new Date(result.nextRetryScheduledDateTime).getTime();
        const baseScheduleTime = new Date(result.processedDateTime).getTime();
        expect(Math.abs(nextRetryTime - (baseScheduleTime + expectedRetryDelay))).toBeLessThan(100);
      }
    });

    it('第4回呼び出し: 再試行上限（3回）に達した際にretry_limit_exceededが返される', async () => {
      const delayMs = currentTime.getTime() - transmissionTime.getTime();

      const input = createInputData(3, 'sync-log-2');
      const result = await receiveAndRetryHandyTerminalDataSync(input);

      expect(result.syncStatus).toBe('retry_limit_exceeded');
      expect(result.retryAttemptCount).toBe(3);
      expect(result.actualDelayMilliseconds).toBe(delayMs);
      expect(result.workResultId).toBeNull();
      expect(result.adminNotificationSent).toBe(true);
      // 完全なエラーメッセージ形式を検証
      expect(result.errorMessage).toBe(
        'DataSyncTimeoutExceeded: ハンディターミナルデータ送信が再試行上限に達しました。管理者による手動対応が必要です。'
      );
      // 次回再試行予定がないことを確認
      expect(result.nextRetryScheduledDateTime).toBeNull();
    });
  });

  describe('再試行の状態遷移', () => {
    it('再試行回数が上限に達するまでpending_retryステータスを保持する', async () => {
      for (let retryCount = 0; retryCount < 3; retryCount++) {
        const previousLogId = retryCount > 0 ? `sync-log-${retryCount - 1}` : undefined;
        const input = createInputData(retryCount, previousLogId);
        const result = await receiveAndRetryHandyTerminalDataSync(input);

        expect(result.syncStatus).toBe('pending_retry');
        expect(result.adminNotificationSent).toBe(false);
        expect(result.nextRetryScheduledDateTime).not.toBeNull();
      }
    });

    it('再試行上限到達時にadminNotificationSentがtrueになる', async () => {
      const input = createInputData(3, 'sync-log-2');
      const result = await receiveAndRetryHandyTerminalDataSync(input);

      expect(result.adminNotificationSent).toBe(true);
      expect(result.syncStatus).toBe('retry_limit_exceeded');
    });
  });

  describe('エラーメッセージの形式', () => {
    it('再試行上限到達時のエラーメッセージが正しい形式で返される', async () => {
      const input = createInputData(3, 'sync-log-2');
      const result = await receiveAndRetryHandyTerminalDataSync(input);

      expect(result.errorMessage).toBeDefined();
      expect(result.errorMessage).toMatch(/DataSyncTimeoutExceeded/);
      expect(result.errorMessage).toMatch(/ハンディターミナルデータ送信/);
      expect(result.errorMessage).toMatch(/再試行上限/);
      expect(result.errorMessage).toMatch(/手動対応/);
    });
  });

  describe('出力フィールドの一貫性', () => {
    it('pending_retry時にnextRetryScheduledDateTimeが計算された日時を持つ', async () => {
      const input = createInputData(1, 'sync-log-0');
      const result = await receiveAndRetryHandyTerminalDataSync(input);

      expect(result.syncStatus).toBe('pending_retry');
      expect(result.nextRetryScheduledDateTime).not.toBeNull();
      
      const processedTime = new Date(result.processedDateTime).getTime();
      const nextRetryTime = new Date(result.nextRetryScheduledDateTime!).getTime();
      const expectedDelay = 1000 * Math.pow(2, 1); // 2000ms
      
      const actualDelay = nextRetryTime - processedTime;
      expect(Math.abs(actualDelay - expectedDelay)).toBeLessThan(100);
    });

    it('retry_limit_exceeded時にnextRetryScheduledDateTimeがnullになる', async () => {
      const input = createInputData(3, 'sync-log-2');
      const result = await receiveAndRetryHandyTerminalDataSync(input);

      expect(result.syncStatus).toBe('retry_limit_exceeded');
      expect(result.nextRetryScheduledDateTime).toBeNull();
    });

    it('processedDateTimeが妥当な日時値を持つ', async () => {
      const input = createInputData(0);
      const result = await receiveAndRetryHandyTerminalDataSync(input);

      const processedTime = new Date(result.processedDateTime);
      expect(processedTime instanceof Date && !isNaN(processedTime.getTime())).toBe(true);
      expect(processedTime.getTime()).toBeGreaterThanOrEqual(currentTime.getTime());
    });
  });
});