import { test, expect } from '@playwright/test';

test('SCEN-1453: ダッシュボード表示（実績管理画面から）- 受注数0件時のエラー処理', async ({ page }) => {
  // ログイン
  await page.goto('/');
  await page.waitForURL('**/panels/scr-1789461813941.html');
  
  // 作業指示・実績管理画面にログイン状態で表示されていることを確認
  await expect(page).toHaveURL(/.*scr-1789461813941\.html/);
  
  // ステップ1: 複数チームの進捗データが表示されている状態を確認
  const workerSummaryList = page.locator('[id="worker-summary-list"]');
  await expect(workerSummaryList).toBeVisible();
  
  // ステップ2: WMS連携データが画面に表示されていることを確認
  // チームAの受注数=10・完了数=5、チームBの受注数=0・完了数=0、チームCの受注数=8・完了数=3
  const tabWmsButton = page.locator('[data-testid="tab-wms"]');
  await tabWmsButton.click();
  
  const wmsLogList = page.locator('[id="wms-log-tbody"]');
  await expect(wmsLogList).toBeVisible();
  
  // WMSログ内のチームデータを確認
  const wmsRows = page.locator('[id="wms-log-tbody"] tr');
  let teamAFound = false;
  let teamBFound = false;
  let teamCFound = false;
  
  const rowCount = await wmsRows.count();
  for (let i = 0; i < rowCount; i++) {
    const row = wmsRows.nth(i);
    const rowText = await row.textContent();
    
    if (rowText && rowText.includes('チームA') && rowText.includes('10') && rowText.includes('5')) {
      teamAFound = true;
    }
    if (rowText && rowText.includes('チームB') && rowText.includes('0') && rowText.includes('0')) {
      teamBFound = true;
    }
    if (rowText && rowText.includes('チームC') && rowText.includes('8') && rowText.includes('3')) {
      teamCFound = true;
    }
  }
  
  expect(teamAFound).toBe(true);
  expect(teamBFound).toBe(true);
  expect(teamCFound).toBe(true);
  
  // ダッシュボード画面に遷移
  const dashboardNavLink = page.locator('[data-testid="scr-1789461783315"]');
  await dashboardNavLink.click();
  await page.waitForURL('**/panels/scr-1789461783315.html');
  
  // ダッシュボードの集約前のデータを記録
  const siteVarianceTable = page.locator('[data-testid="site-variance-table"]');
  await expect(siteVarianceTable).toBeVisible();
  
  const preAggregationText = await siteVarianceTable.textContent();
  
  // ステップ3: 「集約実行」ボタンを操作して集約処理を実行
  const optimizeButton = page.locator('[data-testid="optimize-button"]');
  await expect(optimizeButton).toBeVisible();
  
  await optimizeButton.click();
  
  // ステップ4: 集約処理が実行され、データ検証が行われる
  // 期待結果: エラーメッセージが表示される
  const errorBanner = page.locator('[id="error-banner"]');
  await expect(errorBanner).toBeVisible();
  
  const errorMessage = page.locator('[id="error-message"]');
  await expect(errorMessage).toBeVisible();
  
  // エラーメッセージの内容を確認
  const errorText = await errorMessage.textContent();
  expect(errorText).toContain('進捗データが不正です。受注数と完了数を確認してください');
  expect(errorText).toContain('チームB');
  
  // ダッシュボードの進捗表示が集約前のデータのまま保持されていることを確認
  const postErrorText = await siteVarianceTable.textContent();
  expect(postErrorText).toBe(preAggregationText);
});