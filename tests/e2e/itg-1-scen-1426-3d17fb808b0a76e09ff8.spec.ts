import { test, expect } from '@playwright/test';

test.describe('ダッシュボード表示（実績管理画面から）', () => {
  test('未認証状態からのアクセスはログイン画面へリダイレクトされ、有効な認証情報によるログイン後に進捗・人員配置ダッシュボード画面が正常に表示される', async ({ page }) => {
    // Step 1: ブラウザで「作業指示・実績管理画面」を開く
    await page.goto('/panels/scr-1789461813941.html');
    
    // 未認証状態であることを前提に、認証画面へリダイレクトされることを確認
    await page.waitForURL('**/login', { timeout: 10000 });
    
    // Step 2-3: ログイン画面へリダイレクトされたことを確認
    const loginTitle = page.locator('.login-title');
    await expect(loginTitle).toBeVisible();
    
    // Step 3: ログイン画面でテスト用の有効な認証情報を入力してログインボタンをクリック
    const userIdInput = page.locator('input[placeholder*="ユーザーID"], input[placeholder*="ID"]').first();
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("ログイン"), .login-button');
    
    await userIdInput.fill('testuser');
    await passwordInput.fill('testpassword123');
    await loginButton.click();
    
    // Step 4: ログイン処理が完了し、「進捗・人員配置ダッシュボード」画面へ遷移することを確認
    await page.waitForURL('**/scr-1789461783315.html', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Step 5: ダッシュボード画面が正常に表示されていることを確認
    const dashboardContent = page.locator('[data-testid="kpi-risk-count"], [data-testid="kpi-sites-action"], [data-testid="kpi-active-plans"]');
    await expect(dashboardContent.first()).toBeVisible();
    
    // Step 6: 拠点・チーム別の作業進捗状況表示エリアが表示されていることを確認
    const siteVarianceTable = page.locator('#site-variance-tbody');
    const teamVarianceTable = page.locator('#team-variance-tbody');
    
    await expect(siteVarianceTable).toBeVisible();
    await expect(teamVarianceTable).toBeVisible();
  });

  test('認証済みユーザーが実績管理画面からダッシュボード表示へ遷移できる', async ({ page }) => {
    // 認証済み状態を前提に進める
    await page.goto('/panels/scr-1789461813941.html');
    
    // ログイン画面が表示される場合はログイン
    const loginTitle = page.locator('.login-title');
    if (await loginTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
      const userIdInput = page.locator('input[placeholder*="ユーザーID"], input[placeholder*="ID"]').first();
      const passwordInput = page.locator('input[type="password"]');
      const loginButton = page.locator('button:has-text("ログイン"), .login-button');
      
      await userIdInput.fill('testuser');
      await passwordInput.fill('testpassword123');
      await loginButton.click();
      
      await page.waitForURL('**/scr-1789461813941.html', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
    }
    
    // 「ダッシュボード表示」へのナビゲーションリンク/ボタンをクリック
    const dashboardNavLink = page.locator('[data-testid="scr-1789461783315"], nav a:has-text("進捗・人員配置ダッシュボード"), .shell-nav-item:has-text("進捗・人員配置ダッシュボード")').first();
    await dashboardNavLink.click();
    
    // 「進捗・人員配置ダッシュボード」画面へ遷移することを確認
    await page.waitForURL('**/scr-1789461783315.html', { timeout: 10000 });
    
    // ダッシュボード画面上に拠点・チーム別の作業進捗状況表示エリアが表示されていることを確認
    const siteVarianceTable = page.locator('#site-variance-tbody');
    const teamVarianceTable = page.locator('#team-variance-tbody');
    
    await expect(siteVarianceTable).toBeVisible();
    await expect(teamVarianceTable).toBeVisible();
  });
});