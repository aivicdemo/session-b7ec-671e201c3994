import { test, expect } from '@playwright/test';

test('SCEN-1529: セッションが無効またはユーザー認証に失敗した場合、履歴データは表示されず、再認証を促すメッセージが画面に表示される', async ({ page, context }) => {
  // Step 1: ブラウザで進捗・人員配置ダッシュボードのURLにアクセスする
  await page.goto('/panels/scr-1789461783315.html');
  
  // Step 2: ダッシュボード内に作業指示受領履歴が表示されていることを確認する
  const deliveryHistoryTable = page.locator('[data-testid="delivery-history-table"]');
  await expect(deliveryHistoryTable).toBeVisible();
  
  // Step 3: ブラウザの開発者ツールでセッションクッキーを削除し、セッションタイムアウトをシミュレートする
  const cookies = await context.cookies();
  const sessionCookies = cookies.filter(cookie => 
    cookie.name.toLowerCase().includes('session') || 
    cookie.name.toLowerCase().includes('auth') ||
    cookie.name.toLowerCase().includes('token')
  );
  
  for (const cookie of sessionCookies) {
    await context.clearCookies({ name: cookie.name });
  }
  
  // Step 4: 画面をリロード（F5キーまたはリロードボタン）する
  await page.reload();
  
  // Step 5: 画面の表示状態を確認する
  // 期待結果: ダッシュボード内に表示されていた作業指示受領履歴データがすべて消失した状態で、
  // 再認証を促すメッセージが表示される、またはログイン画面へ遷移する
  
  // 作業指示受領履歴テーブルが表示されないことを確認
  const historyTableAfterReload = page.locator('[data-testid="delivery-history-table"]');
  await expect(historyTableAfterReload).not.toBeVisible();
  
  // 再認証メッセージの表示を確認するか、ログイン画面への遷移を確認
  const reauthMessage = page.locator('text=/セッションが無効|認証に失敗|ログインしてください/i');
  const loginPage = page.locator('text=ログイン');
  
  // メッセージが表示されているか、ログイン画面に遷移しているかを確認
  const messageVisible = await reauthMessage.isVisible().catch(() => false);
  const onLoginPage = await loginPage.isVisible().catch(() => false);
  
  expect(messageVisible || onLoginPage).toBeTruthy();
  
  // さらに詳しく、URL がログイン画面に遷移したか、またはエラーメッセージが存在するかを確認
  const currentUrl = page.url();
  const isOnLoginOrError = currentUrl.includes('login') || messageVisible;
  
  expect(isOnLoginOrError).toBeTruthy();
});