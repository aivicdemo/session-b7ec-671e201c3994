import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';
import { ReceiveAndRetryHandyTerminalDataSyncInput } from '../../src/logic/handy-terminal-sync-retry';

describe('SCEN-1580: ハンディターミナルデータ同期リトライ - 入力検証エラー', () => {
  it('ペイロードが空またはnullのとき、validation_failedエラーが返される', async () => {
    const input: ReceiveAndRetryHandyTerminalDataSyncInput = {
      workerId: 'worker-001',
      workInstructionId: 'instruction-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workStartDateTime: null as any,
      workEndDateTime: null as any,
      completedQuantity: null as any,
      handyTerminalId: 'terminal-001',
      transmissionTimestamp: null as any,
      allowableDelayMilliseconds: 60000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 5000,
    };

    const result = await receiveAndRetryHandyTerminalDataSync(input);

    expect(result.syncStatus).toBe('validation_failed');
    expect(result.errorMessage).toBe('ハンディターミナルデータ形式が不正です。');
    expect(result.workResultId).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });

  it('transmissionTimestampがnullのとき、validation_failedエラーが返される', async () => {
    const input: ReceiveAndRetryHandyTerminalDataSyncInput = {
      workerId: 'worker-001',
      workInstructionId: 'instruction-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workStartDateTime: '2024-01-15T09:00:00Z',
      workEndDateTime: '2024-01-15T10:30:00Z',
      completedQuantity: 100,
      handyTerminalId: 'terminal-001',
      transmissionTimestamp: null as any,
      allowableDelayMilliseconds: 60000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 5000,
    };

    const result = await receiveAndRetryHandyTerminalDataSync(input);

    expect(result.syncStatus).toBe('validation_failed');
    expect(result.errorMessage).toBe('ハンディターミナルデータ形式が不正です。');
    expect(result.workResultId).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });

  it('workStartDateTimeがnullのとき、validation_failedエラーが返される', async () => {
    const input: ReceiveAndRetryHandyTerminalDataSyncInput = {
      workerId: 'worker-001',
      workInstructionId: 'instruction-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workStartDateTime: null as any,
      workEndDateTime: '2024-01-15T10:30:00Z',
      completedQuantity: 100,
      handyTerminalId: 'terminal-001',
      transmissionTimestamp: '2024-01-15T10:35:00Z',
      allowableDelayMilliseconds: 60000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 5000,
    };

    const result = await receiveAndRetryHandyTerminalDataSync(input);

    expect(result.syncStatus).toBe('validation_failed');
    expect(result.errorMessage).toBe('ハンディターミナルデータ形式が不正です。');
    expect(result.workResultId).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });

  it('workEndDateTimeがnullのとき、validation_failedエラーが返される', async () => {
    const input: ReceiveAndRetryHandyTerminalDataSyncInput = {
      workerId: 'worker-001',
      workInstructionId: 'instruction-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workStartDateTime: '2024-01-15T09:00:00Z',
      workEndDateTime: null as any,
      completedQuantity: 100,
      handyTerminalId: 'terminal-001',
      transmissionTimestamp: '2024-01-15T10:35:00Z',
      allowableDelayMilliseconds: 60000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 5000,
    };

    const result = await receiveAndRetryHandyTerminalDataSync(input);

    expect(result.syncStatus).toBe('validation_failed');
    expect(result.errorMessage).toBe('ハンディターミナルデータ形式が不正です。');
    expect(result.workResultId).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });

  it('completedQuantityがnullのとき、validation_failedエラーが返される', async () => {
    const input: ReceiveAndRetryHandyTerminalDataSyncInput = {
      workerId: 'worker-001',
      workInstructionId: 'instruction-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workStartDateTime: '2024-01-15T09:00:00Z',
      workEndDateTime: '2024-01-15T10:30:00Z',
      completedQuantity: null as any,
      handyTerminalId: 'terminal-001',
      transmissionTimestamp: '2024-01-15T10:35:00Z',
      allowableDelayMilliseconds: 60000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 5000,
    };

    const result = await receiveAndRetryHandyTerminalDataSync(input);

    expect(result.syncStatus).toBe('validation_failed');
    expect(result.errorMessage).toBe('ハンディターミナルデータ形式が不正です。');
    expect(result.workResultId).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});