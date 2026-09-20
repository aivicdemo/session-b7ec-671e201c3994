import { sendNotificationToAdministrator, SendNotificationToAdministratorInput, SendNotificationToAdministratorOutput } from '../../src/logic/notification-and-integration';

describe('SCEN-771: relatedEntityIdがnullの場合も通知が正常に送信される', () => {
  it('relatedEntityIdがnullの場合、通知が正常に送信され、成功レスポンスが返される', async () => {
    const input: SendNotificationToAdministratorInput = {
      administratorId: 'admin-001',
      notificationTitle: '配置提案',
      notificationContent: '新しい人員配置案があります',
      priorityLevel: 'HIGH',
      notificationType: 'PLACEMENT_PROPOSAL',
      relatedEntityId: null,
      actionUrl: 'https://example.com/placement',
      requestedBy: 'system-001',
    };

    const result: SendNotificationToAdministratorOutput = await sendNotificationToAdministrator(input);

    expect(result.success).toBe(true);
    expect(result.trackingId).toBeTruthy();
    expect(typeof result.trackingId).toBe('string');
    expect(result.sentAt).toBeTruthy();
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.deliveryChannel).toBe('EMAIL');
    expect(result.errorMessage).toBeNull();
  });
});