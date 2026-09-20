import { executeDailyBatchProcess } from '../../src/logic/daily-batch-execution';

describe('SCEN-160: 定時実行予定時刻から30分以上遅延した時刻でバッチ実行依頼がある場合', () => {
  it('遅延警告メッセージが返される', async () => {
    // テスト開始時刻を現在時刻より30分以上後に設定
    const now = new Date();
    const scheduledTime = new Date(now.getTime());
    scheduledTime.setHours(5, 0, 0, 0); // 定時実行予定時刻 05:00
    
    // 定時実行予定時刻から31分後（遅延）
    const delayedExecutionTime = new Date(scheduledTime.getTime() + 31 * 60 * 1000);
    
    // テスト開始時刻が現在時刻より30分以上後であることを確認
    expect(delayedExecutionTime.getTime()).toBeGreaterThanOrEqual(now.getTime() + 30 * 60 * 1000);
    
    // 前日の日付を計算
    const targetDate = new Date(delayedExecutionTime);
    targetDate.setDate(targetDate.getDate() - 1);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    // 前日のデータ集約処理が完了した時刻を前日の23:59に設定するための
    // 前提条件：データベースまたはモック上で集約完了時刻を前日23:59に設定
    const aggregationCompletionTime = new Date(targetDate);
    aggregationCompletionTime.setHours(23, 59, 0, 0);
    
    // 対象拠点数を5件、集約データ件数を1000件に設定する前提条件
    // （実装では、テスト対象システムがこれらの前提条件を自動検出する）
    
    // executeDailyBatchProcessを呼び出す
    const result = await executeDailyBatchProcess({
      triggerType: 'scheduled',
      targetDate: targetDateStr,
      executedByUserId: 'system',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    });
    
    // executionStatusを確認
    expect(result.executionStatus).toMatch(/^(success|partial_success)$/);
    
    // warningsフィールドが存在し、遅延警告メッセージを含むことを確認
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
    
    // 仕様で指定された正確な警告メッセージを検証
    const expectedMessage = 'バッチ実行が予定時刻から大幅に遅延しています。営業開始に支障がないか確認してください';
    const delayWarning = result.warnings?.find(
      (warning) => warning.warningMessage === expectedMessage
    );
    
    expect(delayWarning).toBeDefined();
    expect(delayWarning?.warningMessage).toBe(expectedMessage);
    
    // バッチ処理が継続実行されたことを確認（エラーではなく警告として扱われている）
    expect(result.executionStatus).not.toBe('failure');
    expect(result.aggregationResult).toBeDefined();
    expect(result.analysisResult).toBeDefined();
  });
});