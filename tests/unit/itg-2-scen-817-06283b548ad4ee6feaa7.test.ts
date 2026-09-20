import { notifyPerformanceDataSaved } from '../../src/logic/notification-and-integration';

describe('SCEN-817: notifyPerformanceDataSaved - 配置最適化エンジントリガーを無効化した場合', () => {
  it('should return placementOptimizationTriggerId as null when triggerPlacementOptimization is false', async () => {
    const input = {
      performanceRecordId: 'REC-001',
      workerId: 'WKR-123',
      workerName: '山田太郎',
      siteId: 'SITE-01',
      teamId: 'TEAM-A',
      departmentId: 'DEPT-001',
      workDate: '2025-01-15',
      completedQuantity: 150,
      workTypeId: 'WT-001',
      qualityScore: 95,
      savedAt: '2025-01-15T14:30:00Z',
      requestedBy: 'USR-001',
      triggerProgressMonitoring: true,
      triggerPlacementOptimization: false,
      syncWithExternalSystems: true,
      notifyAdministrator: true,
    };

    const result = await notifyPerformanceDataSaved(input);

    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe('REC-001');
    expect(result.placementOptimizationTriggerId).toBeNull();
    expect(result.progressMonitoringTriggerId).not.toBeNull();
    expect(result.notificationTrackingId).not.toBeNull();
    expect(result.dataSynchronizationTrackingId).not.toBeNull();
    expect(result.processedAt).toBeTruthy();
    
    const processedTime = new Date(result.processedAt);
    const callTime = new Date();
    expect(processedTime.getTime()).toBeLessThanOrEqual(callTime.getTime() + 1000);
    
    expect(
      result.partialFailures === undefined || Array.isArray(result.partialFailures)
    ).toBe(true);
    if (Array.isArray(result.partialFailures)) {
      expect(result.partialFailures.length).toBe(0);
    }
    
    expect(result.errorMessage).toBeNull();
  });
});