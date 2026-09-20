import { test, expect } from '@playwright/test';

test('SCEN-1415: 人員配置案の配信操作権限がないユーザーが確定すると、操作が拒否される', async ({ page, context }) => {
  // ログイン画面に移動
  await page.goto('/');
  
  // 権限を持たないユーザーでログイン
  await page.fill('input[placeholder*="ユーザー"]', 'user_no_permission');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  
  // ログイン後の自動遷移を待つ
  await page.waitForURL('**/scr-1789461798629.html');
  
  // 人員配置最適化提案・実行画面が表示されることを確認
  await expect(page.locator('text=人員配置最適化提案')).toBeVisible();
  
  // 配置案が提案済み状態で表示されていることを確認
  const proposalsContainer = page.locator('#proposals-container');
  await expect(proposalsContainer).toBeVisible();
  
  // 提案済み状態の配置案が存在することを確認
  const proposalItem = proposalsContainer.locator('text=提案済み').first();
  await expect(proposalItem).toBeVisible();
  
  // その配置案の行をクリックして配置案の詳細を開く
  const proposalRow = proposalsContainer.locator('div').filter({ has: proposalItem }).first();
  await proposalRow.click();
  
  // 配置案詳細画面が開かれたことを確認
  const detailContainer = page.locator('#proposal-detail-container');
  await expect(detailContainer).toBeVisible();
  
  // 配置案詳細画面に「配信」ボタンが表示されていることを確認
  const distributeButton = page.locator('[data-testid="distribute-button"]');
  await expect(distributeButton).toBeVisible();
  
  // HTTP 403 Forbidden エラーを検出するリスナーを設定
  let received403 = false;
  page.on('response', response => {
    if (response.status() === 403) {
      received403 = true;
    }
  });
  
  // 「配信」ボタンをクリックして配信モーダルを開く
  await distributeButton.click();
  
  // 配信モーダルが表示されることを確認
  const distributeModal = page.locator('#distribute-modal-overlay');
  await expect(distributeModal).toBeVisible();
  
  // 配信モーダル内の「確定」ボタンをクリック
  const confirmButton = page.locator('[data-testid="distribute-modal-confirm"]');
  await confirmButton.click();
  
  // 画面の応答を待つ（最大5秒）
  await page.waitForTimeout(5000);
  
  // 配信モーダルが閉じていないことを確認
  await expect(distributeModal).toBeVisible();
  
  // エラーメッセージが表示されていることを確認
  const errorMessage = page.locator('#error-message');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('この操作を実行する権限がありません。拠点長以上の権限が必要です');
  
  // HTTP 403 Forbidden エラーが記録されたことを確認
  await expect(received403).toBe(true);
  
  // 配置案が依然として提案済み状態のままであることを確認
  const statusText = detailContainer.locator('text=提案済み');
  await expect(statusText).toBeVisible();
});