import { test, expect } from '@playwright/test';

test.describe('ダッシュボード表示操作の監査証跡が記録される', () => {
  let sessionId: string;
  let userId: string;
  let dashboardAccessTime: number;

  test('人員配置最適化提案画面からダッシュボードへの遷移と監査ログ記録', async ({ page, context }) => {
    // テスト前提: 監査ログテーブルをクリア
    await page.goto('/panels/scr-1789461798629.html');
    
    const tableNumber = await page.evaluate(() => {
      return (window as any).AIVIC_TABLES?.find((t: any) => t.tableName === 'audit_log')?.number;
    });
    const appId = await page.evaluate(() => {
      return (window as any).AIVIC_APP_ID;
    });
    const apiUrl = await page.evaluate(() => {
      return (window as any).AIVIC_API_URL;
    });

    if (tableNumber && appId && apiUrl) {
      await page.evaluate(async ({ tableNum, appIdentifier, baseUrl }) => {
        await fetch(`${baseUrl}/api/${tableNum}?app=${appIdentifier}`, {
          method: 'DELETE',
        });
      }, { tableNum: tableNumber, appIdentifier: appId, baseUrl: apiUrl });
    }

    // 人員配置最適化提案・実行画面にアクセスし、ログイン済みの状態を確認
    await page.waitForURL('/panels/scr-1789461798629.html', { timeout: 10000 });
    
    const isLoggedIn = await page.locator('[data-testid="generate-proposals-btn"]').isVisible().catch(() => false);
    if (!isLoggedIn) {
      // ログイン画面にリダイレクトされている場合はログイン
      await page.fill('input[placeholder*="ユーザー名"], input[placeholder*="username"], input[placeholder*="ID"]', 'testuser');
      await page.fill('input[placeholder*="パスワード"], input[placeholder*="password"]', 'testpass');
      await page.click('button:has-text("ログイン")');
      await page.waitForURL('/panels/scr-1789461798629.html', { timeout: 10000 });
    }

    // セッションIDとユーザーIDを取得
    sessionId = await page.evaluate(() => {
      return (window as any).AIVIC_SESSION_ID || (window as any).sessionId || 'unknown';
    });

    userId = await page.evaluate(() => {
      return (window as any).AIVIC_USER_ID || (window as any).userId || 'unknown';
    });

    // 人員配置最適化提案・実行画面上で、配置提案の承認操作を実行
    const approveButton = page.locator('[data-testid="approve-button"]');
    if (await approveButton.isVisible()) {
      await approveButton.click();
      
      // モーダルが表示される場合は確認
      const approveModal = page.locator('[id="approve-modal-overlay"]');
      if (await approveModal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await page.click('[data-testid="approve-modal-confirm"]');
        await page.waitForTimeout(500);
      }
    }

    // ダッシュボード遷移時刻を記録
    dashboardAccessTime = Date.now();

    // メニューからダッシュボードへ遷移
    const dashboardNav = page.locator('nav').locator('text=進捗・人員配置ダッシュボード').first();
    if (await dashboardNav.isVisible().catch(() => false)) {
      await dashboardNav.click();
    } else {
      // リンクまたはボタンで遷移
      const dashboardLink = page.locator('a, button').filter({ hasText: '進捗・人員配置ダッシュボード' }).first();
      if (await dashboardLink.isVisible()) {
        await dashboardLink.click();
      }
    }
    
    // ダッシュボード画面の読み込み完了を待機
    await page.waitForURL(/scr-1789461783315/, { timeout: 10000 });
    await page.locator('[data-testid="kpi-risk-count"]').waitFor({ state: 'visible', timeout: 10000 });

    // ダッシュボード画面が正常に表示されたことを確認
    await expect(page).toHaveURL(/scr-1789461783315/);
    const kpiElement = await page.locator('[data-testid="kpi-risk-count"]').isVisible();
    expect(kpiElement).toBe(true);

    // 監査ログをクエリして検証
    const auditLog = await page.evaluate(async ({ tableNum, appIdentifier, baseUrl, searchUserId, searchSessionId, timeWindow }) => {
      try {
        const result = await fetch(`${baseUrl}/api/${tableNum}?app=${appIdentifier}`);
        const data = await result.json();
        
        // ログエントリを検索
        const logs = Array.isArray(data) ? data : data.records || [];
        
        const relevantLogs = logs.filter((log: any) => {
          const isCorrectUser = log.user_id === searchUserId;
          const isCorrectSession = log.session_id === searchSessionId;
          const isCorrectOperation = ['DASHBOARD_ACCESS', 'VIEW_TRANSITION'].includes(log.operation_type);
          const isCorrectSource = log.source_screen === '人員配置最適化提案・実行画面';
          const isCorrectTarget = log.target_screen === '進捗・人員配置ダッシュボード';
          const isSuccess = log.status === 'SUCCESS';
          
          let isTimeValid = false;
          if (log.operation_timestamp) {
            const logTime = typeof log.operation_timestamp === 'number' 
              ? log.operation_timestamp 
              : new Date(log.operation_timestamp).getTime();
            isTimeValid = Math.abs(logTime - timeWindow) <= 5000;
          }
          
          return isCorrectUser && isCorrectSession && isCorrectOperation && 
                 isCorrectSource && isCorrectTarget && isSuccess && isTimeValid;
        });
        
        return relevantLogs.length > 0 ? relevantLogs[0] : null;
      } catch (error) {
        return null;
      }
    }, {
      tableNum: tableNumber,
      appIdentifier: appId,
      baseUrl: apiUrl,
      searchUserId: userId,
      searchSessionId: sessionId,
      timeWindow: dashboardAccessTime
    });

    // 監査ログレコードが存在することを確認
    expect(auditLog).not.toBeNull();
    
    if (auditLog) {
      expect(auditLog.operation_type).toMatch(/DASHBOARD_ACCESS|VIEW_TRANSITION/);
      expect(auditLog.source_screen).toBe('人員配置最適化提案・実行画面');
      expect(auditLog.target_screen).toBe('進捗・人員配置ダッシュボード');
      expect(auditLog.user_id).toBe(userId);
      expect(auditLog.session_id).toBe(sessionId);
      expect(auditLog.status).toBe('SUCCESS');
      
      // created_at が自動入力されていることを確認
      expect(auditLog.created_at).toBeDefined();
      
      // operation_timestamp がISO8601形式またはUnixタイムスタンプであることを確認
      if (typeof auditLog.operation_timestamp === 'string') {
        // ISO8601形式の検証
        const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
        expect(auditLog.operation_timestamp).toMatch(iso8601Regex);
      } else if (typeof auditLog.operation_timestamp === 'number') {
        // Unixタイムスタンプ（ミリ秒）の妥当性確認
        expect(auditLog.operation_timestamp).toBeGreaterThan(0);
        expect(auditLog.operation_timestamp).toBeLessThanOrEqual(Date.now() + 5000);
      }
    }
  });
});