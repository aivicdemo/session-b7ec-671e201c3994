import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';

describe('SCEN-329: ハンディターミナルからのリアルタイムデータ送信 - 再試行上限が0以下の場合', () => {
  it('再試行上限が0以下の場合、エラーメッセージを返して処理を拒否する', async () => {
    const input = {
      workerId: 'W001',
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      workStartDateTime: '2025-01-15T09:00:00Z',
      workEndDateTime: '2025-01-15T09:30:00Z',
      completedQuantity: 100,
      defectiveQuantity: 0,
      remarks: '',
      handyTerminalId: 'HT001',
      transmissionTimestamp: '2025-01-15T09:31:00Z',
      allowableDelayMilliseconds: 5000,
      maxRetryAttempts: 0,
      retryIntervalMilliseconds: 1000,
    };

    await expect(receiveAndRetryHandyTerminalDataSync(input)).rejects.toThrow(
      '再試行上限は1以上である必要があります'
    );
  });
});