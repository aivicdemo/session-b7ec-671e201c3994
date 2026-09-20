import { detectAndRetryDataTransmissionDelay } from '../../src/logic/productivity-data-collection';
import * as productivityModule from '../../src/logic/productivity-data-collection';

describe('SCEN-122: 再試行上限到達時の処理', () => {
  it('再試行上限3回に到達した場合、再試行上限到達エラーが発生して管理者への通知対象として判定される', async () => {
    const input = {
      performanceRecordId: 'perf-001',
      transmissionStartTime: '2024-01-15T10:00:00Z',
      maxRetryAttempts: 3,
      retryIntervalSeconds: 1,
      timeoutThresholdSeconds: 2,
    };

    let apiCallCount = 0;

    // Mock external dependencies
    const mockGetLatestValidCachedData = jest.spyOn(productivityModule, 'getLatestValidCachedData' as any).mockResolvedValue({
      performanceRecords: [
        {
          performanceRecordId: 'cached-001',
          workerId: 'worker-001',
          workTypeId: 'work-type-001',
          completedQuantity: 10,
          requiredTimeMinutes: 60,
          workDate: '2024-01-15',
          cachedAt: '2024-01-15T09:55:00Z',
        },
      ],
      cacheRetrievalStatus: 'success',
      oldestCachedRecordAge: 300,
      recordCount: 1,
    });

    const mockHandleDataRetrievalFailureAndGeneratePlacement = jest
      .spyOn(productivityModule, 'handleDataRetrievalFailureAndGeneratePlacement' as any)
      .mockResolvedValue({
        fallbackPlacementProposalId: 'fallback-placement-001',
      });

    const mockCalculateDateTimeValues = jest
      .spyOn(productivityModule, 'calculateDateTimeValues' as any)
      .mockReturnValue({
        elapsedTimeSeconds: 301,
      });

    const mockSendDataTransmissionDelayWarning = jest
      .spyOn(productivityModule, 'sendDataTransmissionDelayWarning' as any)
      .mockResolvedValue({
        notificationSent: true,
      });

    const mockSendManualInputModeSwitchNotification = jest
      .spyOn(productivityModule, 'sendManualInputModeSwitchNotification' as any)
      .mockResolvedValue({
        notificationSent: true,
      });

    // Mock WES transmission to fail on each retry attempt with specific error types
    const mockWESTransmission = jest.fn().mockImplementation(async () => {
      apiCallCount++;

      if (apiCallCount === 1) {
        const error = new Error('API transmission failed');
        error.name = 'DataTransmissionAPIError';
        throw error;
      }
      if (apiCallCount === 2) {
        const error = new Error('Transmission timeout');
        error.name = 'DataTransmissionTimeoutError';
        throw error;
      }
      if (apiCallCount === 3) {
        const error = new Error('API transmission failed');
        error.name = 'DataTransmissionAPIError';
        throw error;
      }
      if (apiCallCount >= 4) {
        throw new Error('Should not reach 4th API call');
      }
    });

    // Mock module functions that interact with WES
    jest.spyOn(productivityModule, 'transmitDataToWES' as any).mockImplementation(mockWESTransmission);

    let result: any;
    let thrownError: any;

    try {
      result = await detectAndRetryDataTransmissionDelay(input);
    } catch (error: any) {
      thrownError = error;
    }

    // Verify that exactly 3 API calls were made (no 4th attempt)
    expect(apiCallCount).toBe(3);
    expect(mockWESTransmission).toHaveBeenCalledTimes(3);

    // Verify error was thrown
    expect(thrownError).toBeDefined();

    // Verify error details
    expect(thrownError.name).toBe('RetryExhaustedError');
    expect(thrownError.message).toBe(
      'Data transmission retry attempts exhausted; manual intervention required.'
    );

    // Verify output object properties attached to error or returned within error
    const outputData = thrownError.output || thrownError;
    
    expect(outputData.performanceRecordId).toBe('perf-001');
    expect(outputData.transmissionStatus).toBe('retry_exhausted');
    expect(outputData.retryCount).toBe(3);
    expect(outputData.delayWarningNotificationSent).toBe(true);
    expect(outputData.manualInputModeSwitchTriggered).toBe(true);

    // Verify notification targets
    expect(outputData.notificationTargets).toBeDefined();
    expect(Array.isArray(outputData.notificationTargets)).toBe(true);
    expect(outputData.notificationTargets.length).toBeGreaterThan(0);

    // Verify at least one administrator notification target exists
    const administratorNotification = outputData.notificationTargets.find(
      (target: any) => target.role === 'administrator'
    );
    expect(administratorNotification).toBeDefined();
    expect(administratorNotification.userId).toBeTruthy();
    expect(administratorNotification.notificationType).toBe('retry_exhausted');

    // Verify fallback placement proposal was generated
    expect(outputData.fallbackPlacementProposalId).toBeTruthy();
    expect(typeof outputData.fallbackPlacementProposalId).toBe('string');

    // Verify mocked dependencies were called appropriately
    expect(mockGetLatestValidCachedData).toHaveBeenCalled();
    expect(mockHandleDataRetrievalFailureAndGeneratePlacement).toHaveBeenCalled();
    expect(mockCalculateDateTimeValues).toHaveBeenCalled();
    expect(mockSendDataTransmissionDelayWarning).toHaveBeenCalled();
    expect(mockSendManualInputModeSwitchNotification).toHaveBeenCalled();

    // Clean up all spies
    jest.restoreAllMocks();
  });
});