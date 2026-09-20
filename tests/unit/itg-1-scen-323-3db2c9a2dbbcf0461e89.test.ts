import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';

describe('SCEN-323: ハンディターミナル送信遅延と再試行上限', () => {
  it('送信遅延が許容値を超え、再試行を上限回数まで実行した場合、管理者に通知を送信して再試行上限超過ステータスで完了する', async () => {
    // テスト準備: スタブを構成
    const validateInputFormatStub = jest.fn().mockResolvedValue({ valid: true });
    const getWorkerByIdStub = jest.fn().mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
      status: 'active',
    });
    const getWorkInstructionByIdStub = jest.fn().mockResolvedValue({
      workInstructionId: 'WI001',
      workInstructionName: 'Test Instruction',
      status: 'active',
    });
    const saveHandyTerminalSyncLogStub = jest.fn().mockResolvedValue({
      syncLogId: 'SYNC-LOG-001',
    });
    const notifyAdminForManualHandyTerminalRetryStub = jest.fn().mockResolvedValue({
      notificationId: 'NOTIF-001',
      success: true,
    });

    // 入力データを構築
    const currentTime = new Date();
    const transmissionTime = new Date(currentTime.getTime() - 13000); // 13秒前

    const input = {
      workerId: 'W001',
      workInstructionId: 'WI001',
      facilityId: 'F001',
      teamId: 'T001',
      workStartDateTime: '2025-01-15T08:00:00Z',
      workEndDateTime: '2025-01-15T08:30:00Z',
      completedQuantity: 100,
      defectiveQuantity: 2,
      remarks: 'テスト実績',
      handyTerminalId: 'HT001',
      transmissionTimestamp: transmissionTime.toISOString(),
      allowableDelayMilliseconds: 5000,
      maxRetryAttempts: 3,
      retryIntervalMilliseconds: 1000,
    };

    // モック実装を注入して呼び出し
    const result = await receiveAndRetryHandyTerminalDataSync(input, {
      validateInputFormat: validateInputFormatStub,
      getWorkerById: getWorkerByIdStub,
      getWorkInstructionById: getWorkInstructionByIdStub,
      saveHandyTerminalSyncLog: saveHandyTerminalSyncLogStub,
      notifyAdminForManualHandyTerminalRetry: notifyAdminForManualHandyTerminalRetryStub,
    });

    // 出力結果を検証
    expect(result.syncStatus).toBe('retry_limit_exceeded');
    expect(result.retryAttemptCount).toBe(3);
    expect(result.actualDelayMilliseconds).toBeGreaterThanOrEqual(13000);
    expect(result.workResultId).toBeNull();
    expect(result.adminNotificationSent).toBe(true);
    expect(result.errorMessage).toMatch(/再試行上限/);
    expect(new Date(result.processedDateTime).getTime()).toBeLessThanOrEqual(
      new Date().getTime()
    );

    // notifyAdminForManualHandyTerminalRetry が1回だけ呼び出されたことを確認
    expect(notifyAdminForManualHandyTerminalRetryStub).toHaveBeenCalledTimes(1);
    expect(notifyAdminForManualHandyTerminalRetryStub).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId: 'W001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        retryAttemptCount: 3,
        maxRetryAttempts: 3,
      })
    );

    // saveHandyTerminalSyncLog が1回呼び出され、同期ログIDが記録されていることを確認
    expect(saveHandyTerminalSyncLogStub).toHaveBeenCalledTimes(1);
    expect(result.syncLogId).toBeDefined();
    expect(result.syncLogId).toMatch(/^SYNC-LOG/);
  });
});