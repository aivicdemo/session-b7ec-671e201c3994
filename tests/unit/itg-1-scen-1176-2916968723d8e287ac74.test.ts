import { notifyAdminForManualHandyTerminalRetry } from '../../src/logic/notification-external-integration';

describe('SCEN-1176: ハンディターミナルデータ送信の再試行上限到達時の管理者通知', () => {
  it('retryCount が 0 以下の場合、InvalidRetryContextError をスロー する', async () => {
    const input = {
      handyTerminalSyncLogId: 'log-123',
      workerId: 'worker-456',
      facilityId: 'facility-789',
      retryCount: 0,
      maxRetryCount: 5,
      lastErrorMessage: 'Connection timeout',
      syncType: 'work_result' as const,
      adminUserIds: ['admin-001', 'admin-002'],
      notificationChannels: ['email', 'app_notification'] as const[],
      requestedByUserId: 'system-user',
      requestedAt: new Date(),
    };

    try {
      await notifyAdminForManualHandyTerminalRetry(input);
      fail('Expected InvalidRetryContextError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty('name');
      expect((error as any).name).toBe('InvalidRetryContextError');
      expect((error as Error).message).toBe(
        '再試行コンテキストが不正です。再試行回数と最大再試行回数を確認してください。'
      );
    }
  });

  it('retryCount が maxRetryCount より大きい場合、InvalidRetryContextError をスロー する', async () => {
    const input = {
      handyTerminalSyncLogId: 'log-123',
      workerId: 'worker-456',
      facilityId: 'facility-789',
      retryCount: 6,
      maxRetryCount: 5,
      lastErrorMessage: 'Connection timeout',
      syncType: 'work_result' as const,
      adminUserIds: ['admin-001', 'admin-002'],
      notificationChannels: ['email', 'app_notification'] as const[],
      requestedByUserId: 'system-user',
      requestedAt: new Date(),
    };

    try {
      await notifyAdminForManualHandyTerminalRetry(input);
      fail('Expected InvalidRetryContextError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty('name');
      expect((error as any).name).toBe('InvalidRetryContextError');
      expect((error as Error).message).toBe(
        '再試行コンテキストが不正です。再試行回数と最大再試行回数を確認してください。'
      );
    }
  });
});