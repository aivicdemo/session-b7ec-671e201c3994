import { sendNotificationToAdministrator } from '../../src/logic/notification-and-integration';

describe('SCEN-764: sendNotificationToAdministrator - InvalidNotificationContentError when title is empty', () => {
  it('should throw InvalidNotificationContentError when notificationTitle is empty string', async () => {
    const input = {
      administratorId: 'admin-001',
      notificationTitle: '',
      notificationContent: 'テスト本文',
      priorityLevel: 'HIGH' as const,
      notificationType: 'DELAY_RISK_ALERT',
      relatedEntityId: null,
      actionUrl: null,
      requestedBy: 'system-001',
    };

    await expect(sendNotificationToAdministrator(input)).rejects.toMatchObject({
      name: 'InvalidNotificationContentError',
      message: '通知内容が不完全です。',
    });
  });
});