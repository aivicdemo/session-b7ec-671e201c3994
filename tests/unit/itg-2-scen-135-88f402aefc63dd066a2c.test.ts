import { detectAndRetryDataTransmissionDelay } from '../../src/logic/productivity-data-collection';

describe('SCEN-135: カスタムの手動入力モード切り替え判定遅延閾値が指定された場合、その値に基づいて手動モード切り替えが判定される', () => {
  it('should trigger manual input mode switch when delay exceeds custom threshold of 10 minutes', async () => {
    const performanceRecordId = 'PERF-001';
    const transmissionStartTime = '2024-01-15T10:00:00Z';
    const maxRetryAttempts = 3;
    const retryIntervalSeconds = 5;
    const timeoutThresholdSeconds = 30;
    const delayNotificationThresholdMinutes = 10;

    const mockCurrentTime = new Date('2024-01-15T10:10:30Z');
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentTime);

    const result = await detectAndRetryDataTransmissionDelay({
      performanceRecordId,
      transmissionStartTime,
      maxRetryAttempts,
      retryIntervalSeconds,
      timeoutThresholdSeconds,
      delayNotificationThresholdMinutes,
    });

    jest.useRealTimers();

    expect(result.performanceRecordId).toBe('PERF-001');
    expect(result.transmissionStatus).toBe('retry_exhausted');
    expect(result.retryCount).toBe(3);
    expect(result.elapsedTimeSeconds).toBe(630);
    expect(result.delayWarningNotificationSent).toBe(true);
    expect(result.manualInputModeSwitchTriggered).toBe(true);
    expect(result.notificationTargets).toBeDefined();
    expect(result.notificationTargets.length).toBeGreaterThan(0);
    expect(
      result.notificationTargets.some((target) => target.role === 'admin')
    ).toBe(true);

    const elapsedSeconds = 630;
    const thresholdSeconds = delayNotificationThresholdMinutes * 60;
    expect(elapsedSeconds).toBeGreaterThan(thresholdSeconds);
    expect(result.manualInputModeSwitchTriggered).toBe(true);
  });
});