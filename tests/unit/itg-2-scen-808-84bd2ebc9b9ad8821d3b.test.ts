import { notifyPerformanceDataSaved } from '../../src/logic/notification-and-integration';
import type {
  NotifyPerformanceDataSavedInput,
  NotifyPerformanceDataSavedOutput,
  SendNotificationToAdministratorInput,
  SendNotificationToAdministratorOutput,
  RegisterScheduledJobTriggerInput,
  RegisterScheduledJobTriggerOutput,
  SynchronizeDataWithWESAndWMSInput,
  SynchronizeDataWithWESAndWMSOutput,
} from '../../src/logic/notification-and-integration';
import * as notificationAndIntegrationModule from '../../src/logic/notification-and-integration';

describe('SCEN-808: 正常系：すべてのトリガーを有効にして実績データ保存通知を処理し、全トリガーが成功する', () => {
  let mockSendNotificationToAdministrator: jest.SpyInstance;
  let mockRegisterScheduledJobTrigger: jest.SpyInstance;
  let mockSynchronizeDataWithWESAndWMS: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSendNotificationToAdministrator = jest.spyOn(notificationAndIntegrationModule, 'sendNotificationToAdministrator').mockResolvedValue({
      success: true,
      trackingId: 'notif-tracking-001',
      sentAt: new Date().toISOString(),
      deliveryChannel: 'SYSTEM_NOTIFICATION',
      errorMessage: null,
    } as SendNotificationToAdministratorOutput);

    mockRegisterScheduledJobTrigger = jest.spyOn(notificationAndIntegrationModule, 'registerScheduledJobTrigger').mockResolvedValue({
      success: true,
      jobExecutionId: 'job-exec-001',
      jobId: 'PROGRESS_MONITORING',
      executionStatus: 'REGISTERED',
      registeredAt: new Date().toISOString(),
      errorMessage: null,
    } as RegisterScheduledJobTriggerOutput);

    mockSynchronizeDataWithWESAndWMS = jest.spyOn(notificationAndIntegrationModule, 'synchronizeDataWithWESAndWMS').mockResolvedValue({
      success: true,
      syncTrackingId: 'sync-tracking-001',
      syncStartedAt: new Date().toISOString(),
      syncCompletedAt: new Date().toISOString(),
      systemSyncResults: [
        {
          systemName: 'WES',
          syncSuccess: true,
          recordsReceived: 10,
          recordsTransmitted: 10,
          recordsProcessed: 10,
          errorCount: 0,
          lastSyncTime: new Date().toISOString(),
        },
        {
          systemName: 'WMS',
          syncSuccess: true,
          recordsReceived: 10,
          recordsTransmitted: 10,
          recordsProcessed: 10,
          errorCount: 0,
          lastSyncTime: new Date().toISOString(),
        },
      ],
      dataItemsSyncStatus: [
        {
          dataItemId: 'item-001',
          dataItemName: 'Performance Data',
          syncStatus: 'SUCCESS',
          recordsProcessed: 20,
          recordsFailed: 0,
          failureReason: null,
        },
      ],
      totalRecordsSynced: 20,
      totalRecordsFailed: 0,
      retryQueuedItems: 0,
      syncDurationSeconds: 5,
      errorMessage: null,
    } as SynchronizeDataWithWESAndWMSOutput);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('すべてのトリガーを有効にした入力を準備する', () => {
    const input: NotifyPerformanceDataSavedInput = {
      performanceRecordId: 'REC-001',
      workerId: 'W001',
      workerName: '山田太郎',
      siteId: 'SITE-001',
      teamId: 'TEAM-001',
      departmentId: 'DEPT-001',
      workDate: '2024-01-15T00:00:00Z',
      completedQuantity: 150,
      workTypeId: 'TYPE-001',
      qualityScore: 95,
      savedAt: '2024-01-15T14:30:00Z',
      requestedBy: 'USR-001',
      triggerProgressMonitoring: true,
      triggerPlacementOptimization: true,
      syncWithExternalSystems: true,
      notifyAdministrator: true,
    };

    expect(input.performanceRecordId).toBe('REC-001');
    expect(input.workerId).toBe('W001');
    expect(input.workerName).toBe('山田太郎');
    expect(input.triggerProgressMonitoring).toBe(true);
    expect(input.triggerPlacementOptimization).toBe(true);
    expect(input.syncWithExternalSystems).toBe(true);
    expect(input.notifyAdministrator).toBe(true);
  });

  test('notifyPerformanceDataSaved関数を呼び出し、成功応答を取得する', async () => {
    const input: NotifyPerformanceDataSavedInput = {
      performanceRecordId: 'REC-001',
      workerId: 'W001',
      workerName: '山田太郎',
      siteId: 'SITE-001',
      teamId: 'TEAM-001',
      departmentId: 'DEPT-001',
      workDate: '2024-01-15T00:00:00Z',
      completedQuantity: 150,
      workTypeId: 'TYPE-001',
      qualityScore: 95,
      savedAt: '2024-01-15T14:30:00Z',
      requestedBy: 'USR-001',
      triggerProgressMonitoring: true,
      triggerPlacementOptimization: true,
      syncWithExternalSystems: true,
      notifyAdministrator: true,
    };

    const result = await notifyPerformanceDataSaved(input);

    // 戻り値のsuccessフィールドがtrueであることを確認
    expect(result.success).toBe(true);

    // 戻り値のperformanceRecordIdが'REC-001'であることを確認
    expect(result.performanceRecordId).toBe('REC-001');

    // 戻り値のnotificationTrackingIdが空でない文字列であることを確認
    expect(result.notificationTrackingId).toBeTruthy();
    expect(typeof result.notificationTrackingId).toBe('string');
    expect(result.notificationTrackingId.length).toBeGreaterThan(0);

    // 戻り値のprogressMonitoringTriggerIdが空でない文字列であることを確認
    expect(result.progressMonitoringTriggerId).toBeTruthy();
    expect(typeof result.progressMonitoringTriggerId).toBe('string');
    expect(result.progressMonitoringTriggerId.length).toBeGreaterThan(0);

    // 戻り値のplacementOptimizationTriggerIdが空でない文字列であることを確認
    expect(result.placementOptimizationTriggerId).toBeTruthy();
    expect(typeof result.placementOptimizationTriggerId).toBe('string');
    expect(result.placementOptimizationTriggerId.length).toBeGreaterThan(0);

    // 戻り値のdataSynchronizationTrackingIdが空でない文字列であることを確認
    expect(result.dataSynchronizationTrackingId).toBeTruthy();
    expect(typeof result.dataSynchronizationTrackingId).toBe('string');
    expect(result.dataSynchronizationTrackingId.length).toBeGreaterThan(0);

    // 戻り値のprocessedAtがISO 8601形式の日時文字列であることを確認
    expect(result.processedAt).toBeTruthy();
    expect(typeof result.processedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.processedAt)).toBe(true);

    // 戻り値のpartialFailuresが空の配列であることを確認
    expect(Array.isArray(result.partialFailures)).toBe(true);
    expect(result.partialFailures).toHaveLength(0);

    // 戻り値のerrorMessageがnullであることを確認
    expect(result.errorMessage).toBeNull();
  });
});