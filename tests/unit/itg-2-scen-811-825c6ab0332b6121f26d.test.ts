import { notifyPerformanceDataSaved } from '../../src/logic/notification-and-integration';

describe('SCEN-811: notifyPerformanceDataSaved - UnauthorizedNotificationRequest error', () => {
  it('should return UnauthorizedNotificationRequest error when requestedBy user lacks notification execution rights', async () => {
    const input = {
      performanceRecordId: 'PERF-20240115-001',
      workerId: 'WK-001',
      workerName: '山田太郎',
      siteId: 'SITE-001',
      teamId: 'TEAM-001',
      departmentId: 'DEPT-001',
      workDate: '2024-01-15',
      completedQuantity: 150,
      workTypeId: 'WT-001',
      qualityScore: 92,
      savedAt: '2024-01-15T14:30:00Z',
      requestedBy: 'UNAUTHORIZED-USER-ID',
      triggerProgressMonitoring: true,
      triggerPlacementOptimization: true,
      syncWithExternalSystems: true,
      notifyAdministrator: true,
    };

    const result = await notifyPerformanceDataSaved(input);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.errorMessage).toContain('この操作を実行する権限がありません。');
  });
});