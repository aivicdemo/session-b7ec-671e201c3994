import { test, expect } from '@playwright/test';

test('SCEN-1201: セッション有効期限が切れているユーザーはダッシュボード画面へのアクセスが拒否される', async ({ page, context }) => {
  const baseUrl = 'http://localhost:3000';
  const dashboardUrl = `${baseUrl}/panels/scr-1789461783315.html`;
  const loginUrl = `${baseUrl}/login`;

  // Step 1: ブラウザを開く（Playwrightにより自動的に実行）

  // Step 2 & 3: ログインしてダッシュボード画面が正常に表示されることを確認
  await page.goto(loginUrl);
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password123');
  await page.click('button:has-text("ログイン")');
  
  // ログイン後、ダッシュボード画面へ自動遷移するのを待つ
  await page.waitForURL(dashboardUrl);
  
  // ダッシュボード画面が表示されることを確認
  await expect(page).toHaveURL(dashboardUrl);
  await expect(page.locator('text=進捗・人員配置ダッシュボード')).toBeVisible();

  // Step 4: セッション有効期限を期限切れ状態に変更
  // ブラウザのローカルストレージ/セッションストレージからセッショントークンを削除
  await context.clearCookies();
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  // Step 5: ダッシュボード画面内のUI要素をクリックしてサーバー側へのリクエストを発生させる
  // 例: フィルターボタンやデータ更新トリガーなど
  await page.click('[data-testid="optimize-button"]');

  // Step 6: ブラウザの応答とURL遷移を確認
  // セッション有効期限切れのため、ログイン画面へリダイレクトされることを期待
  await page.waitForURL(loginUrl, { timeout: 10000 });
  
  // 期待結果の検証
  await expect(page).toHaveURL(loginUrl);
  
  // ダッシュボード画面の内容が表示されていないことを確認
  await expect(page.locator('[data-testid="kpi-risk-count"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="kpi-sites-action"]')).not.toBeVisible();
  
  // ログイン画面の要素が表示されていることを確認
  await expect(page.locator('text=ログイン')).toBeVisible();
});