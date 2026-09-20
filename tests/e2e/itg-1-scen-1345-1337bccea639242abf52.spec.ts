import { test, expect } from '@playwright/test';

test('セッションが無効なユーザーが遷移を実行した場合、認証に失敗して画面遷移が拒否される', async ({ page, context }) => {
  // ステップ1: ブラウザを開き、作業進捗・人員配置最適化エンジンのログインページにアクセスする
  await page.goto('/');
  
  // ステップ2: 有効なユーザー認証情報でシステムにログインする
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpassword');
  await page.click('button[type="submit"]');
  
  // ログイン後の自動遷移を待つ
  await page.waitForURL('**/panels/scr-1789461783315.html');
  
  // ステップ3: 進捗・人員配置ダッシュボード画面が表示されたことを確認する
  await expect(page).toHaveURL(/.*scr-1789461783315\.html/);
  
  // ステップ4: 人員配置最適化提案・実行画面（配置提案画面）に遷移する
  await page.click('a[href*="scr-1789461798629"]');
  await page.waitForURL('**/panels/scr-1789461798629.html');
  
  // ステップ5: 配置提案画面が正常に表示されたことを確認する
  await expect(page).toHaveURL(/.*scr-1789461798629\.html/);
  
  // ステップ6: ブラウザの開発者ツールでセッションCookieまたはセッショントークンを削除して、セッションを無効にする
  const cookies = await context.cookies();
  const sessionCookies = cookies.filter(cookie => 
    cookie.name.toLowerCase().includes('session') || 
    cookie.name.toLowerCase().includes('token') ||
    cookie.name.toLowerCase().includes('auth')
  );
  
  for (const cookie of sessionCookies) {
    await context.clearCookies({ name: cookie.name });
  }
  
  // セッション削除後、削除が反映されるまで待機
  await page.waitForTimeout(500);
  
  // ステップ7・8: 配置提案画面から作業指示・実績管理画面への遷移を実行する
  // ネットワークリクエスト・レスポンスを確認する
  let authErrorResponse = null;
  
  const responseListener = (response) => {
    // 認証エラーレスポンス（401など）を捕捉
    if (response.status() === 401) {
      authErrorResponse = response;
    }
  };
  
  page.on('response', responseListener);
  
  // 遷移を実行（ボタン押下またはリンククリック）
  await page.click('a[href*="scr-1789461813941"]');
  
  // ナビゲーション完了を待つか、タイムアウト
  await Promise.race([
    page.waitForURL('**/panels/scr-1789461813941.html').catch(() => null),
    page.waitForURL('**/login*').catch(() => null),
    page.waitForURL('**/auth*').catch(() => null),
    page.waitForTimeout(2000)
  ]);
  
  page.off('response', responseListener);
  
  // 期待結果検証: 
  // 1. ネットワークリクエスト・レスポンスで401エラーが返却されたか、または
  // 2. ログインページへリダイレクトされたか、または
  // 3. 認証エラーメッセージが表示されているか
  
  const currentUrl = page.url();
  const isRedirectedToLogin = currentUrl.includes('login') || currentUrl.includes('auth');
  
  // エラーメッセージの確認
  const errorMessageLocator = page.locator('text=/セッションの有効期限が切れました|認証エラー|再度ログイン/i');
  const errorMessageVisible = await errorMessageLocator.isVisible().catch(() => false);
  
  // 期待結果: 作業指示・実績管理画面への遷移は成立しない
  expect(currentUrl).not.toContain('scr-1789461813941');
  
  // 認証エラーレスポンスが返却された、またはログインページへリダイレクト、またはエラーメッセージ表示
  const authenticationFailed = authErrorResponse !== null || isRedirectedToLogin || errorMessageVisible;
  expect(authenticationFailed).toBeTruthy();
});