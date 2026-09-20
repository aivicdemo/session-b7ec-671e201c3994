import { test, expect } from '@playwright/test';

test('SCEN-1405: 認証に失敗した場合、モーダル確定操作が中止される', async ({ page }) => {
  // ログインして人員配置最適化提案・実行画面へ
  await page.goto('/');
  await page.waitForNavigation();
  
  // ログイン処理
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpass');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();
  
  // 人員配置最適化提案・実行画面へ遷移
  await page.click('nav a:has-text("人員配置最適化提案")');
  await page.waitForURL('**/scr-1789461798629.html');
  
  // 配置案の確定ボタンが表示されるまで待機
  const approveButton = page.locator('[data-testid="approve-button"]');
  await approveButton.waitFor({ state: 'visible' });
  
  // APIリクエストをトラッキングして認証失敗をシミュレート
  await page.route('**/api/**', (route) => {
    if (route.request().method() === 'POST') {
      // 認証失敗（401 Unauthorized）を返す
      route.respond({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: '認証に失敗しました' }) });
    } else {
      route.continue();
    }
  });
  
  // 配置案の確定ボタンをクリック
  await approveButton.click();
  
  // 承認確認モーダルが表示されるのを待つ
  const approveModal = page.locator('[id="approve-modal-overlay"]');
  await approveModal.waitFor({ state: 'visible' });
  
  // モーダル内の『確定』ボタンをクリック
  const confirmButton = page.locator('[data-testid="approve-modal-confirm"]');
  await confirmButton.click();
  
  // APIリクエストが送信されるのを待つ
  await page.waitForTimeout(1000);
  
  // 認証失敗時の検証：モーダルが表示されたままの状態を確認
  await expect(approveModal).toBeVisible();
  
  // エラーメッセージが表示されることを確認
  const errorMessageLocator = page.locator('text=/認証に失敗しました|認証エラー/i');
  await expect(errorMessageLocator).toBeVisible();
  
  // モーダルが閉じられていないことを確認
  await expect(approveModal).toBeVisible();
});