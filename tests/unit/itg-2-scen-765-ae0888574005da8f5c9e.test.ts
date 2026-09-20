import { sendNotificationToAdministrator } from '../../src/logic/notification-and-integration';

describe('SCEN-765: sendNotificationToAdministrator - Invalid Priority Level', () => {
  it('should throw InvalidPriorityLevelError when priorityLevel is not HIGH, MEDIUM, or LOW', async () => {
    const input = {
      administratorId: 'admin-001',
      notificationTitle: 'テスト通知',
      notificationContent: 'テスト本文',
      priorityLevel: 'INVALID' as any,
      notificationType: 'DELAY_RISK_ALERT',
      relatedEntityId: null,
      actionUrl: null,
      requestedBy: 'system-001',
    };

    let errorThrown: Error | null = null;

    try {
      await sendNotificationToAdministrator(input);
    } catch (error) {
      errorThrown = error as Error;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown?.constructor.name).toBe('InvalidPriorityLevelError');
    expect(errorThrown?.message).toContain('優先度レベルが無効です。');
  });
});