import { detectAndRetryDataTransmissionDelay } from '../../src/logic/productivity-data-collection';

describe('SCEN-132: カスタムのタイムアウト閾値が指定された場合の遅延判定', () => {
  it('should judge delay based on custom timeout threshold when specified', async () => {
    // システム内部時刻を2024-01-15T10:00:25Z（送信開始から25秒経過）にシミュレート
    const transmissionStartTime = '2024-01-15T10:00:00Z';
    const currentTime = new Date('2024-01-15T10:00:25Z');
    const originalNow = Date.now;
    
    // Date.nowをモックして、システム内部時刻を固定
    jest.spyOn(global.Date, 'now').mockReturnValue(currentTime.getTime());

    const input = {
      performanceRecordId: 'perf-001',
      transmissionStartTime: transmissionStartTime,
      timeoutThresholdSeconds: 20,
      maxRetryAttempts: 3,
      retryIntervalSeconds: 5,
    };

    try {
      const output = await detectAndRetryDataTransmissionDelay(input);

      // 経過時間25秒 > カスタムタイムアウト閾値20秒の条件で、
      // DataTransmissionTimeoutErrorが発生し、遅延状態になることを確認
      expect(output.performanceRecordId).toBe('perf-001');
      expect(output.transmissionStatus).toBe('delayed');
      
      // elapsedTimeSecondsが25秒であることを確認
      expect(output.elapsedTimeSeconds).toBe(25);
      
      // retryCountが0であることを確認
      expect(output.retryCount).toBe(0);
      
      // delayWarningNotificationSentは確定値（boolean）であることを確認
      expect(typeof output.delayWarningNotificationSent).toBe('boolean');
      
      // manualInputModeSwitchTriggeredはfalse
      // （25秒の遅延は5分以下なので、手動入力モード切り替えは非実行）
      expect(output.manualInputModeSwitchTriggered).toBe(false);
      
      // notificationTargetsは配列であることを確認
      expect(Array.isArray(output.notificationTargets)).toBe(true);
    } finally {
      jest.restoreAllMocks();
    }
  });

  it('should verify that custom timeout threshold of 20 seconds is used for delay judgment', async () => {
    const transmissionStartTime = '2024-01-15T10:00:00Z';
    const currentTime = new Date('2024-01-15T10:00:25Z');
    
    jest.spyOn(global.Date, 'now').mockReturnValue(currentTime.getTime());

    const input = {
      performanceRecordId: 'perf-001',
      transmissionStartTime: transmissionStartTime,
      timeoutThresholdSeconds: 20,
      maxRetryAttempts: 3,
      retryIntervalSeconds: 5,
    };

    try {
      const output = await detectAndRetryDataTransmissionDelay(input);

      // カスタム値20秒に基づいて遅延判定が行われたことを確認
      expect(output.transmissionStatus).toBe('delayed');
      
      // 実際の経過時間25秒がカスタムタイムアウト値20秒を超えていることを確認
      expect(output.elapsedTimeSeconds).toBe(25);
      expect(output.elapsedTimeSeconds).toBeGreaterThan(20);
      
      // デフォルト30秒ではなく、カスタム値20秒との比較によって
      // 遅延と判定されたことが、elapsedTimeSeconds > timeoutThresholdSecondsの関係で確認できる
      expect(output.elapsedTimeSeconds).toBeGreaterThan(input.timeoutThresholdSeconds);
    } finally {
      jest.restoreAllMocks();
    }
  });
});