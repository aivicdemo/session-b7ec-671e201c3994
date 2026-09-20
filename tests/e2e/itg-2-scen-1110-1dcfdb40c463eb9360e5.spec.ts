import { test, expect } from '@playwright/test';

test('ユーザーセッションが無効な状態で承認ボタンを操作すると、工程1の認証で拒否されて処理が中断される', async ({ page, context }) => {
  // 最適人員配置案提案・実行画面にアクセス
  await page.goto('/panels/scr-1789461978707.html');
  
  // 配置案が表示された状態を確認
  const placementProposal = page.locator('[data-testid="placement-proposal"]');
  await expect(placementProposal).toBeVisible();
  
  // セッションを無効化（セッションCookieを削除）
  const cookies = await context.cookies();
  const sessionCookies = cookies.filter(c => 
    c.name.includes('session') || 
    c.name.includes('auth') || 
    c.name.includes('token')
  );
  
  for (const cookie of sessionCookies) {
    await context.clearCookies({ name: cookie.name });
  }
  
  // 承認ボタンをクリック
  const approvalButton = page.locator('button:has-text("承認")').first();
  await approvalButton.click();
  
  // 認証チェック（工程1）の実行を待機
  await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
  
  // 認証が拒否されて、ログイン画面またはエラー画面へリダイレクトされることを確認
  const currentUrl = page.url();
  const isRedirectedToLogin = currentUrl.includes('login') || 
                              currentUrl.includes('auth') ||
                              currentUrl.includes('error');
  expect(isRedirectedToLogin).toBeTruthy();
  
  // 認証エラーメッセージが表示されることを確認
  const errorMessage = page.locator(
    'text=/セッションが無効です|ログインしてください|認証に失敗しました|再度ログインしてください/i'
  );
  await expect(errorMessage).toBeVisible();
});