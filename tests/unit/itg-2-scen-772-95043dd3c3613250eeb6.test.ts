import { sendNotificationToAdministrator } from '../../src/logic/notification-and-integration';

describe('SCEN-772: sendNotificationToAdministrator with null actionUrl', () => {
  it('should send notification successfully when actionUrl is null', async () => {
    const input = {
      administratorId: 'admin-001',
      notificationTitle: '配置提案',
      notificationContent: '最適配置を提案しました',
      priorityLevel: 'HIGH' as const,
      notificationType: 'PLACEMENT_PROPOSAL',
      relatedEntityId: 'plan-123',
      actionUrl: null,
      requestedBy: 'system-001',
    };

    const result = await sendNotificationToAdministrator(input);

    expect(result.success).toBe(true);
    expect(result.trackingId).toBeTruthy();
    expect(typeof result.trackingId).toBe('string');
    expect(result.trackingId.length).toBeGreaterThan(0);
    expect(result.sentAt).toBeTruthy();
    expect(typeof result.sentAt).toBe('string');
    const sentAtDate = new Date(result.sentAt);
    expect(sentAtDate.toString()).not.toBe('Invalid Date');
    expect(result.deliveryChannel).toMatch(/^(EMAIL|SYSTEM_NOTIFICATION|SLACK)$/);
    expect(result.errorMessage).toBeNull();
  });
});