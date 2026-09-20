import { test, expect } from '@playwright/test';

test('SCEN-889: フィルター適用後、作業者別サマリー・時系列グラフ・習熟度・比較テーブル・品質ばらつきアラートが更新表示される', async ({ page }) => {
  // ログイン画面にアクセス
  await page.goto('/');
  
  // ログイン操作
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  
  // ログイン後の自動遷移を待機
  await page.waitForNavigation();
  
  // 生産性ダッシュボード・分析画面を開く
  await page.goto('/panels/scr-1789461964046.html');
  
  // ページのローディングが完了するまで待機
  await page.waitForLoadState('networkidle');

  // 画面左上のフィルターパネルで、作業者を「作業者A」に絞り込む
  await test.step('作業者フィルターを「作業者A」に設定', async () => {
    const workerFilter = page.locator('[data-testid="worker-filter"]');
    await workerFilter.click();
    await page.locator('[data-testid="worker-option-A"]').click();
  });

  // 日付範囲フィルターを「2024年1月1日～1月31日」に設定する
  await test.step('日付範囲フィルターを「2024年1月1日～1月31日」に設定', async () => {
    const dateFilter = page.locator('[data-testid="date-range-filter"]');
    await dateFilter.click();
    await page.locator('[data-testid="date-start-input"]').fill('2024-01-01');
    await page.locator('[data-testid="date-end-input"]').fill('2024-01-31');
  });

  // 作業タイプフィルターを「ピッキング」に設定する
  await test.step('作業タイプフィルターを「ピッキング」に設定', async () => {
    const taskTypeFilter = page.locator('[data-testid="task-type-filter"]');
    await taskTypeFilter.click();
    await page.locator('[data-testid="task-type-picking"]').click();
  });

  // 「フィルター適用」ボタンをクリックする
  await test.step('フィルター適用ボタンをクリック', async () => {
    const applyButton = page.locator('button:has-text("フィルター適用")');
    await applyButton.click();
  });

  // 画面がローディング状態から完了状態に遷移するまで待機する
  await page.waitForSelector('[data-testid="loading-indicator"]', { state: 'hidden' });
  await page.waitForLoadState('networkidle');

  // (1) 作業者別サマリー領域に「作業者A」の1月ピッキング作業のデータが表示される
  await test.step('作業者別サマリーが更新表示されることを確認', async () => {
    const summarySection = page.locator('[data-testid="worker-summary"]');
    await expect(summarySection).toBeVisible();
    
    const workerName = summarySection.locator('[data-testid="worker-name"]');
    await expect(workerName).toContainText('作業者A');
    
    const completionCount = summarySection.locator('[data-testid="completion-count"]');
    await expect(completionCount).toBeVisible();
    
    const avgProcessTime = summarySection.locator('[data-testid="avg-process-time"]');
    await expect(avgProcessTime).toBeVisible();
  });

  // (2) 時系列グラフ領域に「2024年1月1日～31日」のピッキング作業の日次推移が折れ線グラフで表示される
  await test.step('時系列グラフが更新表示されることを確認', async () => {
    const timeSeriesGraph = page.locator('[data-testid="time-series-graph"]');
    await expect(timeSeriesGraph).toBeVisible();
    
    const lineChart = timeSeriesGraph.locator('svg');
    await expect(lineChart).toBeVisible();
    
    const xAxisLabel = timeSeriesGraph.locator('[data-testid="x-axis-label"]');
    await expect(xAxisLabel).toContainText('2024年1月1日');
  });

  // (3) 習熟度領域に「作業者A」のピッキング作業における習熟度スコアが表示される
  await test.step('習熟度領域が更新表示されることを確認', async () => {
    const proficiencySection = page.locator('[data-testid="proficiency-section"]');
    await expect(proficiencySection).toBeVisible();
    
    const proficiencyScore = proficiencySection.locator('[data-testid="proficiency-score"]');
    await expect(proficiencyScore).toBeVisible();
    
    const scoreText = await proficiencyScore.textContent();
    expect(scoreText).toMatch(/\d+\/100/);
  });

  // (4) 比較テーブル領域に「作業者A」とその他作業者の1月ピッキング作業の主要指標が比較表示される
  await test.step('比較テーブルが更新表示されることを確認', async () => {
    const comparisonTable = page.locator('[data-testid="comparison-table"]');
    await expect(comparisonTable).toBeVisible();
    
    const tableRows = comparisonTable.locator('tbody tr');
    await expect(tableRows.first()).toContainText('作業者A');
    
    const metricCells = comparisonTable.locator('tbody td');
    await expect(metricCells).not.toHaveCount(0);
  });

  // (5) 品質ばらつきアラート領域に「作業者A」の1月ピッキング作業における品質ばらつき判定結果が表示される
  await test.step('品質ばらつきアラートが更新表示されることを確認', async () => {
    const qualityAlertSection = page.locator('[data-testid="quality-alert-section"]');
    await expect(qualityAlertSection).toBeVisible();
    
    const alertStatus = qualityAlertSection.locator('[data-testid="alert-status"]');
    await expect(alertStatus).toBeVisible();
    
    const statusText = await alertStatus.textContent();
    expect(statusText).toMatch(/正常|注意|警告/);
  });
});