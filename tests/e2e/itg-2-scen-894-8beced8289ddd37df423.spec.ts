import { test, expect } from '@playwright/test';

test('SCEN-894: ユーザーが配置案確認画面へアクセスすると、ユーザーの役割に基づいて権限検証が実施される', async ({ page }) => {
  // ステップ1: テストユーザーをセンター長権限で認証し、ブラウザのセッションを確立する
  await page.goto('/');
  
  // ログイン画面で認証情報を入力
  await page.fill('input[type="text"]', 'testuser_center');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  
  // ログイン後の画面遷移を待つ
  await page.waitForNavigation();
  await page.waitForLoadState('networkidle');

  // ステップ2: 生産性ダッシュボード・分析画面から『最適人員配置案提案・実行画面』へのナビゲーションリンクをクリックする
  // 生産性ダッシュボード・分析画面が表示されていることを確認
  await expect(page).toHaveURL(/.*scr-1789461964046/);
  
  // 最適人員配置案提案・実行画面へのナビゲーションリンクをクリック
  await page.click('a:has-text("最適人員配置案提案・実行画面"), button:has-text("最適人員配置案提案・実行画面")');

  // ステップ3: 配置案確認画面へのアクセスリクエストがサーバーに送信される
  // ステップ4: ブラウザの画面に『最適人員配置案提案・実行画面』が表示されたことを確認する
  await page.waitForNavigation();
  await page.waitForLoadState('networkidle');

  // 期待結果: 配置案確認画面が正常に読み込まれ、『最適人員配置案提案・実行画面』のコンテンツが表示される
  await expect(page).toHaveURL(/.*scr-1789461978707/);
  
  // 配置案の一覧表が表示されていることを確認
  const allocationTable = page.locator('table, [role="grid"], [class*="table"]').first();
  await expect(allocationTable).toBeVisible();
  
  // 承認ボタンが表示されていることを確認
  const approveButton = page.locator('button:has-text("承認"), button:has-text("Approve")').first();
  await expect(approveButton).toBeVisible();
  
  // 実行ボタンが表示されていることを確認
  const executeButton = page.locator('button:has-text("実行"), button:has-text("Execute")').first();
  await expect(executeButton).toBeVisible();

  // ページタイトルまたはヘッダーが『最適人員配置案提案・実行画面』を示していることを確認
  const pageTitle = page.locator('h1, h2, [role="heading"]').first();
  await expect(pageTitle).toContainText(/最適人員配置案|配置案/);
});