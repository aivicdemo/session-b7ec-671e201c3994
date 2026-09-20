import { detectAndRetryDataTransmissionDelay } from '../../src/logic/productivity-data-collection';
import * as productivityModule from '../../src/logic/productivity-data-collection';

describe('SCEN-119: WES送信遅延検知・再試行・通知判定', () => {
  describe('送信開始から30秒以内に正常にWESへ送信完了した場合', () => {
    it('送信状態が成功で返される', async () => {
      const mockCalculateDateTimeValues = jest.spyOn(productivityModule as any, 'calculateDateTimeValues' as any).mockReturnValue({
        currentTime: new Date('2024-01-15T10:00:15Z'),
        elapsedSeconds: 15,
      });

      const mockWESApi = jest.spyOn(productivityModule as any, 'callWESTransmissionAPI' as any).mockResolvedValue({
        success: true,
        statusCode: 200,
      });

      const input = {
        performanceRecordId: 'perf-001',
        transmissionStartTime: '2024-01-15T10:00:00Z',
        timeoutThresholdSeconds: 30,
        maxRetryAttempts: 3,
        retryIntervalSeconds: 5,
        delayNotificationThresholdMinutes: 5,
      };

      const result = await detectAndRetryDataTransmissionDelay(input);

      expect(result).toBeDefined();
      expect(result.performanceRecordId).toBe('perf-001');
      expect(result.transmissionStatus).toBe('sent');
      expect(result.retryCount).toBe(0);
      expect(result.elapsedTimeSeconds).toBe(15);
      expect(result.delayWarningNotificationSent).toBe(false);
      expect(result.manualInputModeSwitchTriggered).toBe(false);
      expect(result.fallbackPlacementProposalId).toBeNull();
      expect(result.notificationTargets).toEqual([]);

      mockCalculateDateTimeValues.mockRestore();
      mockWESApi.mockRestore();
    });
  });
});