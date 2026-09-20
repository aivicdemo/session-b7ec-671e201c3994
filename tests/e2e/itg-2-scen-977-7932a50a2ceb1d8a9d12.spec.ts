import { test, expect } from '@playwright/test';

test('SCEN-977: エラー系：未認証ユーザーが実績データ保存を実行しようとすると、認証段階で拒否される', async ({ page, context }) => {
  // 未認証状態を保証するため、認証情報を削除
  await context.clearCookies();
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  // Step 1: ブラウザで作業実績データ記録・入力画面へのURLにアクセスする
  await page.goto('/panels/scr-1789461993203.html');

  // 実績データ入力フォームが表示されていることを確認
  const form = page.locator('form');
  await expect(form).toBeVisible({ timeout: 5000 });

  // 保存ボタンが表示されていることを確認
  const saveButton = page.locator('button:has-text("保存")');
  await expect(saveButton).toBeVisible({ timeout: 5000 });

  // 保存ボタンクリック後のレスポンスを監視
  let unauthorizedResponseReceived = false;

  const responseListener = (response) => {
    // 保存処理に関連するAPIリクエストのみを対象
    const url = response.url();
    const method = response.request().method();
    if ((method === 'POST' || method === 'PUT') && url.includes('/api/')) {
      if (response.status() === 401) {
        unauthorizedResponseReceived = true;
      }
    }
  };

  page.on('response', responseListener);

  // Step 2: 認証情報を入力せずに、実績データ入力フォーム上の保存ボタンをクリックする
  await saveButton.click();

  // ページ遷移を待つ
  try {
    await page.waitForURL(/.*login.*|.*auth.*/i, { timeout: 5000 });
  } catch {
    // URLが変わらない場合の処理
  }

  // 期待結果の確認：

  // 1. HTTP 401 Unauthorized が返されたか、または認証エラーメッセージが画面に表示されたかを確認
  const authErrorMessage = page.locator(
    'text=/認証エラー|ログインが必要|認証が必要|Unauthorized|401/i'
  );
  
  const has401Response = unauthorizedResponseReceived;
  const hasAuthErrorMessage = await authErrorMessage.isVisible().catch(() => false);
  
  const hasAuthError = has401Response || hasAuthErrorMessage;
  expect(hasAuthError).toBe(true);

  // 2. ログイン画面またはリダイレクト確認
  const currentUrl = page.url();
  const isLoginOrAuthPage = /.*login.*|.*auth.*/i.test(currentUrl);
  
  // 3. ログイン画面のタイトル要素、または認証画面の何らかの要素が表示されていることを確認
  const loginTitle = page.locator('.login-title');
  const loginCard = page.locator('.login-card');
  const authPageTitle = page.locator('title');
  
  const hasLoginTitleVisible = await loginTitle.isVisible().catch(() => false);
  const hasLoginCardVisible = await loginCard.isVisible().catch(() => false);
  
  const isDisplayingAuthScreen = isLoginOrAuthPage && (hasLoginTitleVisible || hasLoginCardVisible);
  
  expect(isDisplayingAuthScreen || hasAuthErrorMessage).toBe(true);

  page.off('response', responseListener);
});