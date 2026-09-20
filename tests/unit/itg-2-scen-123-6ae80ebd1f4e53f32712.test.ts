import { detectAndRetryDataTransmissionDelay } from '../../src/logic/productivity-data-collection';
import { DetectAndRetryDataTransmissionDelayInput, DetectAndRetryDataTransmissionDelayOutput } from '../../src/logic/productivity-data-collection';
import * as productivityModule from '../../src/logic/productivity-data-collection';

describe('SCEN-123: タイムアウト後に再試行が開始され、再試行回数が記録される', () => {
  it('WES送信がタイムアウトしたときに再試行を実行し、上限に達した場合に再試行上限ステータスを返す', async () => {
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
    const currentTime = new Date();
    
    const input: DetectAndRetryDataTransmissionDelayInput = {
      performanceRecordId: 'perf-rec-001',
      transmissionStartTime: thirtySecondsAgo,
      maxRetryAttempts: 3,
      retryIntervalSeconds: 5,
      timeoutThresholdSeconds: 30,
      delayNotificationThresholdMinutes: 5,
    };

    // Mock getLatestValidCachedData to return valid cache data within 5 minutes
    jest.spyOn(productivityModule, 'getLatestValidCachedData' as any).mockResolvedValue({
      performanceRecords: [
        {
          performanceRecordId: 'perf-rec-001',
          workerId: 'worker-001',
          workTypeId: 'type-001',
          completedQuantity: 10,
          requiredTimeMinutes: 60,
          workDate: '2024-01-15',
          cachedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        },
      ],
      cacheRetrievalStatus: 'success',
      oldestCachedRecordAge: 120,
      recordCount: 1,
    });

    // Mock calculateDateTimeValues to return precise elapsed time calculation
    const elapsedSeconds = Math.floor((currentTime.getTime() - new Date(thirtySecondsAgo).getTime()) / 1000);
    jest.spyOn(productivityModule, 'calculateDateTimeValues' as any).mockReturnValue({
      currentTime: currentTime,
      elapsedTimeSeconds: elapsedSeconds,
      isWithinThreshold: elapsedSeconds < 30,
    });

    // Mock sendDataTransmissionDelayWarning to record notification sending
    const sendWarningMock = jest.spyOn(productivityModule, 'sendDataTransmissionDelayWarning' as any).mockResolvedValue({
      notificationSent: true,
      targets: [
        { userId: 'admin-001', role: 'administrator', notificationType: 'delay_warning' },
      ],
    });

    // Mock WES API to throw DataTransmissionTimeoutError on 1st, 2nd, 3rd attempts
    let attemptCount = 0;
    jest.spyOn(productivityModule, 'sendDataToWES' as any).mockImplementation(() => {
      attemptCount++;
      if (attemptCount === 1 || attemptCount === 2 || attemptCount === 3) {
        // 1st call, 2nd call (1st retry), 3rd call (2nd retry) all fail with timeout
        const error = new Error('WES data transmission exceeded 30-second timeout threshold.');
        (error as any).name = 'DataTransmissionTimeoutError';
        throw error;
      }
      // Should not reach 4th call if maxRetryAttempts=3
      const error = new Error('Data transmission retry attempts exhausted; manual intervention required.');
      (error as any).name = 'RetryExhaustedError';
      throw error;
    });

    const result: DetectAndRetryDataTransmissionDelayOutput = await detectAndRetryDataTransmissionDelay(input);

    expect(result.performanceRecordId).toBe('perf-rec-001');
    expect(result.transmissionStatus).toBe('retry_exhausted');
    expect(result.retryCount).toBe(3);
    expect(result.elapsedTimeSeconds).toBeGreaterThanOrEqual(30);
    expect(result.delayWarningNotificationSent).toBe(true);
    expect(result.manualInputModeSwitchTriggered).toBe(true);
    
    // Verify notificationTargets contains administrator
    expect(result.notificationTargets).toBeDefined();
    expect(result.notificationTargets.length).toBeGreaterThan(0);
    expect(result.notificationTargets).toContainEqual(
      expect.objectContaining({
        userId: 'admin-001',
        role: 'administrator',
        notificationType: 'delay_warning',
      })
    );
    
    expect(sendWarningMock).toHaveBeenCalled();
  });
});