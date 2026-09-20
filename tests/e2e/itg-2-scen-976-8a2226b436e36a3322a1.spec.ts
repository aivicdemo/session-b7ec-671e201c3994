import { test, expect } from '@playwright/test';

test('SCEN-976: 正常系：実績データを入力して保存ボタンを押すと、認証・権限・データ検証を経てシステムに記録される', async ({ page }) => {
  // ログイン画面に遷移
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // ログインフォームに入力（テスト用認証情報）
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpassword');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');

  // 作業実績データ記録・入力画面に遷移
  await page.goto('/panels/scr-1789461993203.html');
  await page.waitForLoadState('networkidle');

  // 認証が完了した状態を確認
  const authIndicator = page.locator('[data-testid="auth-status"]');
  await expect(authIndicator).toBeVisible();

  // 入力フォームに値を入力
  await page.fill('input[name="worker-id"]', 'WK-001');
  await page.fill('input[name="work-date"]', '2024-01-15');
  await page.selectOption('select[name="work-type"]', 'ピッキング');
  await page.selectOption('select[name="department"]', 'A-01');
  await page.fill('input[name="quantity"]', '150');
  await page.fill('input[name="time"]', '120');

  // 保存ボタンを押下
  await page.click('button[data-testid="save-button"]');

  // 権限チェックとデータ検証、保存処理を待つ
  await page.waitForResponse(response =>
    response.url().includes('/api/') && response.status() === 200
  );

  // 成功メッセージが表示されることを確認
  const successMessage = page.locator('[data-testid="success-message"]');
  await expect(successMessage).toContainText('実績データが正常に記録されました');

  // 入力フォームがクリアされたことを確認
  const workerIdInput = page.locator('input[name="worker-id"]');
  await expect(workerIdInput).toHaveValue('');

  // 生産性ダッシュボード・分析画面に遷移
  await page.goto('/panels/scr-1789461964046.html');
  await page.waitForLoadState('networkidle');

  // 作業者WK-001の当日実績が表示されていることを確認
  const workerPerformance = page.locator('[data-testid="worker-performance-WK-001"]');
  await expect(workerPerformance).toContainText('150');
  await expect(workerPerformance).toContainText('120');
});