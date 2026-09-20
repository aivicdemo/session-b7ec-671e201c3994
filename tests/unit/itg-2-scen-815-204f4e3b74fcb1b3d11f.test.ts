import { notifyPerformanceDataSaved, sendNotificationToAdministrator } from '../../src/logic/notification-and-integration';

jest.mock('../../src/logic/notification-and-integration', () => {
  const actual = jest.requireActual('../../src/logic/notification-and-integration');
  return {
    ...actual,
    sendNotificationToAdministrator: jest.fn(),
  };
});

describe('SCEN-815: エラー系：管理者への通知送信に失敗し、全体成功だが部分失敗情報を含めて返す', () => {
  it('notifyPerformanceDataSaved関数が管理者への通知送信失敗時に、全体成功で部分失敗情報を含めて返すこと', async () => {
    // Arrange
    const input = {
      performanceRecordId: 'PERF-20240115-001',
      workerId: 'WKR-12345',
      workerName: '山田太郎',
      siteId: 'SITE-001',
      teamId: 'TEAM-A',
      departmentId: 'DEPT-PROD',
      workDate: '2024-01-15',
      completedQuantity: 150,
      workTypeId: 'WTYPE-001',
      qualityScore: 92,
      savedAt: '2024-01-15T14:30:00Z',
      requestedBy: 'USR-ADMIN-001',
      triggerProgressMonitoring: true,
      triggerPlacementOptimization: true,
      syncWithExternalSystems: true,
      notifyAdministrator: true,
    };

    // sendNotificationToAdministratorをモック化し、NotificationDeliveryFailure例外を発生させる
    const mockSendNotification = sendNotificationToAdministrator as jest.MockedFunction<typeof sendNotificationToAdministrator>;
    mockSendNotification.mockRejectedValueOnce(
      new Error('管理者への通知送信に失敗しました。')
    );

    // Act
    const result = await notifyPerformanceDataSaved(input);

    // Assert - 戻り値の型チェック
    expect(result).toBeDefined();
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('performanceRecordId');
    expect(result).toHaveProperty('notificationTrackingId');
    expect(result).toHaveProperty('progressMonitoringTriggerId');
    expect(result).toHaveProperty('placementOptimizationTriggerId');
    expect(result).toHaveProperty('dataSynchronizationTrackingId');
    expect(result).toHaveProperty('processedAt');
    expect(result).toHaveProperty('partialFailures');

    // Assert - 全体成功（success=true）の確認
    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe('PERF-20240115-001');

    // Assert - 通知追跡IDが生成されている（null以外）
    expect(result.notificationTrackingId).not.toBeNull();
    expect(typeof result.notificationTrackingId).toBe('string');

    // Assert - 進捗監視トリガーが成功している（null以外）
    expect(result.progressMonitoringTriggerId).not.toBeNull();
    expect(typeof result.progressMonitoringTriggerId).toBe('string');

    // Assert - 配置最適化トリガーが成功している（null以外）
    expect(result.placementOptimizationTriggerId).not.toBeNull();
    expect(typeof result.placementOptimizationTriggerId).toBe('string');

    // Assert - データ同期が成功している（null以外）
    expect(result.dataSynchronizationTrackingId).not.toBeNull();
    expect(typeof result.dataSynchronizationTrackingId).toBe('string');

    // Assert - processedAtはISO 8601形式
    expect(result.processedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);

    // Assert - partialFailures配列に1件の要素が含まれている
    expect(result.partialFailures).toBeDefined();
    expect(Array.isArray(result.partialFailures)).toBe(true);
    expect(result.partialFailures?.length).toBe(1);

    // Assert - partialFailures内の要素がPartialFailureInfoであること
    if (result.partialFailures && result.partialFailures.length > 0) {
      const failureInfo = result.partialFailures[0];
      expect(failureInfo).toHaveProperty('component');
      expect(failureInfo).toHaveProperty('failureReason');
      expect(failureInfo).toHaveProperty('retryable');

      // Assert - 管理者通知の失敗情報を確認
      expect(failureInfo.component).toBe('ADMINISTRATOR_NOTIFICATION');
      expect(failureInfo.failureReason).toBe('管理者への通知送信に失敗しました。');
      expect(typeof failureInfo.retryable).toBe('boolean');
    }
  });
});