import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';
import { ReceiveAndRetryHandyTerminalDataSyncInput } from '../../src/logic/handy-terminal-sync-retry';

describe('SCEN-328: 許容遅延値が0以下の場合、エラーメッセージを返して処理を拒否する', () => {
  it('allowableDelayMillisecondsが0の場合、入力検証エラーを発生させる', async () => {
    const input: ReceiveAndRetryHandyTerminalDataSyncInput = {
      workerId: 'worker-001',
      workInstructionId: 'instruction-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workStartDateTime: '2024-01-01T08:00:00Z',
      workEndDateTime: '2024-01-01T09:00:00Z',
      completedQuantity: 100,
      defectiveQuantity: 0,
      remarks: 'test remarks',
      handyTerminalId: 'terminal-001',
      transmissionTimestamp: '2024-01-01T09:05:00Z',
      allowableDelayMilliseconds: 0,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 1000,
    };

    await expect(receiveAndRetryHandyTerminalDataSync(input)).rejects.toThrow(
      '許容遅延値は正の数である必要があります'
    );
  });

  it('allowableDelayMillisecondsが負の値の場合、入力検証エラーを発生させる', async () => {
    const input: ReceiveAndRetryHandyTerminalDataSyncInput = {
      workerId: 'worker-002',
      workInstructionId: 'instruction-002',
      facilityId: 'facility-002',
      teamId: 'team-002',
      workStartDateTime: '2024-01-01T08:00:00Z',
      workEndDateTime: '2024-01-01T09:00:00Z',
      completedQuantity: 50,
      defectiveQuantity: 5,
      remarks: 'test remarks',
      handyTerminalId: 'terminal-002',
      transmissionTimestamp: '2024-01-01T09:05:00Z',
      allowableDelayMilliseconds: -100,
      maxRetryAttempts: 5,
      retryIntervalMilliseconds: 2000,
    };

    await expect(receiveAndRetryHandyTerminalDataSync(input)).rejects.toThrow(
      '許容遅延値は正の数である必要があります'
    );
  });
});