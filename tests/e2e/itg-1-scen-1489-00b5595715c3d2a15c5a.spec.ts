import { test, expect } from '@playwright/test';

test('SCEN-1489: セッションが無効な状態でCSV出力ボタンを押下すると、認証エラーが発生して処理が中断される', async ({ page, context }) => {
  // 作業指示・実績管理画面を開く
  await page.goto('/panels/scr-1789461813941.html');
  await page.waitForLoadState('networkidle');

  // 作業指示実績データが表示されていることを確認
  const workInstructionList = page.locator('[data-testid="work-instruction-list"]');
  await expect(workInstructionList).toBeVisible();

  // CSV出力ボタンを特定して要素が存在することを確認
  const csvButton = page.locator('[data-testid="export-csv-button"]');
  await expect(csvButton).toBeVisible();

  // ユーザー情報が表示されていることを確認（セッション有効を確認）
  const userNameElement = page.locator('.shell-user-name');
  await expect(userNameElement).toBeVisible();

  // セッション管理システムを操作してセッションを無効化
  // クッキーを削除してセッションを無効化
  await context.clearCookies();
  // ローカルストレージ/セッションストレージもクリア
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // ページをリロードしてセッション無効状態が確認されたことを視認
  await page.reload();
  await page.waitForLoadState('networkidle');

  // セッション無効状態を確認（ユーザー情報が表示されない、またはログイン画面にリダイレクト）
  const currentUrl = page.url();
  const isRedirectedToLogin = currentUrl.includes('login') || currentUrl.includes('auth');
  
  let sessionInvalidatedConfirmed = false;
  
  if (isRedirectedToLogin) {
    // ログイン画面にリダイレクトされたことを確認
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    sessionInvalidatedConfirmed = true;
  } else {
    // ユーザー情報が非表示になっていることを確認
    await expect(userNameElement).not.toBeVisible();
    sessionInvalidatedConfirmed = true;
  }

  expect(sessionInvalidatedConfirmed).toBe(true);

  // 作業指示実績データが表示されている状態に戻すため、セッションを復元
  if (isRedirectedToLogin) {
    // ログイン画面にいる場合、ログイン処理を実行
    const usernameInput = page.locator('input[placeholder*="ユーザー"], input[placeholder*="ID"], input[placeholder*="email"], input[placeholder*="user"]').first();
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("ログイン"), button:has-text("LOGIN"), button:has-text("Sign in")').first();

    // テスト用認証情報でログイン
    await usernameInput.fill('testuser');
    await passwordInput.fill('testpassword');
    await loginButton.click();
    await page.waitForLoadState('networkidle');
  } else {
    // ログイン画面にいない場合は、ログイン画面に遷移
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // ログイン処理を実行
    const usernameInput = page.locator('input[placeholder*="ユーザー"], input[placeholder*="ID"], input[placeholder*="email"], input[placeholder*="user"]').first();
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("ログイン"), button:has-text("LOGIN"), button:has-text("Sign in")').first();

    await usernameInput.fill('testuser');
    await passwordInput.fill('testpassword');
    await loginButton.click();
    await page.waitForLoadState('networkidle');
  }

  // 作業指示・実績管理画面に遷移
  await page.goto('/panels/scr-1789461813941.html');
  await page.waitForLoadState('networkidle');

  // 作業指示実績データが表示されたことを確認
  await expect(workInstructionList).toBeVisible();

  // CSV出力ボタンが表示されていることを確認
  await expect(csvButton).toBeVisible();

  // セッションを再度無効化
  await context.clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // ボタン押下直後のHTTPレスポンスを監視
  let authErrorResponse: { status: number; statusText: string } | null = null;
  const responseListener = (response: any) => {
    if (response.status() === 401 || response.status() === 403) {
      authErrorResponse = { status: response.status(), statusText: response.statusText() };
    }
  };
  page.on('response', responseListener);

  // ダウンロード監視を開始
  let downloadOccurred = false;
  const downloadListener = () => {
    downloadOccurred = true;
  };
  page.once('download', downloadListener);

  // CSV出力ボタンを押下
  await csvButton.click();

  // 画面遷移またはレスポンス受信を待機
  await Promise.race([
    page.waitForNavigation().catch(() => null),
    page.waitForTimeout(3000)
  ]);

  page.off('response', responseListener);

  // 認証エラー画面またはエラーメッセージの表示を確認
  const errorBanner = page.locator('[id="error-banner"]');
  const errorMessage = page.locator('[id="error-message"]');
  
  const errorBannerVisible = await errorBanner.isVisible().catch(() => false);
  const errorMessageVisible = await errorMessage.isVisible().catch(() => false);

  // エラーが表示されているか、またはログイン画面にリダイレクトされたかを確認
  const pageUrl = page.url();
  const redirectedToLoginAfterClick = pageUrl.includes('login') || pageUrl.includes('auth');
  
  let authErrorDisplayed = redirectedToLoginAfterClick;
  
  if (!redirectedToLoginAfterClick) {
    // ページ上にエラーメッセージが表示されているか確認
    if (errorBannerVisible) {
      const errorText = await errorBanner.textContent();
      authErrorDisplayed = errorText ? errorText.toLowerCase().includes('セッション') || errorText.toLowerCase().includes('認証') || errorText.toLowerCase().includes('無効') : false;
    }
    if (!authErrorDisplayed && errorMessageVisible) {
      const messageText = await errorMessage.textContent();
      authErrorDisplayed = messageText ? messageText.includes('セッションが無効') || messageText.includes('再度ログイン') : false;
    }
  }

  // 認証エラーが発生していることを確認
  const authErrorOccurred = authErrorResponse !== null || authErrorDisplayed;
  expect(authErrorOccurred).toBe(true);

  // ハンディターミナル・WMS連携ログ領域が表示されたままであることを確認
  // ただし、ログイン画面にリダイレクトされた場合は、これらの要素は表示されない
  if (!redirectedToLoginAfterClick) {
    const handiTerminalTab = page.locator('[data-testid="tab-handy-terminal"]');
    const wmsTab = page.locator('[data-testid="tab-wms"]');
    
    const handiTerminalVisible = await handiTerminalTab.isVisible().catch(() => false);
    const wmsVisible = await wmsTab.isVisible().catch(() => false);
    
    // 少なくともどちらかのタブが表示されていることを確認
    expect(handiTerminalVisible || wmsVisible).toBe(true);
  }

  // CSV出力が完了せず、ファイルダウンロードが発生しないことを確認
  expect(downloadOccurred).toBe(false);

  // CSV出力処理が中断されたことを確認
  expect(authErrorOccurred && !downloadOccurred).toBe(true);
});