import { test, expect } from '@playwright/test';

test.describe('ダッシュボード表示（実績管理画面から）', () => {
  test('権限のないユーザーはダッシュボード画面を表示できない', async ({ page }) => {
    // テスト前提: ダッシュボード表示画面へのアクセス権を持たないユーザーアカウントでログイン
    await page.goto('/');
    
    // ログイン画面が表示されるまで待機
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });
    
    // 権限のないユーザーでログイン
    await page.fill('input[type="text"]', 'worker_no_permission');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("ログイン")');
    
    // ログイン後の画面遷移を待機
    await page.waitForURL(/.*\/panels\//, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // 作業指示・実績管理画面が表示されていることを確認
    const actualPage = page.url();
    expect(actualPage).toContain('scr-1789461813941');
    
    // 作業指示・実績管理画面から『進捗・人員配置ダッシュボード』へのナビゲーションリンクを特定
    const dashboardNavLink = page.locator('a, button').filter({ hasText: '進捗・人員配置ダッシュボード' });
    
    // ナビゲーションリンク/ボタン/メニューが存在することを確認
    await expect(dashboardNavLink).toBeVisible();
    
    // リンク/ボタンをクリックしてダッシュボード画面への遷移を試みる
    await dashboardNavLink.first().click();
    
    // システムの応答を確認
    // 以下のいずれかの状態で遮断されることを確認:
    // (a) HTTP 403 Forbidden またはアクセス拒否エラー画面が表示される
    // (b) 作業指示・実績管理画面に留まり、遷移が行われない
    // (c) 権限不足を示すエラーメッセージが表示される
    
    // 短い待機時間でナビゲーション完了を待つ
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    const pageContent = await page.content();
    
    // (a), (b), (c) のいずれかの条件が満たされているかを確認
    let accessDenied = false;
    
    // (b) 作業指示・実績管理画面に留まっている場合
    if (currentUrl.includes('scr-1789461813941')) {
      accessDenied = true;
      await expect(page).toHaveURL(/.*scr-1789461813941/);
    }
    
    // (a) HTTP 403 Forbidden またはアクセス拒否エラーが表示されている場合
    if (pageContent.includes('403') || pageContent.includes('Forbidden') || pageContent.includes('アクセスが拒否されました')) {
      accessDenied = true;
      expect(pageContent).toMatch(/403|Forbidden|アクセスが拒否されました/);
    }
    
    // (c) 権限不足を示すエラーメッセージが表示されている場合
    if (pageContent.includes('このページにアクセスする権限がありません') || pageContent.includes('権限がありません') || pageContent.includes('アクセス権限がありません')) {
      accessDenied = true;
      expect(pageContent).toMatch(/このページにアクセスする権限がありません|権限がありません|アクセス権限がありません/);
    }
    
    // (a), (b), (c) のいずれかが満たされていることを確認
    expect(accessDenied).toBe(true);
    
    // ダッシュボード画面へ遷移していないことを確認
    // ダッシュボード画面のURLパターンでないことを確認
    expect(currentUrl).not.toContain('scr-1789461783315');
    
    // ダッシュボード画面が表示されていないことを確認
    // ダッシュボード固有の要素が表示されていない
    const kpiRiskCount = page.locator('[data-testid="kpi-risk-count"]');
    const kpiSitesAction = page.locator('[data-testid="kpi-sites-action"]');
    const kpiActivePlans = page.locator('[data-testid="kpi-active-plans"]');
    
    await expect(kpiRiskCount).not.toBeVisible();
    await expect(kpiSitesAction).not.toBeVisible();
    await expect(kpiActivePlans).not.toBeVisible();
  });
});