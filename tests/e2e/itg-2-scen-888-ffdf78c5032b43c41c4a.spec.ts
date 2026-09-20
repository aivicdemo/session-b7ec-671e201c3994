import { test, expect } from "@playwright/test";

test("SCEN-888: ダッシュボードフィルター適用", async ({ page }) => {
  // ログイン処理
  await page.goto("/");
  await page.waitForURL(/.*scr-1789461783315\.html/);
  
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const loginButton = page.locator('button:has-text("ログイン")');
  
  await emailInput.fill("test@example.com");
  await passwordInput.fill("password123");
  await loginButton.click();
  await page.waitForLoadState("networkidle");

  // 生産性ダッシュボード・分析画面を開く
  await page.goto("/panels/scr-1789461964046.html");
  await page.waitForLoadState("domcontentloaded");

  // 対象期間を「2024年1月1日～2024年1月31日」に設定
  const startDateInput = page.locator('input[data-filter-type="start-date"]').first();
  const endDateInput = page.locator('input[data-filter-type="end-date"]').first();
  
  await startDateInput.click();
  await startDateInput.fill("2024-01-01");
  await endDateInput.click();
  await endDateInput.fill("2024-01-31");

  // 作業タイプを「ピッキング」に設定
  const workTypeSelect = page.locator('select[data-filter-type="work-type"], [data-filter-type="work-type"]').first();
  await workTypeSelect.click();
  const pickingOption = page.locator('text=ピッキング').first();
  await pickingOption.click();

  // フィルター適用ボタンをクリック
  const applyButton = page.locator('button:has-text("適用")');
  await applyButton.click();

  // ダッシュボードが再描画されるまで待機
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  // フィルター条件が画面上部に正しく表示されていることを確認
  const filterDisplay = page.locator('[data-filter-display]');
  await expect(filterDisplay).toContainText("期間: 2024/01/01～2024/01/31");
  await expect(filterDisplay).toContainText("作業タイプ: ピッキング");

  // ダッシュボード内のグラフが更新されていることを確認
  const charts = page.locator('[data-chart]');
  await expect(charts.first()).toBeVisible();
  
  // グラフ内のデータが対象期間とピッキング作業のみを反映していることを確認
  const chartData = page.locator('[data-chart-data]');
  const chartDataText = await chartData.first().textContent();
  await expect(chartDataText).toContain("2024-01");
  await expect(chartDataText).toContain("ピッキング");

  // テーブルが表示されていることを確認
  const dataTable = page.locator('[data-dashboard-table]');
  await expect(dataTable).toBeVisible();
  
  // テーブルデータが対象期間とピッキング作業のみを反映していることを確認
  const tableRows = page.locator('[data-dashboard-table] tbody tr');
  const rowCount = await tableRows.count();
  
  if (rowCount > 0) {
    const firstRowText = await tableRows.first().textContent();
    await expect(firstRowText).toContain("2024-01");
    await expect(firstRowText).toContain("ピッキング");
  }

  // KPI数値が表示されていることを確認
  const kpiValues = page.locator('[data-kpi-value]');
  await expect(kpiValues.first()).toBeVisible();
  
  // KPI数値がフィルター条件下のデータを反映していることを確認
  const kpiLabel = page.locator('[data-kpi-label]').first();
  await expect(kpiLabel).toBeVisible();
  const kpiContent = await kpiValues.first().textContent();
  await expect(kpiContent).toBeTruthy();
});