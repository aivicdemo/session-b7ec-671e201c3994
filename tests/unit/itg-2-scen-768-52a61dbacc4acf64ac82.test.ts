import { sendNotificationToAdministrator } from '../../src/logic/notification-and-integration';

describe('SCEN-768: 送信成功時の出力に実際に使用された配信チャネルが含まれる', () => {
  it('should include the actual delivery channel used in the output when sending notification successfully', async () => {
    const input = {
      administratorId: 'admin-001',
      notificationTitle: '生産性分析完了',
      notificationContent: '配置最適化の分析が完了しました',
      priorityLevel: 'HIGH' as const,
      notificationType: 'PLACEMENT_PROPOSAL',
      relatedEntityId: 'plan-123',
      actionUrl: 'https://system.local/placement-details',
      requestedBy: 'system-batch',
    };

    const result = await sendNotificationToAdministrator(input);

    expect(result.success).toBe(true);
    expect(result.trackingId).toBeDefined();
    expect(result.trackingId).not.toBeNull();
    expect(typeof result.trackingId).toBe('string');
    expect(result.trackingId.length).toBeGreaterThan(0);

    expect(result.sentAt).toBeDefined();
    expect(result.sentAt).not.toBeNull();
    const sentAtDate = new Date(result.sentAt);
    expect(sentAtDate.getTime()).toBeGreaterThan(0);
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.sentAt)).toBe(true);

    expect(result.deliveryChannel).toBe('EMAIL');

    expect(result.errorMessage).toBeNull();
  });
});