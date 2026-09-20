import { test, expect } from '@playwright/test';

test('SCEN-1316: ダッシュボード表示（配置提案画面から）- 集約データに拠点別の進捗状況が含まれて表示される', async ({ page }) => {
  // テスト環境にログイン
  await page.goto('/');
  
  // ログイン画面が表示されるまで待つ
  await page.waitForSelector('[class*="login-card"]');
  
  // ログイン情報を入力（テスト環境用のデフォルト認証情報）
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpass');
  await page.click('button[type="submit"]');
  
  // ログイン後のリダイレクトを待つ
  await page.waitForURL(/.*scr-1789461783315.*/, { timeout: 30000 });
  
  // ナビゲーションから人員配置最適化提案・実行画面へ遷移
  await page.click('a[href*="scr-1789461798629"]');
  await page.waitForURL(/.*scr-1789461798629.*/, { timeout: 30000 });
  await page.waitForLoadState('networkidle');
  
  // 人員配置最適化提案・実行画面でダッシュボード遷移ボタンをクリック
  // 仕様では『ダッシュボードへ遷移』または『進捗・人員配置ダッシュボードを表示』
  const dashboardButton = page.locator('button:has-text("進捗・人員配置ダッシュボード")');
  await dashboardButton.click();
  
  // ダッシュボード画面への遷移を待つ
  await page.waitForURL(/.*scr-1789461783315.*/, { timeout: 30000 });
  await page.waitForLoadState('networkidle');
  
  // ダッシュボード画面が表示されたことを確認
  await expect(page).toHaveURL(/.*scr-1789461783315.*/) ;
  
  // 拠点別進捗状況テーブルが表示されていることを確認
  const siteVarianceTable = page.locator('[data-testid="site-variance-table"]');
  await expect(siteVarianceTable).toBeVisible();
  
  // テーブルの行を取得
  const tableRows = page.locator('#site-variance-tbody tr');
  const rowCount = await tableRows.count();
  
  // 複数拠点のデータが表示されていることを確認（最低2拠点以上）
  expect(rowCount).toBeGreaterThanOrEqual(2);
  
  // 各行に拠点情報が含まれていることを確認
  for (let i = 0; i < rowCount; i++) {
    const row = tableRows.nth(i);
    const cells = row.locator('td');
    const cellCount = await cells.count();
    
    // 拠点名が表示されている（第1列）
    const siteName = cells.nth(0);
    await expect(siteName).toBeVisible();
    const siteText = await siteName.textContent();
    expect(siteText).toBeTruthy();
    expect(siteText).not.toMatch(/^\s*$/);
    
    // 進捗率（%）が表示されている（第2列）
    const progressCell = cells.nth(1);
    await expect(progressCell).toBeVisible();
    const progressText = await progressCell.textContent();
    expect(progressText).toMatch(/\d+(\.\d+)?%/);
    
    // 完了数が表示されている（第3列）- 数値形式を検証
    const completedCell = cells.nth(2);
    await expect(completedCell).toBeVisible();
    const completedText = await completedCell.textContent();
    expect(completedText).toMatch(/^\d+$/);
    
    // 残数が表示されている（第4列）- 数値形式を検証
    const remainingCell = cells.nth(3);
    await expect(remainingCell).toBeVisible();
    const remainingText = await remainingCell.textContent();
    expect(remainingText).toMatch(/^\d+$/);
    
    // チーム数が表示されている（第5列）- 数値形式を検証
    const teamCountCell = cells.nth(4);
    await expect(teamCountCell).toBeVisible();
    const teamCountText = await teamCountCell.textContent();
    expect(teamCountText).toMatch(/^\d+$/);
    
    // 遅延リスク判定値（%）が表示されている（第6列）
    const riskCell = cells.nth(5);
    await expect(riskCell).toBeVisible();
    const riskText = await riskCell.textContent();
    expect(riskText).toMatch(/\d+(\.\d+)?%/);
  }
});