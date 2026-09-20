import { sendNotificationToAdministrator } from '../../src/logic/notification-and-integration';

describe('SCEN-763: sendNotificationToAdministrator - InvalidAdministratorIdError', () => {
  it('should throw InvalidAdministratorIdError when administratorId does not exist or lacks permission', async () => {
    const input = {
      administratorId: 'ADMIN-NONEXISTENT-999',
      notificationTitle: 'テスト通知',
      notificationContent: 'テスト本文',
      priorityLevel: 'HIGH' as const,
      notificationType: 'DELAY_RISK_ALERT',
      relatedEntityId: null,
      actionUrl: null,
      requestedBy: 'SYSTEM',
    };

    let errorThrown: Error | null = null;
    try {
      await sendNotificationToAdministrator(input);
    } catch (error) {
      errorThrown = error as Error;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown?.name).toBe('InvalidAdministratorIdError');
    expect(errorThrown?.message).toBe('指定された管理者IDは無効です。');
  });
});