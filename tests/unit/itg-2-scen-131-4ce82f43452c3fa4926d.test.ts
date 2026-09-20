import { detectAndRetryDataTransmissionDelay } from '../../src/logic/productivity-data-collection';

describe('SCEN-131: 送信開始から経過した時間が正確に記録される', () => {
  it('should record elapsedTimeSeconds as exactly 10 seconds from transmissionStartTime', async () => {
    // Arrange
    const now = new Date('2025-01-15T10:00:00Z');
    const transmissionStartTime = new Date(now.getTime() - 10000).toISOString(); // 10秒前
    const performanceRecordId = 'perf-rec-123';

    jest.useFakeTimers();
    jest.setSystemTime(now);

    const input = {
      performanceRecordId,
      transmissionStartTime,
      maxRetryAttempts: 3,
      retryIntervalSeconds: 5,
      timeoutThresholdSeconds: 30,
      delayNotificationThresholdMinutes: 5,
    };

    // Act
    const output = await detectAndRetryDataTransmissionDelay(input);

    // Assert
    expect(output.elapsedTimeSeconds).toBe(10);
    expect(output.performanceRecordId).toBe(performanceRecordId);
    expect(typeof output.transmissionStatus).toBe('string');
    expect(typeof output.retryCount).toBe('number');
    expect(typeof output.delayWarningNotificationSent).toBe('boolean');
    expect(typeof output.manualInputModeSwitchTriggered).toBe('boolean');
    expect(Array.isArray(output.notificationTargets)).toBe(true);

    jest.useRealTimers();
  });

  it('should accurately calculate elapsed time for various time differences', async () => {
    // Arrange
    const testCases = [
      { elapsedSeconds: 0 },
      { elapsedSeconds: 5 },
      { elapsedSeconds: 15 },
      { elapsedSeconds: 29 },
      { elapsedSeconds: 30 },
      { elapsedSeconds: 35 },
    ];

    jest.useFakeTimers();

    for (const testCase of testCases) {
      const now = new Date('2025-01-15T10:00:00Z');
      const transmissionStartTime = new Date(
        now.getTime() - testCase.elapsedSeconds * 1000,
      ).toISOString();

      jest.setSystemTime(now);

      const input = {
        performanceRecordId: `perf-rec-${testCase.elapsedSeconds}`,
        transmissionStartTime,
        maxRetryAttempts: 3,
        retryIntervalSeconds: 5,
        timeoutThresholdSeconds: 30,
        delayNotificationThresholdMinutes: 5,
      };

      // Act
      const output = await detectAndRetryDataTransmissionDelay(input);

      // Assert
      expect(output.elapsedTimeSeconds).toBe(testCase.elapsedSeconds);
    }

    jest.useRealTimers();
  });

  it('should maintain elapsedTimeSeconds precision with ISO 8601 timestamps', async () => {
    // Arrange
    jest.useFakeTimers();
    const now = new Date('2025-01-15T10:00:00.000Z');
    jest.setSystemTime(now);

    const transmissionStartTime = '2025-01-15T09:59:50.500Z'; // 9.5秒前
    const performanceRecordId = 'perf-rec-precision-test';

    const input = {
      performanceRecordId,
      transmissionStartTime,
      maxRetryAttempts: 3,
      retryIntervalSeconds: 5,
      timeoutThresholdSeconds: 30,
      delayNotificationThresholdMinutes: 5,
    };

    // Act
    const output = await detectAndRetryDataTransmissionDelay(input);

    // Assert
    // 許容誤差: ±1秒
    expect(output.elapsedTimeSeconds).toBeGreaterThanOrEqual(9);
    expect(output.elapsedTimeSeconds).toBeLessThanOrEqual(10);

    jest.useRealTimers();
  });
});