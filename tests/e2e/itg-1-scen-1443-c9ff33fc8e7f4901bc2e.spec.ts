import { test, expect } from '@playwright/test';

test('SCEN-1443: ダッシュボード表示（実績管理画面から）', async ({ page }) => {
  // ログイン画面にアクセス
  await page.goto('/');
  
  // ログインフォームを入力して送信
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpass');
  await page.click('button:has-text("ログイン")');
  
  // 作業指示・実績管理画面への遷移を待機
  await page.waitForURL('**/scr-1789461813941.html');
  
  // 進捗・人員配置ダッシュボードへ遷移
  await page.click('nav >> text=進捗・人員配置ダッシュボード');
  await page.waitForURL('**/scr-1789461783315.html');
  
  // ダッシュボード上で遅延リスクが検出されているかを確認
  const riskCountElement = page.locator('[data-testid="kpi-risk-count"]');
  await expect(riskCountElement).toBeVisible();
  
  // 遅延要因分類機能を開く（リスク評価テーブルの遅延状態の要因分類UI）
  const riskTable = page.locator('[data-testid="risk-assessment-table"]');
  await expect(riskTable).toBeVisible();
  
  // テーブル内で遅延状態が表示されているかを確認
  const riskRows = riskTable.locator('tbody tr');
  const rowCount = await riskRows.count();
  
  if (rowCount > 0) {
    // 最初の遅延リスク行を選択
    const firstRow = riskRows.first();
    await firstRow.click();
    
    // 遅延要因分類の実行ボタンをクリック
    const confirmButton = page.locator('[data-testid="confirm-results-button"]');
    await confirmButton.click();
    
    // エラーメッセージが表示されるまで待機（最大10秒）
    const errorMessage = page.locator('text=作業優先順位が設定されていません。優先順位を指定してください');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    // 分類処理が中止され、ダッシュボード画面が遅延要因分類前の状態に戻っていることを確認
    await expect(riskTable).toBeVisible();
    
    // ユーザーが操作を選択できる状態であることを確認（ナビゲーションと操作ボタンが利用可能）
    const navElement = page.locator('nav');
    await expect(navElement).toBeVisible();
    const optimizeButton = page.locator('[data-testid="optimize-button"]');
    await expect(optimizeButton).toBeVisible();
  }
});