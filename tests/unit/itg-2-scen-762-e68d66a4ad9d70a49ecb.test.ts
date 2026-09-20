import { sendNotificationToAdministrator } from '../../src/logic/notification-and-integration';

describe('SCEN-762: 管理者への通知送信', () => {
  it('管理者への通知が正常に送信され、追跡IDと送信結果が返される', async () => {
    // Arrange
    const input = {
      administratorId: 'ADM001',
      notificationTitle: '配置計画提案',
      notificationContent: '作業者の最適配置計画が完成しました',
      priorityLevel: 'HIGH' as const,
      notificationType: 'PLACEMENT_PROPOSAL',
      relatedEntityId: 'PLAN-20240115-001',
      actionUrl: '/placement/view/PLAN-20240115-001',
      requestedBy: 'SYSTEM',
    };

    // Act
    const result = await sendNotificationToAdministrator(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.trackingId).toBeDefined();
    expect(result.trackingId).not.toBe('');
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(['EMAIL', 'SYSTEM_NOTIFICATION', 'SLACK']).toContain(result.deliveryChannel);
    expect(result.errorMessage).toBeNull();
  });
});