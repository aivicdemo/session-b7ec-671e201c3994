import { notifyPerformanceDataSaved } from '../../src/logic/notification-and-integration';
import * as notificationModule from '../../src/logic/notification-and-integration';

describe('SCEN-814: notifyPerformanceDataSaved - Error Handling with Partial Failures', () => {
  let mockSynchronizeDataWithWESAndWMS: jest.Mock;
  let mockSendNotificationToAdministrator: jest.Mock;
  let mockRegisterScheduledJobTrigger: jest.Mock;

  beforeEach(() => {
    mockSynchronizeDataWithWESAndWMS = jest.fn();
    mockSendNotificationToAdministrator = jest.fn();
    mockRegisterScheduledJobTrigger = jest.fn();

    jest.spyOn(notificationModule, 'synchronizeDataWithWESAndWMS').mockImplementation(mockSynchronizeDataWithWESAndWMS);
    jest.spyOn(notificationModule, 'sendNotificationToAdministrator').mockImplementation(mockSendNotificationToAdministrator);
    jest.spyOn(notificationModule, 'registerScheduledJobTrigger').mockImplementation(mockRegisterScheduledJobTrigger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return success=true with partial failure info when data synchronization fails', async () => {
    // Stub synchronizeDataWithWESAndWMS to throw DataSynchronizationFailure error
    mockSynchronizeDataWithWESAndWMS.mockRejectedValue(
      new Error('外部システムとのデータ同期に失敗しました。')
    );

    // Stub sendNotificationToAdministrator to return notification tracking ID
    mockSendNotificationToAdministrator.mockResolvedValue({
      success: true,
      trackingId: 'notif-tracking-001',
      sentAt: new Date().toISOString(),
      deliveryChannel: 'EMAIL',
      errorMessage: null,
    });

    // Stub registerScheduledJobTrigger to return trigger IDs
    mockRegisterScheduledJobTrigger
      .mockResolvedValueOnce({
        success: true,
        jobExecutionId: 'progress-trigger-001',
        jobId: 'progress-job',
        executionStatus: 'QUEUED',
        registeredAt: new Date().toISOString(),
        errorMessage: null,
      })
      .mockResolvedValueOnce({
        success: true,
        jobExecutionId: 'placement-trigger-001',
        jobId: 'placement-job',
        executionStatus: 'QUEUED',
        registeredAt: new Date().toISOString(),
        errorMessage: null,
      });

    const input = {
      performanceRecordId: 'perf-001',
      workerId: 'worker-123',
      workerName: '山田太郎',
      siteId: 'site-001',
      teamId: 'team-001',
      departmentId: 'dept-001',
      workDate: '2024-01-15',
      completedQuantity: 150,
      workTypeId: 'type-001',
      qualityScore: 85,
      savedAt: '2024-01-15T14:30:00Z',
      requestedBy: 'user-001',
      triggerProgressMonitoring: true,
      triggerPlacementOptimization: true,
      syncWithExternalSystems: true,
      notifyAdministrator: true,
    };

    const result = await notifyPerformanceDataSaved(input);

    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe('perf-001');
    expect(result.notificationTrackingId).toBe('notif-tracking-001');
    expect(result.progressMonitoringTriggerId).toBe('progress-trigger-001');
    expect(result.placementOptimizationTriggerId).toBe('placement-trigger-001');
    expect(result.dataSynchronizationTrackingId).toBeNull();
    expect(result.processedAt).toBeDefined();
    expect(new Date(result.processedAt)).toBeInstanceOf(Date);
    expect(result.partialFailures).toBeDefined();
    expect(Array.isArray(result.partialFailures)).toBe(true);
    expect(result.partialFailures?.length).toBe(1);
    expect(result.partialFailures?.[0]?.component).toBe('DATA_SYNCHRONIZATION');
    expect(result.partialFailures?.[0]?.failureReason).toContain('外部システムとのデータ同期に失敗しました');
    expect(result.partialFailures?.[0]?.retryable).toBe(true);
    expect(result.errorMessage).toBeNull();
  });
});