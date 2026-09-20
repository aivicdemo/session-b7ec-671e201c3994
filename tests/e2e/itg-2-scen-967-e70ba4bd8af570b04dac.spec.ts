import { test, expect } from '@playwright/test';

test('SCEN-967: 認証に失敗した作業者が配置案参照を操作しようとすると、権限検証で拒否される', async ({ page }) => {
  // ステップ1: ログイン画面で誤ったユーザーIDまたはパスワードを入力して認証を試行
  await page.goto('/');
  
  // ログイン画面が表示されることを確認
  await expect(page.locator('.login-title')).toBeVisible();
  
  // 誤ったユーザーID・パスワードを入力
  await page.fill('input[type="text"]', 'invalid_user');
  await page.fill('input[type="password"]', 'invalid_password');
  
  // ログインボタンをクリック
  await page.click('button.login-button');
  
  // ステップ2: 認証失敗メッセージが表示されることを確認
  await expect(page.locator('text=/認証に失敗|ユーザーIDまたはパスワードが/i')).toBeVisible();
  
  // ログイン状態が確立されていないことを検証（ログイン画面に留まる）
  const urlAfterFailure = page.url();
  expect(urlAfterFailure).toMatch(/login|\/$/);
  
  // ステップ3: 認証されていないセッションの状態で、最適人員配置案提案・実行画面へのアクセスを試みる
  await page.goto('/panels/scr-1789461978707.html');
  
  // ステップ4: システムが当該操作を検出し、権限検証処理を実行される
  // ページロードが完了するまで待機
  await page.waitForLoadState('networkidle');
  
  // 期待結果: 権限検証で拒否される
  const finalUrl = page.url();
  
  // ログイン画面へ強制遷移されたか、または認証を求めるメッセージが表示されているか確認
  const isRedirectedToLogin = finalUrl.includes('login') || finalUrl.includes('scr-1789461783315');
  const authMessageVisible = await page.locator('text=/ログインしてください|セッションが無効です|認証が必要です/i').isVisible().catch(() => false);
  
  // どちらか一方が満たされていることを確認
  expect(isRedirectedToLogin || authMessageVisible).toBeTruthy();
  
  // 配置案データが一切表示されていないことを確認
  // 最適人員配置案提案・実行画面の主要なコンテンツが表示されていないことを検証
  const pageText = await page.locator('body').textContent();
  
  // 認証メッセージが表示されている場合は、配置案データが表示されていないことを確認
  if (authMessageVisible) {
    expect(pageText).not.toMatch(/配置案|最適配置/);
  }
  
  // ログイン画面にリダイレクトされた場合は、配置案画面のコンテンツが表示されていないことを確認
  if (isRedirectedToLogin) {
    expect(pageText).not.toMatch(/配置案|最適配置/);
  }
});