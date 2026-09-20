import { detectAndRetryDataTransmissionDelay } from '../../src/logic/productivity-data-collection';

describe('SCEN-129: 手動入力モード切り替え通知が管理者に送信される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send manual input mode switch notification to administrators when retry exhausted', async () => {
    const performanceRecordId = 'perf-20240115-001';
    const transmissionStartTime = '2024-01-15T10:00:00Z';
    const maxRetryAttempts = 3;
    const retryIntervalSeconds = 5;
    const timeoutThresholdSeconds = 30;
    const delayNotificationThresholdMinutes = 5;

    // シミュレーション: WESへの送信が35秒経過してもタイムアウト状態
    // 内部的に3回の再試行が実行され、再試行上限に到達する
    const result = await detectAndRetryDataTransmissionDelay({
      performanceRecordId,
      transmissionStartTime,
      maxRetryAttempts,
      retryIntervalSeconds,
      timeoutThresholdSeconds,
      delayNotificationThresholdMinutes,
    });

    // 出力型の各フィールド値を確認
    expect(result.performanceRecordId).toBe('perf-20240115-001');
    expect(result.transmissionStatus).toBe('retry_exhausted');
    
    // 自動再試行が3回実行されたことを確認
    expect(result.retryCount).toBe(3);
    
    // タイムアウト閾値（30秒）を超える遅延状態を確認
    expect(result.elapsedTimeSeconds).toBeGreaterThanOrEqual(35);
    
    // 遅延警告通知が送信されたことを確認
    expect(result.delayWarningNotificationSent).toBe(true);
    
    // 5分以上の遅延により手動入力モード切り替えが実行されたことを確認
    expect(result.manualInputModeSwitchTriggered).toBe(true);
    
    // フォールバック配置案の有無を確認
    expect(result.fallbackPlacementProposalId).toBeDefined();

    // 通知対象者リストに管理者ロールを持つユーザーが含まれていることを検証
    expect(result.notificationTargets).toBeDefined();
    expect(Array.isArray(result.notificationTargets)).toBe(true);
    expect(result.notificationTargets.length).toBeGreaterThanOrEqual(1);

    const administratorNotifications = result.notificationTargets.filter(
      (target) => target.role === 'administrator'
    );
    expect(administratorNotifications.length).toBeGreaterThanOrEqual(1);

    // 通知種別が'manual_input_mode_switch'であることを検証
    administratorNotifications.forEach((notification) => {
      expect(notification.notificationType).toBe('manual_input_mode_switch');
      expect(notification.userId).toBeDefined();
      expect(notification.role).toBe('administrator');
    });
  });
});