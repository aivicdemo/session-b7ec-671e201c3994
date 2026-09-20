import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';
import { ReceiveAndRetryHandyTerminalDataSyncInput } from '../../src/logic/handy-terminal-sync-retry';

describe('SCEN-1582: 再試行上限が0以下の値で指定されたとき、処理が中断され入力検証エラーが発生する', () => {
  it('maxRetryAttemptsが-1（負の値）のとき、validation_failedエラーを返す', async () => {
    const input: ReceiveAndRetryHandyTerminalDataSyncInput = {
      workerId: 'W001',
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      workStartDateTime: '2024-01-15T08:00:00Z',
      workEndDateTime: '2024-01-15T09:00:00Z',
      completedQuantity: 100,
      defectiveQuantity: 0,
      handyTerminalId: 'HT001',
      transmissionTimestamp: '2024-01-15T09:05:00Z',
      allowableDelayMilliseconds: 5000,
      maxRetryAttempts: -1,
      retryIntervalMilliseconds: 1000,
    };

    const result = await receiveAndRetryHandyTerminalDataSync(input);

    expect(result.syncStatus).toBe('validation_failed');
    expect(result.errorMessage).toBe('再試行上限は1以上である必要があります');
    expect(result.workResultId).toBeNull();
    expect(result.retryAttemptCount).toBe(0);
    expect(result.adminNotificationSent).toBeFalse();
  });
});