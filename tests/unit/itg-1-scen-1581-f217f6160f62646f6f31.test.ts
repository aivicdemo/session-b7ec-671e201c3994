import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';

describe('SCEN-1581: ハンディターミナルデータ同期リトライ - 許容遅延値が0以下の値で指定されたとき', () => {
  it('許容遅延値が0以下の値で指定されたとき、処理が中断され入力検証エラーが発生する', async () => {
    const input = {
      workerId: 'worker-001',
      workInstructionId: 'instruction-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workStartDateTime: '2024-01-01T08:00:00Z',
      workEndDateTime: '2024-01-01T17:00:00Z',
      completedQuantity: 100,
      defectiveQuantity: 5,
      remarks: 'test work',
      handyTerminalId: 'terminal-001',
      transmissionTimestamp: '2024-01-01T17:05:00Z',
      allowableDelayMilliseconds: -100, // 0以下の値
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 5000,
    };

    await expect(receiveAndRetryHandyTerminalDataSync(input)).rejects.toThrow(
      '許容遅延値は正の数である必要があります'
    );
  });

  it('許容遅延値が0で指定されたとき、処理が中断され入力検証エラーが発生する', async () => {
    const input = {
      workerId: 'worker-002',
      workInstructionId: 'instruction-002',
      facilityId: 'facility-002',
      teamId: 'team-002',
      workStartDateTime: '2024-01-01T08:00:00Z',
      workEndDateTime: '2024-01-01T17:00:00Z',
      completedQuantity: 50,
      defectiveQuantity: 2,
      remarks: 'test work 2',
      handyTerminalId: 'terminal-002',
      transmissionTimestamp: '2024-01-01T17:05:00Z',
      allowableDelayMilliseconds: 0, // 0の値
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 5000,
    };

    await expect(receiveAndRetryHandyTerminalDataSync(input)).rejects.toThrow(
      '許容遅延値は正の数である必要があります'
    );
  });
});