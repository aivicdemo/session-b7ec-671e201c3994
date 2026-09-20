import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';
import { InvalidHandyTerminalDataFormat, DataSyncTimeoutExceeded } from '../../src/logic/errors';

jest.mock('../../src/logic/validation', () => ({
  validateInputFormat: jest.fn(),
}));

jest.mock('../../src/logic/worker-service', () => ({
  getWorkerById: jest.fn(),
}));

jest.mock('../../src/logic/work-instruction-service', () => ({
  getWorkInstructionById: jest.fn(),
}));

jest.mock('../../src/logic/handy-terminal-sync-log-service', () => ({
  saveHandyTerminalSyncLog: jest.fn(),
}));

jest.mock('../../src/logic/admin-notification-service', () => ({
  notifyAdminForManualHandyTerminalRetry: jest.fn(),
}));

import { validateInputFormat } from '../../src/logic/validation';
import { getWorkerById } from '../../src/logic/worker-service';
import { getWorkInstructionById } from '../../src/logic/work-instruction-service';
import { saveHandyTerminalSyncLog } from '../../src/logic/handy-terminal-sync-log-service';
import { notifyAdminForManualHandyTerminalRetry } from '../../src/logic/admin-notification-service';

describe('SCEN-324: ハンディターミナルからのリアルタイムデータ送信 - スキーマ不正時', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('入力データのスキーマが不正な場合、検証失敗ステータスで拒否される', async () => {
    // 準備：validateInputFormat がスキーマ検証失敗を示すエラーを発生させるよう設定
    (validateInputFormat as jest.Mock).mockImplementation(() => {
      throw new InvalidHandyTerminalDataFormat('ハンディターミナルデータ形式が不正です。');
    });

    // テスト実行
    const input = {
      workerId: 'W001',
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      workStartDateTime: '2024-01-15T08:00:00Z',
      workEndDateTime: '2024-01-15T08:30:00Z',
      completedQuantity: 50,
      defectiveQuantity: 0,
      remarks: '',
      handyTerminalId: 'HT001',
      transmissionTimestamp: '2024-01-15T08:30:05Z',
      allowableDelayMilliseconds: 5000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 1000,
    };

    const output = await receiveAndRetryHandyTerminalDataSync(input);

    // 期待結果の検証
    expect(output.syncStatus).toBe('validation_failed');
    expect(output.errorMessage).toContain('ハンディターミナルデータ形式が不正です。');
    expect(output.workResultId).toBeNull();
    expect(output.adminNotificationSent).toBe(false);
    expect(output.retryAttemptCount).toBe(0);
    expect(output.syncLogId).toBeDefined();
    expect(output.syncLogId).not.toBeNull();
    
    // processedDateTime が ISO 8601 形式であることを確認
    expect(output.processedDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // validateInputFormat が1回だけ呼び出されたことを確認
    expect(validateInputFormat).toHaveBeenCalledTimes(1);
    expect(validateInputFormat).toHaveBeenCalledWith(input);

    // 後続の処理が呼び出されないことを確認
    expect(getWorkerById).not.toHaveBeenCalled();
    expect(getWorkInstructionById).not.toHaveBeenCalled();
    expect(saveHandyTerminalSyncLog).not.toHaveBeenCalled();
    expect(notifyAdminForManualHandyTerminalRetry).not.toHaveBeenCalled();

    // 設計済みエラー InvalidHandyTerminalDataFormat が発生していることを確認
    // エラーメッセージの内容で確認
    expect(output.errorMessage).toBe('ハンディターミナルデータ形式が不正です。');

    // DataSyncTimeoutExceeded エラーが発生していないことを確認
    expect(output.syncStatus).not.toBe('retry_limit_exceeded');
    expect(output.syncStatus).toBe('validation_failed');
  });
});