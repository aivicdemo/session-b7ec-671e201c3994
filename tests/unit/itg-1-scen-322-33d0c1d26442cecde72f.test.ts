import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';
import * as handyTerminalSyncRetry from '../../src/logic/handy-terminal-sync-retry';

// モック関数用の型定義
type ValidateInputFormatFn = (input: unknown) => { valid: boolean; errors?: string[] };
type GetWorkerByIdFn = (workerId: string) => Promise<{ id: string; name: string; facilityId: string; teamId: string } | null>;
type GetWorkInstructionByIdFn = (workInstructionId: string) => Promise<{ id: string; name: string; facilityId: string; teamId: string } | null>;
type SaveHandyTerminalSyncLogFn = (logData: unknown) => Promise<string>;

describe('SCEN-322: ハンディターミナル送信遅延再試行管理', () => {
  describe('送信遅延が許容値を超え、再試行回数が上限未満の場合', () => {
    it('待機中ステータスを返して再試行を予約する', async () => {
      // スタブ関数を作成
      const validateInputFormatStub: ValidateInputFormatFn = jest.fn(() => ({
        valid: true,
        errors: undefined,
      }));

      const getWorkerByIdStub: GetWorkerByIdFn = jest.fn(async (workerId: string) => ({
        id: workerId,
        name: 'Test Worker',
        facilityId: 'facility-789',
        teamId: 'team-101',
      }));

      const getWorkInstructionByIdStub: GetWorkInstructionByIdFn = jest.fn(
        async (workInstructionId: string) => ({
          id: workInstructionId,
          name: 'Test Work Instruction',
          facilityId: 'facility-789',
          teamId: 'team-101',
        })
      );

      const saveHandyTerminalSyncLogStub: SaveHandyTerminalSyncLogFn = jest.fn(
        async () => 'sync-log-id-' + Date.now()
      );

      // グローバルスタブをセット（関数内部で使用される場合を想定）
      const originalValidateInputFormat = (handyTerminalSyncRetry as any).validateInputFormat;
      const originalGetWorkerById = (handyTerminalSyncRetry as any).getWorkerById;
      const originalGetWorkInstructionById = (handyTerminalSyncRetry as any).getWorkInstructionById;
      const originalSaveHandyTerminalSyncLog = (handyTerminalSyncRetry as any).saveHandyTerminalSyncLog;

      try {
        (handyTerminalSyncRetry as any).validateInputFormat = validateInputFormatStub;
        (handyTerminalSyncRetry as any).getWorkerById = getWorkerByIdStub;
        (handyTerminalSyncRetry as any).getWorkInstructionById = getWorkInstructionByIdStub;
        (handyTerminalSyncRetry as any).saveHandyTerminalSyncLog = saveHandyTerminalSyncLogStub;

        // 入力値を準備する
        // transmissionTimestampを現在時刻より5500ミリ秒前に固定設定
        const fixedTransmissionTime = new Date('2024-01-15T10:00:00.000Z');
        const transmissionTimestamp = fixedTransmissionTime.toISOString();
        
        // 現在時刻をtransmissionTimestampから5500ms後に設定
        const currentTimeForNow = new Date(fixedTransmissionTime.getTime() + 5500);
        
        const allowableDelayMilliseconds = 5000;
        const maxRetryAttempts = 3;
        const retryAttemptCount = 1;
        const retryIntervalMilliseconds = 1000;

        // 入力値準備時の現在時刻を固定
        jest.useFakeTimers();
        jest.setSystemTime(currentTimeForNow);

        const input = {
          workerId: 'worker-123',
          workInstructionId: 'work-instruction-456',
          facilityId: 'facility-789',
          teamId: 'team-101',
          workStartDateTime: new Date(currentTimeForNow.getTime() - 3600000).toISOString(),
          workEndDateTime: new Date(currentTimeForNow.getTime() - 1800000).toISOString(),
          completedQuantity: 100,
          defectiveQuantity: 0,
          remarks: 'Test remark',
          handyTerminalId: 'handy-terminal-202',
          transmissionTimestamp,
          allowableDelayMilliseconds,
          maxRetryAttempts,
          retryIntervalMilliseconds,
          currentRetryAttempt: retryAttemptCount,
          previousSyncLogId: 'prev-sync-log-001',
        };

        // receiveAndRetryHandyTerminalDataSync を呼び出す
        const result = await receiveAndRetryHandyTerminalDataSync(input);

        // 戻り値の syncStatus が 'pending_retry' であることを確認
        expect(result.syncStatus).toBe('pending_retry');

        // 戻り値の retryAttemptCount が 1 であることを確認
        expect(result.retryAttemptCount).toBe(1);

        // 戻り値の actualDelayMilliseconds が 5500 以上であることを確認（遅延が許容値5000msを超えていることを証明）
        expect(result.actualDelayMilliseconds).toBeGreaterThanOrEqual(5500);

        // 戻り値の workResultId が null であることを確認（再試行待機中のため記録未確定）
        expect(result.workResultId).toBeNull();

        // 戻り値の adminNotificationSent が false であることを確認（再試行上限未満のため管理者通知なし）
        expect(result.adminNotificationSent).toBe(false);

        // 戻り値の errorMessage が null であることを確認（バリデーション・致命的エラーなし）
        expect(result.errorMessage).toBeNull();

        // 戻り値の syncLogId が文字列で存在することを確認
        expect(result.syncLogId).toBeDefined();
        expect(typeof result.syncLogId).toBe('string');
        expect(result.syncLogId.length).toBeGreaterThan(0);

        // 戻り値の nextRetryScheduledDateTime が存在し、文字列であることを確認
        expect(result.nextRetryScheduledDateTime).toBeDefined();
        expect(typeof result.nextRetryScheduledDateTime).toBe('string');
        expect(result.nextRetryScheduledDateTime).not.toBeNull();

        // スタブが適切に呼ばれたことを確認（仕様の前提条件を満たしていることを示す）
        expect(validateInputFormatStub).toHaveBeenCalled();
        expect(getWorkerByIdStub).toHaveBeenCalledWith('worker-123');
        expect(getWorkInstructionByIdStub).toHaveBeenCalledWith('work-instruction-456');
        expect(saveHandyTerminalSyncLogStub).toHaveBeenCalled();

        jest.useRealTimers();
      } finally {
        // 元の実装を復元
        (handyTerminalSyncRetry as any).validateInputFormat = originalValidateInputFormat;
        (handyTerminalSyncRetry as any).getWorkerById = originalGetWorkerById;
        (handyTerminalSyncRetry as any).getWorkInstructionById = originalGetWorkInstructionById;
        (handyTerminalSyncRetry as any).saveHandyTerminalSyncLog = originalSaveHandyTerminalSyncLog;
        jest.useRealTimers();
      }
    });
  });
});