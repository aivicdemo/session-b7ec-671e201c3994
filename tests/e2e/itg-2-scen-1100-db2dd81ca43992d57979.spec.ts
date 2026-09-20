import { test, expect } from '@playwright/test';

test('SCEN-1100: 指定した配置計画が存在しない場合、配置計画取得段階で失敗して処理が進まない', async ({ page }) => {
  // ログイン画面へ遷移
  await page.goto('/');
  
  // ログインフォームが表示されるまで待機
  await page.waitForSelector('.login-card');
  
  // ログイン操作（テスト用認証情報を使用）
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpass');
  await page.click('button:has-text("ログイン")');
  
  // ログイン後、最適人員配置案提案・実行画面への遷移を待機
  await page.waitForURL('**/scr-1789461978707.html');
  
  // 配置計画却下処理の入力フォームを特定
  const planIdInput = page.locator('input[name="planId"], input[placeholder*="配置計画"], input[id*="plan"]').first();
  
  // 存在しない配置計画IDを入力
  await planIdInput.fill('nonexistent-plan-id-99999');
  
  // 却下実行ボタンをクリック
  const rejectButton = page.locator('button:has-text("却下"), button[id*="reject"], button[class*="reject"]').first();
  await rejectButton.click();
  
  // エラーメッセージが表示されるまで待機
  const errorMessage = page.locator('text=配置計画が見つかりません。計画IDを確認してください');
  await expect(errorMessage).toBeVisible();
  
  // エラー表示領域が入力フォーム直下に存在することを確認
  // 入力フォーム要素の親要素内で、入力フォームの直後に続くエラー表示領域を確認
  const errorContainer = page.locator('input[name="planId"], input[placeholder*="配置計画"], input[id*="plan"]')
    .first()
    .locator('xpath=..//*[@role="alert" or contains(@class, "error")]')
    .first();
  
  await expect(errorContainer).toBeVisible();
  
  // エラーメッセージが表示領域に含まれていることを確認
  await expect(errorContainer).toContainText('配置計画が見つかりません。計画IDを確認してください');
  
  // エラーコンテナの背景色が赤系であることを確認
  const backgroundColor = await errorContainer.evaluate(el => {
    return window.getComputedStyle(el).backgroundColor;
  });
  
  // 赤系の背景色（RGB値で赤成分が高い）であることを確認
  const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    expect(r).toBeGreaterThan(100);
    expect(g).toBeLessThan(100);
    expect(b).toBeLessThan(100);
  }
  
  // 却下ボタンが非活性のままであることを確認
  await expect(rejectButton).toBeDisabled();
});