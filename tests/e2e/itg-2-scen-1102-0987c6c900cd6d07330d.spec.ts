import { test, expect } from '@playwright/test';

test('SCEN-1102: 確認ボタン操作時にセッションが無効な場合は認証画面に遷移する', async ({ browser, context }) => {
  // 最適人員配置案提案・実行画面を開く
  const page = await context.newPage();
  await page.goto('/panels/scr-1789461978707.html');
  
  // 配置案の確認内容が表示されるまで待機
  await page.waitForLoadState('networkidle');
  
  // セッションを無効にする（セッションCookieを削除）
  const cookies = await context.cookies();
  const sessionCookies = cookies.filter(cookie => 
    cookie.name.toLowerCase().includes('session') || 
    cookie.name.toLowerCase().includes('auth')
  );
  
  for (const cookie of sessionCookies) {
    await context.clearCookies({ name: cookie.name });
  }
  
  // 配置案確認画面上の「確認」ボタンをクリック
  const confirmButton = page.locator('button:has-text("確認")').first();
  await confirmButton.click();
  
  // 認証画面へ遷移することを確認
  await page.waitForURL(/\/login/);
  expect(page.url()).toMatch(/\/login/);
  
  // ユーザーID・パスワード入力フィールドが表示されることを確認
  const userIdInput = page.locator('input[type="text"]');
  const passwordInput = page.locator('input[type="password"]');
  
  await expect(userIdInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
});