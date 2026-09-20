import { notifyPerformanceDataSaved } from '../../src/logic/notification-and-integration';

describe('SCEN-820: notifyPerformanceDataSaved - 複数のトリガーが部分的に失敗した場合', () => {
  it('全体成功で複数の部分失敗情報を含めて返す', async () => {
    const result = await notifyPerformanceDataSaved({
      performanceRecordId: 'PERF-20250115-001',
      workerId: 'WKR-001',
      workerName: '山田太郎',
      siteId: 'SITE-001',
      teamId: 'TEAM-A',
      departmentId: 'DEPT-01',
      workDate: '2025-01-15',
      completedQuantity: 150,
      workTypeId: 'WTYPE-01',
      qualityScore: 92,
      savedAt: '2025-01-15T14:30:00Z',
      requestedBy: 'USR-ADMIN-001',
      triggerProgressMonitoring: true,
      triggerPlacementOptimization: true,
      syncWithExternalSystems: true,
      notifyAdministrator: true,
    });

    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe('PERF-20250115-001');
    expect(result.notificationTrackingId).toBe('NOTIF-TRACK-001');
    expect(result.progressMonitoringTriggerId).toBeNull();
    expect(result.placementOptimizationTriggerId).toBe('OPT-TRIGGER-001');
    expect(result.dataSynchronizationTrackingId).toBeNull();
    expect(result.processedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(result.partialFailures).toBeDefined();
    expect(result.partialFailures).toHaveLength(2);
    expect(result.partialFailures?.[0].component).toBe('PROGRESS_MONITORING_TRIGGER');
    expect(result.partialFailures?.[0].failureReason).toBe('進捗監視エンジンへのトリガー発火に失敗しました。');
    expect(result.partialFailures?.[1].component).toBe('DATA_SYNCHRONIZATION');
    expect(result.partialFailures?.[1].failureReason).toBe('外部システムとのデータ同期に失敗しました。');
    expect(result.errorMessage).toBeNull();
  });
});