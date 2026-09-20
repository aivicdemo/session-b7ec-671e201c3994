import { test, expect } from '@playwright/test';

test('SCEN-893: 認証済みのユーザーが生産性ダッシュボードから配置案確認画面表示フローを実行すると、セッション有効性が確認され、認証が成功する', async ({ page }) => {
  // Step 1: ブラウザで本システムにアクセスし、ログイン画面を表示する
  await page.goto('/');
  await expect(page).toHaveTitle(/作業管理システム|ログイン画面/);
  
  // ログイン画面が表示されていることを確認
  const loginTitle = page.locator('.login-title');
  await expect(loginTitle).toBeVisible();

  // Step 2: 認証済みユーザーの認証情報を入力してログインボタンをクリックする
  const userIdInput = page.locator('input[name="userId"], input[placeholder*="ユーザーID"], input[type="text"]').first();
  const passwordInput = page.locator('input[name="password"], input[placeholder*="パスワード"], input[type="password"]');
  const loginButton = page.locator('button:has-text("ログイン"), button.login-button');
  
  await userIdInput.fill('testuser');
  await passwordInput.fill('testpassword');
  await loginButton.click();

  // ログイン後の自動遷移を待機
  await page.waitForNavigation({ waitUntil: 'networkidle' });

  // Step 3: 生産性ダッシュボード・分析画面が表示されることを確認する
  await expect(page).toHaveURL(/panels\/scr-1789461964046\.html/);
  
  // ダッシュボード画面のコンテンツが表示されていることを確認
  const dashboardContent = page.locator('main, .dashboard-container, [class*="dashboard"], [class*="panel"]');
  await expect(dashboardContent).toBeVisible();

  // Step 4: 生産性ダッシュボード・分析画面上の「配置案確認」または同等の遷移ボタン・リンクをクリックする
  const placementButton = page.locator(
    'button:has-text("配置案確認"), a:has-text("配置案確認"), button:has-text("配置案"), a:has-text("配置案"), [class*="placement"], [class*="allocation"]'
  ).first();
  
  await expect(placementButton).toBeVisible();
  await placementButton.click();

  // Step 5: 最適人員配置案提案・実行画面へのページ遷移が実行される
  // 期待結果: 最適人員配置案提案・実行画面が正常に表示される
  await expect(page).toHaveURL(/panels\/scr-1789461978707\.html/);
  
  // 配置案画面のコンテンツが表示されていることを確認
  const placementContent = page.locator('main, .placement-container, [class*="allocation"], [class*="proposal"]');
  await expect(placementContent).toBeVisible();
  
  // セッションが有効で、認証状態のまま画面に到達していることを確認
  // （ログイン画面へのリダイレクトがないこと）
  await expect(page).not.toHaveURL(/login|auth/);
  
  // 配置案内容が表示されていることを確認（作業者の生産性データに基づいた配置案）
  const proposalContent = page.locator('[class*="data"], [class*="content"], [class*="proposal"], table, tbody');
  await expect(proposalContent.first()).toBeVisible();
  
  // 確認・承認・実行操作が可能な状態を確認
  const actionButtons = page.locator(
    'button:has-text("確認"), button:has-text("承認"), button:has-text("実行"), button:has-text("確定"), button:has-text("適用")'
  );
  
  await expect(actionButtons.first()).toBeVisible();
  await expect(actionButtons.first()).toBeEnabled();
});