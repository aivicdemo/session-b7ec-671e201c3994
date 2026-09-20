import { receiveAndRetryHandyTerminalDataSync } from '../../src/logic/handy-terminal-sync-retry';
import * as logger from '../../src/infrastructure/logger';

jest.mock('../../src/infrastructure/logger');

describe('SCEN-330: ハンディターミナルリアルタイムデータ送信 - システム時刻不正検知', () => {
  describe('現在時刻が送信開始時刻より前の場合', () => {
    it('システム時刻の不正を警告して処理を継続する', async () => {
      // 現在時刻をモック：2024-01-15T09:05:00Z = 1705316700000ms
      const currentTimeMs = 1705316700000;
      // 送信タイムスタンプを過去に設定：60秒以上前
      const pastTimeMs = currentTimeMs - 61000;
      const pastDateTime = new Date(pastTimeMs).toISOString();

      const input = {
        workerId: 'W001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T09:00:00Z',
        completedQuantity: 10,
        defectiveQuantity: 0,
        remarks: '',
        handyTerminalId: 'HT001',
        transmissionTimestamp: pastDateTime,
        allowableDelayMilliseconds: 5000,
        maxRetryAttempts: 3,
        retryIntervalMilliseconds: 1000,
      };

      // Date.now() をモックして現在時刻を固定
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => currentTimeMs);

      try {
        const result = await receiveAndRetryHandyTerminalDataSync(input);

        expect(result).toBeDefined();

        expect(['success', 'pending_retry']).toContain(result.syncStatus);

        expect(result.errorMessage).toBeNull();

        // actualDelayMilliseconds が負の値であることを検証
        expect(result.actualDelayMilliseconds).toBeLessThan(0);

        expect(result.workResultId).not.toBeNull();
        expect(typeof result.workResultId).toBe('string');

        expect(result.processedDateTime).toBeDefined();
        expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.processedDateTime)).toBe(true);

        expect(result.adminNotificationSent).toBe(false);

        expect(result.syncLogId).toBeDefined();
        expect(typeof result.syncLogId).toBe('string');

        // ログに警告メッセージが記録されていることを検証
        expect(logger.warn).toHaveBeenCalled();
        const warnCalls = (logger.warn as jest.Mock).mock.calls;
        const hasSystemTimeWarning = warnCalls.some(call => 
          typeof call[0] === 'string' && 
          call[0].includes('システム時刻が不正です')
        );
        expect(hasSystemTimeWarning).toBe(true);
      } finally {
        Date.now = originalDateNow;
      }
    });
  });
});