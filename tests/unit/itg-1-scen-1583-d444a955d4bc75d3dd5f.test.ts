import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';

describe('SCEN-1583: ハンディターミナルデータ同期リトライ - システム時刻同期異常検知', () => {
  let originalNow: () => number;
  const systemTimeOffsetMs = -60000; // 現在時刻を1分前に設定

  beforeEach(() => {
    // システム現在時刻を送信開始時刻より1分前に設定
    originalNow = Date.now;
    Date.now = jest.fn(() => {
      const baseTime = new Date('2024-01-15T09:05:00Z').getTime();
      return baseTime + systemTimeOffsetMs;
    });
  });

  afterEach(() => {
    Date.now = originalNow;
  });

  it('現在時刻がハンディターミナルデータ送信開始時刻より前のとき、警告ログが記録されシステム時刻の同期異常が検知される', async () => {
    const input = {
      workerId: 'W001',
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      workStartDateTime: '2024-01-15T08:00:00Z',
      workEndDateTime: '2024-01-15T09:00:00Z',
      completedQuantity: 100,
      defectiveQuantity: 0,
      remarks: '',
      handyTerminalId: 'HT001',
      transmissionTimestamp: '2024-01-15T09:05:00Z',
      allowableDelayMilliseconds: 5000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 1000,
    };

    const output = await receiveAndRetryHandyTerminalDataSync(input);

    // 出力検証
    expect(output.syncStatus).toBe('validation_failed');
    expect(output.errorMessage).toBe(
      'システム時刻が不正です。NTPサーバーとの同期を確認してください'
    );
    expect(output.workResultId).toBeNull();
    expect(output.actualDelayMilliseconds).toBeLessThan(0);
    expect(output.adminNotificationSent).toBe(false);
    expect(output.retryAttemptCount).toBe(0);
    expect(output.syncLogId).toBeTruthy();
    expect(typeof output.syncLogId).toBe('string');
    expect(output.processedDateTime).toBeTruthy();
  });
});