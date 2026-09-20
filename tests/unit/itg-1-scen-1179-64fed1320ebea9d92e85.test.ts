import { notifyAdminForManualHandyTerminalRetry } from '../../src/logic/notification-external-integration';
import { NotifyAdminForManualHandyTerminalRetryInput, NotifyAdminForManualHandyTerminalRetryOutput } from '../../src/logic/notification-external-integration';

describe('notifyAdminForManualHandyTerminalRetry', () => {
  it('複数の管理者ユーザーに対して異なるチャネルで通知を送信する場合、各管理者・チャネル単位での配信結果を記録して返す', async () => {
    const input: NotifyAdminForManualHandyTerminalRetryInput = {
      handyTerminalSyncLogId: 'ht-sync-log-999',
      workerId: 'worker-456',
      facilityId: 'facility-789',
      retryCount: 5,
      maxRetryCount: 5,
      lastErrorMessage: 'Network timeout after 5 retries',
      syncType: 'work_result',
      adminUserIds: ['admin-001', 'admin-002'],
      notificationChannels: ['email', 'app_notification', 'sms'],
      requestedByUserId: 'system-job-001',
      requestedAt: new Date('2024-01-15T10:25:00Z'),
    };

    const result = await notifyAdminForManualHandyTerminalRetry(input);

    expect(result.success).toBe(true);
    expect(result.handyTerminalSyncLogId).toBe('ht-sync-log-999');
    expect(result.syncLogRecordId).toBeDefined();
    expect(result.failureReason).toBeNull();

    expect(result.notificationDeliveryStatus).toHaveLength(6);

    const admin001Email = result.notificationDeliveryStatus.find(
      (s) => s.adminUserId === 'admin-001' && s.channel === 'email'
    );
    expect(admin001Email).toBeDefined();
    expect(admin001Email?.status).toBe('success');
    expect(admin001Email?.deliveredAt).toBeDefined();

    const admin001AppNotif = result.notificationDeliveryStatus.find(
      (s) => s.adminUserId === 'admin-001' && s.channel === 'app_notification'
    );
    expect(admin001AppNotif).toBeDefined();
    expect(admin001AppNotif?.status).toBe('success');
    expect(admin001AppNotif?.deliveredAt).toBeDefined();

    const admin001Sms = result.notificationDeliveryStatus.find(
      (s) => s.adminUserId === 'admin-001' && s.channel === 'sms'
    );
    expect(admin001Sms).toBeDefined();
    expect(admin001Sms?.status).toBe('success');
    expect(admin001Sms?.deliveredAt).toBeDefined();

    const admin002Email = result.notificationDeliveryStatus.find(
      (s) => s.adminUserId === 'admin-002' && s.channel === 'email'
    );
    expect(admin002Email).toBeDefined();
    expect(admin002Email?.status).toBe('failed');

    const admin002AppNotif = result.notificationDeliveryStatus.find(
      (s) => s.adminUserId === 'admin-002' && s.channel === 'app_notification'
    );
    expect(admin002AppNotif).toBeDefined();
    expect(admin002AppNotif?.status).toBe('success');
    expect(admin002AppNotif?.deliveredAt).toBeDefined();

    const admin002Sms = result.notificationDeliveryStatus.find(
      (s) => s.adminUserId === 'admin-002' && s.channel === 'sms'
    );
    expect(admin002Sms).toBeDefined();
    expect(admin002Sms?.status).toBe('failed');

    const successCount = result.notificationDeliveryStatus.filter(
      (s) => s.status === 'success'
    ).length;
    expect(successCount).toBe(4);

    const failureCount = result.notificationDeliveryStatus.filter(
      (s) => s.status === 'failed'
    ).length;
    expect(failureCount).toBe(2);
  });
});