import { test, expect } from '@playwright/test';

test('SCEN-885: 認証済みユーザーがフィルター適用ボタンを操作すると、セッション有効性が検証される', async ({ page }) => {
  // ログイン画面にアクセス
  await page.goto('/');
  
  // ログイン処理
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpassword');
  
  // ログインボタンをクリック
  const loginPromise = page.waitForNavigation();
  await page.click('button:has-text("ログイン")');
  await loginPromise;
  
  // ダッシュボード画面にアクセス
  await page.goto('/panels/scr-1789461964046.html');
  
  // ページが読み込まれるまで待機
  await page.waitForLoadState('networkidle');
  
  // フィルター条件を設定
  // 作業者名フィルター
  const workerNameInput = page.locator('input[placeholder*="作業者名"], input[data-filter="worker_name"]').first();
  if (await workerNameInput.isVisible()) {
    await workerNameInput.fill('テストユーザー');
  }
  
  // 期間フィルター
  const dateStartInput = page.locator('input[type="date"], input[data-filter="start_date"]').first();
  if (await dateStartInput.isVisible()) {
    await dateStartInput.fill('2024-01-01');
  }
  
  const dateEndInput = page.locator('input[type="date"], input[data-filter="end_date"]').last();
  if (await dateEndInput.isVisible()) {
    await dateEndInput.fill('2024-01-31');
  }
  
  // 作業タイプフィルター
  const taskTypeSelect = page.locator('select[data-filter="task_type"], [role="combobox"][data-filter="task_type"]').first();
  if (await taskTypeSelect.isVisible()) {
    await taskTypeSelect.click();
    await page.locator('[role="option"]').first().click();
  }
  
  // フィルター適用ボタンを取得
  const applyFilterButton = page.locator('button:has-text("フィルター適用"), button[data-action="apply-filter"]').first();
  
  // Network タブでリクエストを監視
  // セッション検証エンドポイントへのリクエストを監視し、Authorization ヘッダーと 200 ステータスコードを検証
  const sessionValidationPromise = page.waitForResponse(response => {
    const url = response.url();
    const headers = response.request().headers();
    
    // セッション検証エンドポイントへのリクエストであることを確認
    // Authorization ヘッダーが含まれており、200ステータスコードであることを確認
    return (
      (url.includes('/api/session') || url.includes('/auth/validate') || url.includes('/validate')) &&
      headers['authorization'] !== undefined &&
      response.status() === 200
    );
  });
  
  // フィルター適用ボタンをクリック
  await applyFilterButton.click();
  
  // セッション検証リクエストを待機
  const sessionResponse = await sessionValidationPromise;
  
  // Authorization ヘッダーが含まれていることを確認
  const authHeader = sessionResponse.request().headers()['authorization'];
  expect(authHeader).toBeDefined();
  expect(authHeader).toMatch(/^Bearer |^Token /);
  
  // ステータスコードが200であることを確認
  expect(sessionResponse.status()).toBe(200);
  
  // ページが更新されてネットワークアイドル状態になることを確認
  await page.waitForLoadState('networkidle');
  
  // フィルター条件が反映されたダッシュボード内容が表示されていることを確認
  const dashboardContent = page.locator('[data-testid="dashboard-content"], .dashboard-container, main');
  await expect(dashboardContent).toBeVisible();
  
  // フィルター結果が表示されていることを確認
  const resultItemsAfter = page.locator('[data-testid="result-item"], tbody tr, .data-row');
  const itemCountAfter = await resultItemsAfter.count();
  
  // フィルター条件が反映された結果が表示されていることを確認
  expect(itemCountAfter).toBeGreaterThan(0);
});