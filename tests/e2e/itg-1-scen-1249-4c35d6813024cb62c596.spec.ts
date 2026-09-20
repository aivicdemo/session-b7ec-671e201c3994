import { test, expect } from '@playwright/test';

test('SCEN-1249: 認証・認可が完了したユーザーの遷移操作は、監査ログに記録される', async ({ page, context }) => {
  const baseUrl = 'http://localhost:3000';
  const loginUrl = `${baseUrl}/login`;
  const dashboardUrl = `${baseUrl}/panels/scr-1789461783315.html`;
  const workInstructionUrl = `${baseUrl}/panels/scr-1789461813941.html`;

  // テストユーザーの認証情報
  const testUserId = 'testuser_audit_001';
  const testUserPassword = 'test_password_001';

  let transitionExecutionTime: number;

  // ステップ1: テストユーザーでログイン
  await test.step('ステップ1: テストユーザー（ID: testuser_audit_001、ロール: 拠点長）でシステムにログインする', async () => {
    await page.goto(loginUrl);
    await page.fill('input[name="userId"]', testUserId);
    await page.fill('input[name="password"]', testUserPassword);
    
    const loginPromise = page.waitForNavigation();
    await page.click('button:has-text("ログイン")');
    await loginPromise;
  });

  // ステップ2: ダッシュボード画面の表示確認
  await test.step('ステップ2: ログイン成功後、進捗・人員配置ダッシュボード画面が表示されることを確認する', async () => {
    await page.waitForURL(dashboardUrl);
    await expect(page).toHaveURL(dashboardUrl);
    await expect(page.locator('text=進捗・人員配置ダッシュボード')).toBeVisible();
  });

  // ステップ3: 作業指示・実績管理画面へ遷移ボタンをクリック
  await test.step('ステップ3: ダッシュボード画面上の「作業指示・実績管理画面へ遷移」ボタンをクリックする', async () => {
    // 遷移操作の実行時刻を記録（ボタンクリック直前）
    transitionExecutionTime = Date.now();
    await page.click('button:has-text("作業指示・実績管理")');
  });

  // ステップ4: 作業指示・実績管理画面への遷移完了確認
  await test.step('ステップ4: 作業指示・実績管理画面への画面遷移が完了し、ページが正常に読み込まれることを確認する', async () => {
    await page.waitForURL(workInstructionUrl);
    await expect(page).toHaveURL(workInstructionUrl);
    await expect(page.locator('text=作業指示・実績管理')).toBeVisible();
  });

  // ステップ5: ブラウザ開発者ツールまたはテスト用管理画面から監査ログテーブルを確認（スキップ）
  await test.step('ステップ5: ブラウザ開発者ツール（F12）またはテスト用管理画面から監査ログテーブルを確認する', async () => {
    // 実装注記: ステップ6のAPI確認で監査ログの永続化と内容検証を行うため、この画面操作スキップ
  });

  // ステップ6: 監査ログレコードの内容検証
  await test.step('ステップ6: 以下の内容を持つ監査ログレコードが新規作成されていることを確認する', async () => {
    // APIから監査ログレコードを取得
    const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
    const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
    const tables = await page.evaluate(() => (window as any).AIVIC_TABLES);

    // 監査ログテーブルのテーブル番号を取得
    const auditLogTableNumber = tables?.tableName?.['audit_log'] || 'audit_log';

    // 30秒以内に監査ログが永続化されるまで待機
    const maxWaitTime = 30000;
    const pollInterval = 1000;
    const startTime = Date.now();
    let latestLog: any = null;

    while (Date.now() - startTime < maxWaitTime && !latestLog) {
      try {
        // ユーザーIDでフィルタして最新のログを取得
        const auditLogResponse = await page.request.get(
          `${apiUrl}/api/${auditLogTableNumber}?app=${appId}&filter={"user_id":"${testUserId}"}&sort=-operation_timestamp&limit=100`
        );

        if (auditLogResponse.ok()) {
          const auditLogs = await auditLogResponse.json();
          if (auditLogs.records && auditLogs.records.length > 0) {
            // 時系列で確認し、「画面遷移」かつ遷移先が「作業指示・実績管理画面」のログを検索
            for (const log of auditLogs.records) {
              if (
                log.operation_type === '画面遷移' &&
                log.source_screen === '進捗・人員配置ダッシュボード' &&
                log.target_screen === '作業指示・実績管理画面'
              ) {
                latestLog = log;
                break;
              }
            }
          }
        }
      } catch (error) {
        // API呼び出しエラーの場合は再試行
      }

      // ポーリング間隔待機
      if (!latestLog) {
        await page.waitForTimeout(pollInterval);
      }
    }

    expect(latestLog).toBeDefined();

    // (1) ユーザーID
    expect(latestLog.user_id).toBe('testuser_audit_001');

    // (2) 操作種別
    expect(latestLog.operation_type).toBe('画面遷移');

    // (3) 遷移元画面
    expect(latestLog.source_screen).toBe('進捗・人員配置ダッシュボード');

    // (4) 遷移先画面
    expect(latestLog.target_screen).toBe('作業指示・実績管理画面');

    // (5) 操作タイムスタンプが遷移実行時刻と一致（許容誤差±5秒）
    const logTimestamp = new Date(latestLog.operation_timestamp).getTime();
    const timeDiffFromExecution = Math.abs(logTimestamp - transitionExecutionTime);
    
    // タイムスタンプが遷移実行時刻の±5秒以内に収まることを検証
    expect(timeDiffFromExecution).toBeLessThanOrEqual(5000);

    // (6) 操作ステータス
    expect(latestLog.operation_status).toBe('成功');

    // 監査ログは遷移完了後30秒以内にデータベースに永続化されたことを確認
    const persistenceTime = Date.now() - startTime;
    expect(persistenceTime).toBeLessThanOrEqual(30000);
  });
});