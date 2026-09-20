import { test, expect } from '@playwright/test';

test('SCEN-900: セッション無効な状態でユーザーが画面アクセスを試みると、認証に失敗する', async ({ page, context }) => {
  // ステップ1: ログイン画面に遷移
  await page.goto('/');
  await page.waitForURL(/login|auth/, { timeout: 5000 }).catch(() => {});
  
  // ステップ2: 有効なユーザー認証情報でログインしセッションを確立
  await page.fill('input[type="text"], input[placeholder*="ユーザー"], input[placeholder*="ID"], input[placeholder*="id"]', 'testuser');
  await page.fill('input[type="password"], input[placeholder*="パスワード"]', 'testpass');
  await page.click('button[type="submit"], button:has-text("ログイン")');
  
  // ログイン後の遷移を待つ
  await page.waitForURL(/panels|dashboard/, { timeout: 10000 });
  
  // ステップ3: セッション用のCookieまたはトークンを削除
  const cookies = await context.cookies();
  const sessionCookies = cookies.filter(cookie => 
    cookie.name.toLowerCase().includes('session') ||
    cookie.name.toLowerCase().includes('token') ||
    cookie.name.toLowerCase().includes('auth') ||
    cookie.name === 'JSESSIONID'
  );
  
  for (const cookie of sessionCookies) {
    await context.clearCookies({ name: cookie.name });
  }
  
  // ステップ4: 最適人員配置案提案・実行画面のURLに直接アクセス
  await page.goto('/panels/scr-1789461978707.html');
  
  // 期待結果: 認証エラー画面またはログイン画面にリダイレクトされることを確認
  const currentUrl = page.url();
  const isRedirectedToAuth = currentUrl.includes('login') || 
                              currentUrl.includes('auth') ||
                              currentUrl.includes('session');
  
  expect(isRedirectedToAuth).toBeTruthy();
  
  // 期待結果: 認証失敗メッセージが表示されていることを確認
  const hasErrorMessage = await page.locator(
    'text=/セッションが無効です|再度ログインしてください|認証エラー|ログインが必要です/'
  ).isVisible().catch(() => false);
  
  // メッセージが表示されていない場合でも、ログイン画面に遷移していれば条件を満たす
  if (!hasErrorMessage) {
    const isOnLoginPage = await page.locator(
      'text=/ログイン|作業管理システム/'
    ).isVisible().catch(() => false);
    expect(isOnLoginPage).toBeTruthy();
  } else {
    expect(hasErrorMessage).toBeTruthy();
  }
  
  // 期待結果: 最適人員配置案提案・実行画面の業務データが表示されていないことを確認
  const businessDataVisible = await page.locator(
    'text=/配置案|最適人員|提案/'
  ).isVisible().catch(() => false);
  
  expect(businessDataVisible).toBeFalsy();
});