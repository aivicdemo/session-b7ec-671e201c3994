import { test, expect } from '@playwright/test';

test('SCEN-928: 配置案確認完了の操作を実行するユーザーがセッション切れの状態で確認完了ボタンを押下すると、認証が失敗して操作が受け付けられない', async ({ page, context }) => {
  // Step 1: 最適人員配置案提案・実行画面にアクセスし、配置案の確認状態まで遷移する
  await page.goto('/panels/scr-1789461978707.html');
  
  // 配置案が表示されるまで待機
  await page.waitForSelector('button:has-text("確認完了")', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  
  // 配置案確認完了ボタンが表示されることを確認
  const confirmButton = page.locator('button:has-text("確認完了")');
  await expect(confirmButton).toBeVisible();
  
  // Step 2: ブラウザのセッションを無効化
  // Cookies とストレージをクリア
  await context.clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Step 3: 配置案確認完了ボタンを押下
  // ボタンクリック時のレスポンスを監視
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/') && (response.status() === 401 || response.status() === 403),
    { timeout: 10000 }
  ).catch(() => null);
  
  const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null);
  
  await confirmButton.click();
  
  // 認証エラーレスポンス（401/403）またはナビゲーションのいずれかを待機
  const authErrorResponse = await responsePromise;
  const navResult = await navigationPromise;
  
  // 期待結果: 認証エラー画面またはログイン画面が表示されることを確認
  
  // ケース1: 認証エラーレスポンス（401/403）が返された場合
  if (authErrorResponse) {
    const status = authErrorResponse.status();
    expect([401, 403]).toContain(status);
  } else {
    // ケース2: ナビゲーションが発生した場合、ログイン画面に遷移していることを確認
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('login') || 
                        currentUrl.includes('auth') || 
                        currentUrl.includes('scr-1789461783315');
    
    expect(isLoginPage).toBe(true);
    
    // ログイン画面の要素が表示されていることを確認
    const loginTitle = page.locator('text=ログイン').first();
    await expect(loginTitle).toBeVisible();
  }
  
  // 操作が受け付けられなかったことを確認：
  // 配置案確認完了処理が実行されなかったことを検証
  // ナビゲーション前後で URL が確認実行画面のままか、
  // またはログイン画面に遷移していることで、処理が実行されなかったことを確認
  const finalUrl = page.url();
  const processNotExecuted = 
    finalUrl.includes('scr-1789461978707') || 
    finalUrl.includes('login') || 
    finalUrl.includes('auth') || 
    finalUrl.includes('scr-1789461783315');
  
  expect(processNotExecuted).toBe(true);
});