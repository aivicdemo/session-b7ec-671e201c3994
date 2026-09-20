import { test, expect } from '@playwright/test';

test('SCEN-911: 認証されていないユーザーが配置案実績参照を実行しようとすると、認証段階で処理が止まる', async ({ page }) => {
  // ステップ1: ブラウザを開き、システムのログイン画面にアクセスする
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // ステップ2: ログイン画面で認証情報を入力せず、直接URLバーを使用して配置案実績参照画面のURLに遷移を試みる
  await page.goto('/placement-results/reference');

  // ステップ3: ページの読み込み完了を待つ
  await page.waitForLoadState('networkidle');

  // 期待結果: ページは認証チェック処理で止まり、ログイン画面にリダイレクトされるか、認証エラー画面が表示される
  // 配置案実績参照画面の内容は一切表示されない

  // ログイン画面にリダイレクトされているか、または認証エラーが表示されていることを確認
  const currentUrl = page.url();
  const isRedirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('auth');
  const hasAuthError = await page.locator('text=/認証|ログイン|401|403/i').isVisible().catch(() => false);

  // 配置案実績参照画面の内容が表示されていないことを確認
  const placementResultsContent = await page.locator('[data-testid="placement-results"]').isVisible().catch(() => false);

  expect(isRedirectedToLogin || hasAuthError).toBeTruthy();
  expect(placementResultsContent).toBeFalsy();
});