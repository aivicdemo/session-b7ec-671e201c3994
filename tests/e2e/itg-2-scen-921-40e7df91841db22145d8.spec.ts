import { test, expect } from '@playwright/test';

test('SCEN-921: 権限のないユーザーが配置案却下操作を実行しようとするとき、権限検証に失敗し却下操作が拒否される', async ({ page }) => {
  // テストユーザー（配置案却下権限なし）でシステムにログインする
  await page.goto('/');
  await page.waitForURL(/.*\/panels\/.*\.html$/);
  
  // ログイン画面が表示されていることを確認
  const loginCard = page.locator('.login-card');
  await expect(loginCard).toBeVisible();
  
  // ログイン資格情報を入力（配置案却下権限なしのユーザー）
  await page.fill('input[type="text"]', 'testuser_no_reject');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン"), button[type="submit"]');
  
  // ログイン後の自動遷移を待つ
  await page.waitForURL(/.*\/panels\/.*\.html$/);
  await page.waitForTimeout(1000);

  // 最適人員配置案提案・実行画面へ遷移する
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');

  // 承認待ちまたは実行済みの配置案が存在することを確認
  const proposalRow = page.locator('table tbody tr').first();
  await expect(proposalRow).toBeVisible();
  
  // 配置案を1件選択する
  await proposalRow.click();

  // 却下操作前の配置案の状態を取得
  const statusCell = proposalRow.locator('td').nth(2); // 状態カラムの位置は実装に応じて調整
  const statusBefore = await statusCell.textContent();

  // 却下ボタンを探して実行する
  const rejectButton = page.locator('button:has-text("却下"), button[data-action="reject"]');
  await expect(rejectButton).toBeVisible();
  
  // 却下ボタンをクリック
  await rejectButton.click();

  // 権限検証エラーメッセージが画面に表示されていることを確認
  const errorMessage = page.locator('.error-message, [role="alert"], .notification-error');
  await expect(errorMessage).toBeVisible({ timeout: 5000 });
  await expect(errorMessage).toContainText(/権限|許可|認可|拒否/i);

  // 却下操作直後の配置案の状態が変更されていないことを確認
  const statusAfter = await statusCell.textContent();
  expect(statusAfter).toBe(statusBefore);

  // 画面が最適人員配置案提案・実行画面に留まっていることを確認
  await expect(page).toHaveURL(/scr-1789461978707/);
});