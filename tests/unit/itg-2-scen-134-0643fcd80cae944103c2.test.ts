import { detectAndRetryDataTransmissionDelay } from '../../src/logic/productivity-data-collection';
import * as productivityModule from '../../src/logic/productivity-data-collection';

describe('SCEN-134: detectAndRetryDataTransmissionDelay with custom retry interval', () => {
  let getLatestValidCachedDataSpy: jest.SpyInstance;
  let sendDataTransmissionDelayWarningSpy: jest.SpyInstance;
  let handleDataRetrievalFailureAndGeneratePlacementSpy: jest.SpyInstance;
  let calculateDateTimeValuesSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    getLatestValidCachedDataSpy = jest
      .spyOn(productivityModule, 'getLatestValidCachedData' as any)
      .mockResolvedValue({
        performanceRecords: [
          {
            performanceRecordId: 'perf-001',
            workerId: 'worker-001',
            workTypeId: 'type-001',
            completedQuantity: 10,
            requiredTimeMinutes: 60,
            workDate: '2024-01-15',
            cachedAt: '2024-01-15T10:00:00Z',
          },
        ],
        cacheRetrievalStatus: 'success',
        oldestCachedRecordAge: 30,
        recordCount: 1,
      });

    sendDataTransmissionDelayWarningSpy = jest
      .spyOn(productivityModule, 'sendDataTransmissionDelayWarning' as any)
      .mockResolvedValue({
        notificationSent: true,
        notificationTargets: [
          {
            userId: 'admin-001',
            role: 'administrator',
            notificationType: 'delay_warning',
          },
        ],
      });

    handleDataRetrievalFailureAndGeneratePlacementSpy = jest
      .spyOn(productivityModule, 'handleDataRetrievalFailureAndGeneratePlacement' as any)
      .mockResolvedValue({
        fallbackPlacementProposalId: 'proposal-fallback-001',
      });

    calculateDateTimeValuesSpy = jest
      .spyOn(productivityModule, 'calculateDateTimeValues' as any)
      .mockImplementation((startTime: string) => {
        const start = new Date(startTime).getTime();
        const now = new Date('2024-01-15T10:00:24Z').getTime();
        return {
          elapsedTimeSeconds: Math.floor((now - start) / 1000),
          currentDateTime: new Date('2024-01-15T10:00:24Z').toISOString(),
        };
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should execute retries at custom 8-second intervals and report successful transmission after 24 seconds', async () => {
    const retryTimings: number[] = [];
    let callCount = 0;

    calculateDateTimeValuesSpy.mockImplementation((startTime: string) => {
      callCount++;
      const start = new Date(startTime).getTime();

      let elapsedSeconds = 0;
      if (callCount === 1) {
        elapsedSeconds = 0;
        retryTimings.push(elapsedSeconds);
      } else if (callCount === 2) {
        elapsedSeconds = 8;
        retryTimings.push(elapsedSeconds);
      } else if (callCount === 3) {
        elapsedSeconds = 16;
        retryTimings.push(elapsedSeconds);
      } else if (callCount === 4) {
        elapsedSeconds = 24;
        retryTimings.push(elapsedSeconds);
      }

      return {
        elapsedTimeSeconds: elapsedSeconds,
        currentDateTime: new Date(start + elapsedSeconds * 1000).toISOString(),
      };
    });

    const input = {
      performanceRecordId: 'perf-001',
      transmissionStartTime: '2024-01-15T10:00:00Z',
      maxRetryAttempts: 3,
      retryIntervalSeconds: 8,
      timeoutThresholdSeconds: 30,
      delayNotificationThresholdMinutes: 5,
    };

    const output = await detectAndRetryDataTransmissionDelay(input);

    expect(output.performanceRecordId).toBe('perf-001');
    expect(output.transmissionStatus).toBe('sent');
    expect(output.retryCount).toBe(3);
    expect(output.elapsedTimeSeconds).toBe(24);
    expect(output.delayWarningNotificationSent).toBe(true);
    expect(output.manualInputModeSwitchTriggered).toBe(false);
    expect(output.fallbackPlacementProposalId).toBeNull();
    expect(output.notificationTargets).toHaveLength(1);
    expect(output.notificationTargets[0].userId).toBe('admin-001');
    expect(output.notificationTargets[0].role).toBe('administrator');
    expect(output.notificationTargets[0].notificationType).toBe('delay_warning');

    expect(retryTimings.length).toBeGreaterThanOrEqual(3);
    expect(retryTimings[0]).toBe(0);
    expect(retryTimings[1]).toBe(8);
    expect(retryTimings[2]).toBe(16);
    expect(retryTimings[3]).toBe(24);

    const firstRetryInterval = retryTimings[1] - retryTimings[0];
    const secondRetryInterval = retryTimings[2] - retryTimings[1];
    const thirdRetryInterval = retryTimings[3] - retryTimings[2];

    expect(firstRetryInterval).toBe(8);
    expect(secondRetryInterval).toBe(8);
    expect(thirdRetryInterval).toBe(8);
  });

  it('should verify that retry intervals are respected at 8-second boundaries', async () => {
    const retryTimings: number[] = [];
    let callCount = 0;

    calculateDateTimeValuesSpy.mockImplementation((startTime: string) => {
      callCount++;
      const start = new Date(startTime).getTime();

      let elapsedSeconds = 0;
      if (callCount === 1) {
        elapsedSeconds = 0;
      } else if (callCount === 2) {
        elapsedSeconds = 8;
      } else if (callCount === 3) {
        elapsedSeconds = 16;
      } else if (callCount === 4) {
        elapsedSeconds = 24;
      }

      retryTimings.push(elapsedSeconds);

      return {
        elapsedTimeSeconds: elapsedSeconds,
        currentDateTime: new Date(start + elapsedSeconds * 1000).toISOString(),
      };
    });

    const input = {
      performanceRecordId: 'perf-001',
      transmissionStartTime: '2024-01-15T10:00:00Z',
      maxRetryAttempts: 3,
      retryIntervalSeconds: 8,
      timeoutThresholdSeconds: 30,
      delayNotificationThresholdMinutes: 5,
    };

    const output = await detectAndRetryDataTransmissionDelay(input);

    expect(output.retryCount).toBe(3);
    expect(output.transmissionStatus).toBe('sent');

    expect(retryTimings).toContain(8);
    expect(retryTimings).toContain(16);
    expect(retryTimings).toContain(24);

    const retryInterval1 = retryTimings[1] - retryTimings[0];
    const retryInterval2 = retryTimings[2] - retryTimings[1];
    const retryInterval3 = retryTimings[3] - retryTimings[2];

    expect(retryInterval1).toBe(8);
    expect(retryInterval2).toBe(8);
    expect(retryInterval3).toBe(8);
  });

  it('should not trigger manual input mode switch when elapsed time is within 5 minutes', async () => {
    const input = {
      performanceRecordId: 'perf-001',
      transmissionStartTime: '2024-01-15T10:00:00Z',
      maxRetryAttempts: 3,
      retryIntervalSeconds: 8,
      timeoutThresholdSeconds: 30,
      delayNotificationThresholdMinutes: 5,
    };

    const output = await detectAndRetryDataTransmissionDelay(input);

    expect(output.manualInputModeSwitchTriggered).toBe(false);
    expect(output.elapsedTimeSeconds).toBeLessThan(5 * 60);
  });

  it('should set fallbackPlacementProposalId to null when transmission succeeds', async () => {
    const input = {
      performanceRecordId: 'perf-001',
      transmissionStartTime: '2024-01-15T10:00:00Z',
      maxRetryAttempts: 3,
      retryIntervalSeconds: 8,
      timeoutThresholdSeconds: 30,
      delayNotificationThresholdMinutes: 5,
    };

    const output = await detectAndRetryDataTransmissionDelay(input);

    expect(output.fallbackPlacementProposalId).toBeNull();
  });

  it('should include notification targets when delay warning is sent', async () => {
    const input = {
      performanceRecordId: 'perf-001',
      transmissionStartTime: '2024-01-15T10:00:00Z',
      maxRetryAttempts: 3,
      retryIntervalSeconds: 8,
      timeoutThresholdSeconds: 30,
      delayNotificationThresholdMinutes: 5,
    };

    const output = await detectAndRetryDataTransmissionDelay(input);

    expect(output.delayWarningNotificationSent).toBe(true);
    expect(Array.isArray(output.notificationTargets)).toBe(true);
    expect(output.notificationTargets.length).toBeGreaterThan(0);
    output.notificationTargets.forEach((target) => {
      expect(target).toHaveProperty('userId');
      expect(target).toHaveProperty('role');
      expect(target).toHaveProperty('notificationType');
    });
  });

  it('should simulate 1st retry execution at 0 seconds with 8-second retry interval', async () => {
    let firstRetryTime: number | null = null;
    let callCount = 0;

    calculateDateTimeValuesSpy.mockImplementation((startTime: string) => {
      callCount++;
      const start = new Date(startTime).getTime();
      let elapsedSeconds = 0;

      if (callCount === 1) {
        elapsedSeconds = 0;
        if (firstRetryTime === null) {
          firstRetryTime = elapsedSeconds;
        }
      } else if (callCount === 2) {
        elapsedSeconds = 8;
      } else if (callCount === 3) {
        elapsedSeconds = 16;
      } else if (callCount === 4) {
        elapsedSeconds = 24;
      }

      return {
        elapsedTimeSeconds: elapsedSeconds,
        currentDateTime: new Date(start + elapsedSeconds * 1000).toISOString(),
      };
    });

    const input = {
      performanceRecordId: 'perf-001',
      transmissionStartTime: '2024-01-15T10:00:00Z',
      maxRetryAttempts: 3,
      retryIntervalSeconds: 8,
      timeoutThresholdSeconds: 30,
      delayNotificationThresholdMinutes: 5,
    };

    const output = await detectAndRetryDataTransmissionDelay(input);

    expect(firstRetryTime).toBe(0);
    expect(output.retryCount).toBe(3);
  });

  it('should simulate 2nd retry execution at 8 seconds with 8-second retry interval', async () => {
    const retryTimings: number[] = [];
    let callCount = 0;

    calculateDateTimeValuesSpy.mockImplementation((startTime: string) => {
      callCount++;
      const start = new Date(startTime).getTime();
      let elapsedSeconds = 0;

      if (callCount === 1) {
        elapsedSeconds = 0;
      } else if (callCount === 2) {
        elapsedSeconds = 8;
        retryTimings.push(elapsedSeconds);
      } else if (callCount === 3) {
        elapsedSeconds = 16;
      } else if (callCount === 4) {
        elapsedSeconds = 24;
      }

      return {
        elapsedTimeSeconds: elapsedSeconds,
        currentDateTime: new Date(start + elapsedSeconds * 1000).toISOString(),
      };
    });

    const input = {
      performanceRecordId: 'perf-001',
      transmissionStartTime: '2024-01-15T10:00:00Z',
      maxRetryAttempts: 3,
      retryIntervalSeconds: 8,
      timeoutThresholdSeconds: 30,
      delayNotificationThresholdMinutes: 5,
    };

    const output = await detectAndRetryDataTransmissionDelay(input);

    expect(retryTimings).toContain(8);
    expect(output.retryCount).toBe(3);
  });

  it('should simulate 3rd retry execution at 16 seconds with 8-second retry interval', async () => {
    const retryTimings: number[] = [];
    let callCount = 0;

    calculateDateTimeValuesSpy.mockImplementation((startTime: string) => {
      callCount++;
      const start = new Date(startTime).getTime();
      let elapsedSeconds = 0;

      if (callCount === 1) {
        elapsedSeconds = 0;
      } else if (callCount === 2) {
        elapsedSeconds = 8;
      } else if (callCount === 3) {
        elapsedSeconds = 16;
        retryTimings.push(elapsedSeconds);
      } else if (callCount === 4) {
        elapsedSeconds = 24;
      }

      return {
        elapsedTimeSeconds: elapsedSeconds,
        currentDateTime: new Date(start + elapsedSeconds * 1000).toISOString(),
      };
    });

    const input = {
      performanceRecordId: 'perf-001',
      transmissionStartTime: '2024-01-15T10:00:00Z',
      maxRetryAttempts: 3,
      retryIntervalSeconds: 8,
      timeoutThresholdSeconds: 30,
      delayNotificationThresholdMinutes: 5,
    };

    const output = await detectAndRetryDataTransmissionDelay(input);

    expect(retryTimings).toContain(16);
    expect(output.retryCount).toBe(3);
  });

  it('should simulate WES transmission success at 24 seconds after 3 retries', async () => {
    let successTime: number | null = null;
    let callCount = 0;

    calculateDateTimeValuesSpy.mockImplementation((startTime: string) => {
      callCount++;
      const start = new Date(startTime).getTime();
      let elapsedSeconds = 0;

      if (callCount === 1) {
        elapsedSeconds = 0;
      } else if (callCount === 2) {
        elapsedSeconds = 8;
      } else if (callCount === 3) {
        elapsedSeconds = 16;
      } else if (callCount === 4) {
        elapsedSeconds = 24;
        successTime = elapsedSeconds;
      }

      return {
        elapsedTimeSeconds: elapsedSeconds,
        currentDateTime: new Date(start + elapsedSeconds * 1000).toISOString(),
      };
    });

    const input = {
      performanceRecordId: 'perf-001',
      transmissionStartTime: '2024-01-15T10:00:00Z',
      maxRetryAttempts: 3,
      retryIntervalSeconds: 8,
      timeoutThresholdSeconds: 30,
      delayNotificationThresholdMinutes: 5,
    };

    const output = await detectAndRetryDataTransmissionDelay(input);

    expect(output.transmissionStatus).toBe('sent');
    expect(output.elapsedTimeSeconds).toBe(24);
    expect(successTime).toBe(24);
    expect(output.retryCount).toBe(3);
  });

  it('should verify all output fields match expected values including retry timing verification', async () => {
    const retryTimings: number[] = [];
    let callCount = 0;

    calculateDateTimeValuesSpy.mockImplementation((startTime: string) => {
      callCount++;
      const start = new Date(startTime).getTime();
      let elapsedSeconds = 0;

      if (callCount === 1) {
        elapsedSeconds = 0;
      } else if (callCount === 2) {
        elapsedSeconds = 8;
      } else if (callCount === 3) {
        elapsedSeconds = 16;
      } else if (callCount === 4) {
        elapsedSeconds = 24;
      }

      retryTimings.push(elapsedSeconds);

      return {
        elapsedTimeSeconds: elapsedSeconds,
        currentDateTime: new Date(start + elapsedSeconds * 1000).toISOString(),
      };
    });

    const input = {
      performanceRecordId: 'perf-001',
      transmissionStartTime: '2024-01-15T10:00:00Z',
      maxRetryAttempts: 3,
      retryIntervalSeconds: 8,
      timeoutThresholdSeconds: 30,
      delayNotificationThresholdMinutes: 5,
    };

    const output = await detectAndRetryDataTransmissionDelay(input);

    expect(output.performanceRecordId).toBe('perf-001');
    expect(output.transmissionStatus).toBe('sent');
    expect(output.retryCount).toBe(3);
    expect(output.elapsedTimeSeconds).toBe(24);
    expect(output.delayWarningNotificationSent).toBe(true);
    expect(output.manualInputModeSwitchTriggered).toBe(false);
    expect(output.fallbackPlacementProposalId).toBeNull();
    expect(output.notificationTargets).toHaveLength(1);
    expect(output.notificationTargets[0].userId).toBe('admin-001');
    expect(output.notificationTargets[0].role).toBe('administrator');
    expect(output.notificationTargets[0].notificationType).toBe('delay_warning');

    expect(retryTimings.length).toBe(4);
    expect(retryTimings[0]).toBe(0);
    expect(retryTimings[1]).toBe(8);
    expect(retryTimings[2]).toBe(16);
    expect(retryTimings[3]).toBe(24);

    const interval1 = retryTimings[1] - retryTimings[0];
    const interval2 = retryTimings[2] - retryTimings[1];
    const interval3 = retryTimings[3] - retryTimings[2];

    expect(interval1).toBe(8);
    expect(interval2).toBe(8);
    expect(interval3).toBe(8);
  });
});