import { test, expect } from '@playwright/test';

test('SCEN-1520: 認証済みであってもハンディターミナル連携ログ参照権限を持たないユーザーがログ表示を試みると、操作が拒否される', async ({ page }) => {
  // テストユーザー（ハンディターミナル連携ログ参照権限なし）でシステムにログインする
  await page.goto('/');
  
  // ログイン画面で認証情報を入力
  await page.fill('input[type="text"]', 'testuser_no_handy_permission');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  
  // ログイン後のリダイレクトを待機
  await page.waitForURL('**/panels/scr-1789461783315.html');

  // 作業指示・実績管理画面へ遷移する
  await page.click('a:has-text("作業指示・実績管理")');
  await page.waitForURL('**/panels/scr-1789461813941.html');

  // 画面上のハンディターミナル連携ログ表示領域またはログ表示ボタンを特定
  const handyTerminalTab = page.getByTestId('tab-handy-terminal');
  
  // ハンディターミナル連携ログを表示しようとする操作（タブ選択）を実行する
  await handyTerminalTab.click();

  // 操作実行直後、画面上に『このコンテンツへのアクセス権がありません』または『ハンディターミナル連携ログを表示する権限がありません』というエラーメッセージが表示される
  const errorBanner = page.getByTestId('error-banner');
  await expect(errorBanner).toBeVisible();
  
  const errorMessage = page.getByTestId('error-message');
  const errorText = await errorMessage.textContent();
  
  const hasAccessDeniedMessage = 
    errorText?.includes('このコンテンツへのアクセス権がありません') ||
    errorText?.includes('ハンディターミナル連携ログを表示する権限がありません');
  
  expect(hasAccessDeniedMessage).toBe(true);

  // ログ表示領域は空白のままで、ハンディターミナル連携ログのデータは一切表示されない
  const handyTerminalLogList = page.getByTestId('handy-terminal-log-list');
  const logTbody = page.locator('#handy-terminal-log-tbody');
  
  // 親要素が非表示またはデータが空であることを確認
  const isHidden = await handyTerminalLogList.evaluate(el => {
    const style = window.getComputedStyle(el);
    return style.display === 'none' || style.visibility === 'hidden';
  });
  
  const rowCount = await logTbody.locator('tr').count();
  
  expect(isHidden || rowCount === 0).toBe(true);

  // 画面遷移は発生しない
  await expect(page).toHaveURL('**/panels/scr-1789461813941.html');
});