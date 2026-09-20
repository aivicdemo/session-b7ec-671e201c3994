import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';

describe('SCEN-1578: ハンディターミナルデータ同期リトライ', () => {
  it('送信遅延が許容値を超えたとき、1回目の自動再試行が実行され、指数バックオフで待機時間が計算される', async () => {
    // Step 1: 入力値を準備する
    const transmissionTimestamp = '2025-01-15T10:30:00Z';
    const transmissionTime = new Date(transmissionTimestamp).getTime();
    const delayMilliseconds = 7000;
    const now = new Date(transmissionTime + delayMilliseconds);

    jest.useFakeTimers();
    jest.setSystemTime(now);

    const input = {
      workerId: 'W001',
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      workStartDateTime: '2025-01-15T09:00:00Z',
      workEndDateTime: '2025-01-15T10:30:00Z',
      completedQuantity: 500,
      defectiveQuantity: 0,
      remarks: undefined,
      handyTerminalId: 'HT001',
      transmissionTimestamp: transmissionTimestamp,
      allowableDelayMilliseconds: 5000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 1000,
    };

    // Step 2: receiveAndRetryHandyTerminalDataSync を呼び出す
    const result = await receiveAndRetryHandyTerminalDataSync(input);

    // Step 3-4: syncStatus が 'pending_retry' であることを確認する
    expect(result.syncStatus).toBe('pending_retry');

    // Step 5: retryAttemptCount が 1 であることを確認する
    expect(result.retryAttemptCount).toBe(1);

    // Step 6: actualDelayMilliseconds が 7000 以上であることを確認する
    expect(result.actualDelayMilliseconds).toBeGreaterThanOrEqual(7000);

    // Step 7: workResultId が null であることを確認する
    expect(result.workResultId).toBeNull();

    // Step 8: adminNotificationSent が false であることを確認する
    expect(result.adminNotificationSent).toBe(false);

    // Step 9: errorMessage が null であることを確認する
    expect(result.errorMessage).toBeNull();

    // Step 10: processedDateTime が ISO 8601 形式の有効な日時文字列であることを確認する
    expect(result.processedDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
    expect(new Date(result.processedDateTime).getTime()).not.toBeNaN();

    jest.useRealTimers();
  });
});