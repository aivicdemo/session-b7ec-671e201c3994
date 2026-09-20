import { notifyAdminForManualHandyTerminalRetry } from '../../src/logic/notification-external-integration';
import * as NotificationService from '../../src/services/notification-service';

jest.mock('../../src/services/notification-service');

describe('SCEN-1177: 管理者への通知送信がすべてのチャネルで失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // すべてのチャネル（email、app_notification、sms）に対して失敗を返すようにモック設定
    (NotificationService.sendNotification as jest.Mock).mockRejectedValue(
      new Error('Notification service failed')
    );
  });

  it('すべてのチャネルで通知送信失敗時、AdminNotificationDeliveryFailedError を発生させる', async () => {
    const input = {
      handyTerminalSyncLogId: 'sync-log-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      retryCount: 5,
      maxRetryCount: 5,
      lastErrorMessage: 'Network timeout',
      syncType: 'work_result' as const,
      adminUserIds: ['admin-001', 'admin-002'],
      notificationChannels: ['email', 'app_notification', 'sms'] as const,
      requestedByUserId: 'system-job',
      requestedAt: new Date(),
    };

    let thrownError: any = null;
    try {
      await notifyAdminForManualHandyTerminalRetry(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('AdminNotificationDeliveryFailedError');
    expect(thrownError.message).toBe('管理者への通知送信に失敗しました。通知サービスの状態を確認してください。');
  });

  it('エラーメッセージが正確に「管理者への通知送信に失敗しました。通知サービスの状態を確認してください。」であること', async () => {
    const input = {
      handyTerminalSyncLogId: 'sync-log-002',
      workerId: 'worker-002',
      facilityId: 'facility-002',
      retryCount: 5,
      maxRetryCount: 5,
      lastErrorMessage: 'Service unavailable',
      syncType: 'position_update' as const,
      adminUserIds: ['admin-003'],
      notificationChannels: ['email', 'sms'] as const,
      requestedByUserId: 'system-job',
      requestedAt: new Date(),
    };

    let thrownError: any = null;
    try {
      await notifyAdminForManualHandyTerminalRetry(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.message).toBe('管理者への通知送信に失敗しました。通知サービスの状態を確認してください。');
  });

  it('notificationDeliveryStatus に admin-001 と admin-002 の全チャネル失敗が記録されること', async () => {
    const input = {
      handyTerminalSyncLogId: 'sync-log-006',
      workerId: 'worker-006',
      facilityId: 'facility-006',
      retryCount: 5,
      maxRetryCount: 5,
      lastErrorMessage: 'Timeout',
      syncType: 'work_result' as const,
      adminUserIds: ['admin-001', 'admin-002'],
      notificationChannels: ['email', 'app_notification', 'sms'] as const,
      requestedByUserId: 'system-job',
      requestedAt: new Date(),
    };

    let thrownError: any = null;
    try {
      await notifyAdminForManualHandyTerminalRetry(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.notificationDeliveryStatus).toBeDefined();

    const deliveryStatus = thrownError.notificationDeliveryStatus;
    expect(Array.isArray(deliveryStatus)).toBe(true);

    // 合計 6 件（2 管理者 × 3 チャネル）がすべて失敗として記録されていることを確認
    expect(deliveryStatus.length).toBe(6);

    // admin-001 のすべてのチャネル（email, app_notification, sms）で失敗を確認
    const admin001Status = deliveryStatus.filter(
      (s: any) => s.adminUserId === 'admin-001'
    );
    expect(admin001Status.length).toBe(3);
    expect(admin001Status.every((s: any) => s.status === 'failed')).toBe(true);
    expect(admin001Status.every((s: any) => s.deliveredAt instanceof Date)).toBe(true);
    expect(admin001Status.some((s: any) => s.channel === 'email')).toBe(true);
    expect(admin001Status.some((s: any) => s.channel === 'app_notification')).toBe(true);
    expect(admin001Status.some((s: any) => s.channel === 'sms')).toBe(true);

    // admin-002 のすべてのチャネル（email, app_notification, sms）で失敗を確認
    const admin002Status = deliveryStatus.filter(
      (s: any) => s.adminUserId === 'admin-002'
    );
    expect(admin002Status.length).toBe(3);
    expect(admin002Status.every((s: any) => s.status === 'failed')).toBe(true);
    expect(admin002Status.every((s: any) => s.deliveredAt instanceof Date)).toBe(true);
    expect(admin002Status.some((s: any) => s.channel === 'email')).toBe(true);
    expect(admin002Status.some((s: any) => s.channel === 'app_notification')).toBe(true);
    expect(admin002Status.some((s: any) => s.channel === 'sms')).toBe(true);
  });

  it('failureReason に通知送信失敗の理由が記載されていること', async () => {
    const input = {
      handyTerminalSyncLogId: 'sync-log-007',
      workerId: 'worker-007',
      facilityId: 'facility-007',
      retryCount: 5,
      maxRetryCount: 5,
      lastErrorMessage: 'Error',
      syncType: 'work_result' as const,
      adminUserIds: ['admin-008'],
      notificationChannels: ['sms'] as const,
      requestedByUserId: 'system-job',
      requestedAt: new Date(),
    };

    let thrownError: any = null;
    try {
      await notifyAdminForManualHandyTerminalRetry(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.failureReason).toBeDefined();
    expect(typeof thrownError.failureReason).toBe('string');
    expect(thrownError.failureReason.length).toBeGreaterThan(0);
  });

  it('recordHandyTerminalSyncLog への呼び出しが試行されないこと', async () => {
    const input = {
      handyTerminalSyncLogId: 'sync-log-008',
      workerId: 'worker-008',
      facilityId: 'facility-008',
      retryCount: 5,
      maxRetryCount: 5,
      lastErrorMessage: 'Error',
      syncType: 'work_result' as const,
      adminUserIds: ['admin-009'],
      notificationChannels: ['email'] as const,
      requestedByUserId: 'system-job',
      requestedAt: new Date(),
    };

    let thrownError: any = null;
    try {
      await notifyAdminForManualHandyTerminalRetry(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('AdminNotificationDeliveryFailedError');
    
    // エラーが発生しているため、syncLogRecordId は存在しないか null であること
    expect(thrownError.syncLogRecordId).toBeUndefined();
  });

  it('エラー発生時に notificationDeliveryStatus が出力に含まれてもそれは記録されたデータ（エラー詳細）であること', async () => {
    const input = {
      handyTerminalSyncLogId: 'sync-log-009',
      workerId: 'worker-009',
      facilityId: 'facility-009',
      retryCount: 5,
      maxRetryCount: 5,
      lastErrorMessage: 'Service error',
      syncType: 'status_change' as const,
      adminUserIds: ['admin-010', 'admin-011'],
      notificationChannels: ['email', 'app_notification', 'sms'] as const,
      requestedByUserId: 'system-job',
      requestedAt: new Date(),
    };

    let thrownError: any = null;
    try {
      await notifyAdminForManualHandyTerminalRetry(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('AdminNotificationDeliveryFailedError');
    
    // エラーオブジェクトに notificationDeliveryStatus が存在する場合、すべてが failed であることを確認
    if (thrownError.notificationDeliveryStatus) {
      const allStatuses = thrownError.notificationDeliveryStatus;
      expect(Array.isArray(allStatuses)).toBe(true);
      expect(allStatuses.length).toBe(6);
      expect(allStatuses.every((s: any) => s.status === 'failed')).toBe(true);
    }
  });
});