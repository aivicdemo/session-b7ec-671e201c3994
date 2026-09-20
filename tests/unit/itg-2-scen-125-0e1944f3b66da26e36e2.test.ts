import { detectAndRetryDataTransmissionDelay } from '../../src/logic/productivity-data-collection';
import * as productivityModule from '../../src/logic/productivity-data-collection';

describe('SCEN-125: キャッシュデータが存在しない場合、キャッシュ取得エラーが発生する', () => {
  it('should throw CacheRetrievalFailureError when no valid cached data is available', async () => {
    const performanceRecordId = 'perf-001';
    const transmissionStartTime = '2024-01-15T10:00:00Z';
    const maxRetryAttempts = 3;
    const retryIntervalSeconds = 5;
    const timeoutThresholdSeconds = 30;
    const delayNotificationThresholdMinutes = 5;

    jest.spyOn(productivityModule, 'getLatestValidCachedData' as any).mockResolvedValue(null);

    await expect(
      detectAndRetryDataTransmissionDelay({
        performanceRecordId,
        transmissionStartTime,
        maxRetryAttempts,
        retryIntervalSeconds,
        timeoutThresholdSeconds,
        delayNotificationThresholdMinutes,
      })
    ).rejects.toThrow('No valid cached data available for fallback placement generation.');

    await expect(
      detectAndRetryDataTransmissionDelay({
        performanceRecordId,
        transmissionStartTime,
        maxRetryAttempts,
        retryIntervalSeconds,
        timeoutThresholdSeconds,
        delayNotificationThresholdMinutes,
      })
    ).rejects.toMatchObject({
      name: 'CacheRetrievalFailureError',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});