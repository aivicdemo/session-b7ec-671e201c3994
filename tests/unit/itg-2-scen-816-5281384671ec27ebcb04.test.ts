import { notifyPerformanceDataSaved } from '../../src/logic/notification-and-integration';

describe('SCEN-816: notifyPerformanceDataSaved with progress monitoring disabled', () => {
  it('should return null progressMonitoringTriggerId when triggerProgressMonitoring is false', async () => {
    const input = {
      performanceRecordId: 'REC-20250115-001',
      workerId: 'WKR-00123',
      workerName: '田中太郎',
      siteId: 'SITE-001',
      teamId: 'TEAM-A',
      departmentId: 'DEPT-001',
      workDate: '2025-01-15',
      completedQuantity: 150,
      workTypeId: 'WTYPE-01',
      qualityScore: 95,
      savedAt: '2025-01-15T14:30:00Z',
      requestedBy: 'USER-ADMIN-001',
      triggerProgressMonitoring: false,
      triggerPlacementOptimization: true,
      syncWithExternalSystems: true,
      notifyAdministrator: true,
    };

    const result = await notifyPerformanceDataSaved(input);

    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe('REC-20250115-001');
    expect(result.progressMonitoringTriggerId).toBeNull();
    expect(result.notificationTrackingId).not.toBe('');
    expect(result.placementOptimizationTriggerId).not.toBeNull();
    expect(result.processedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});