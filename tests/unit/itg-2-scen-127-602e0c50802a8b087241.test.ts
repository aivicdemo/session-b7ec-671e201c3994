import { detectAndRetryDataTransmissionDelay } from '../../src/logic/productivity-data-collection';
import * as productivityDataCollection from '../../src/logic/productivity-data-collection';

jest.mock('../../src/logic/productivity-data-collection', () => ({
  ...jest.requireActual('../../src/logic/productivity-data-collection'),
  getLatestValidCachedData: jest.fn(),
  calculateDateTimeValues: jest.fn(),
  sendManualInputModeSwitchNotification: jest.fn(),
}));

describe('SCEN-127: 遅延時間が5分を超えた場合、手動入力モード切り替えが実行される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should execute manual input mode switch when delay exceeds 5 minutes', async () => {
    const performanceRecordId = 'perf_001';
    const transmissionStartTime = '2025-01-15T10:00:00Z';
    const maxRetryAttempts = 3;
    const retryIntervalSeconds = 5;
    const timeoutThresholdSeconds = 30;
    const delayNotificationThresholdMinutes = 5;

    // getLatestValidCachedDataスタブ設定
    (productivityDataCollection.getLatestValidCachedData as jest.Mock).mockResolvedValue({
      performanceRecords: [
        {
          performanceRecordId: 'perf_001',
          workerId: 'worker_001',
          workTypeId: 'type_001',
          completedQuantity: 100,
          requiredTimeMinutes: 50,
          workDate: '2025-01-15',
          cachedAt: '2025-01-15T10:00:00Z',
        },
      ],
      cacheRetrievalStatus: 'success',
      oldestCachedRecordAge: 301,
      recordCount: 1,
    });

    // calculateDateTimeValuesスタブ設定
    (productivityDataCollection.calculateDateTimeValues as jest.Mock).mockReturnValue({
      currentTime: '2025-01-15T10:05:31Z',
      elapsedSeconds: 331,
    });

    // sendManualInputModeSwitchNotificationスタブ設定
    (productivityDataCollection.sendManualInputModeSwitchNotification as jest.Mock).mockResolvedValue({
      notificationSent: true,
    });

    const result = await detectAndRetryDataTransmissionDelay({
      performanceRecordId,
      transmissionStartTime,
      maxRetryAttempts,
      retryIntervalSeconds,
      timeoutThresholdSeconds,
      delayNotificationThresholdMinutes,
    });

    expect(result).toBeDefined();
    expect(result.performanceRecordId).toBe('perf_001');

    expect(result.transmissionStatus).toBe('fallback_generated');

    expect(result.retryCount).toBe(0);

    expect(result.elapsedTimeSeconds).toBe(331);

    expect(result.delayWarningNotificationSent).toBe(true);

    expect(result.manualInputModeSwitchTriggered).toBe(true);

    expect(result.fallbackPlacementProposalId).not.toBeNull();
    expect(typeof result.fallbackPlacementProposalId).toBe('string');

    expect(result.notificationTargets).toBeDefined();
    expect(Array.isArray(result.notificationTargets)).toBe(true);
    expect(result.notificationTargets.length).toBeGreaterThan(0);

    const hasAdminTarget = result.notificationTargets.some(target =>
      target.role && target.role.toLowerCase().includes('admin')
    );
    expect(hasAdminTarget).toBe(true);
  });
});