import { test, expect } from '@playwright/test';

test('WMS連携ログ表示タブを開くと、指定した期間・拠点・連携種別の条件でログレコードが検索され、ダッシュボード統計が表示される', async ({ page }) => {
  // 進捗・人員配置ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');

  // 作業指示・実績管理画面へ遷移（WMS連携ログタブは作業指示・実績管理画面に存在）
  const workInstructionNav = page.locator('a:has-text("作業指示・実績管理")').first();
  await workInstructionNav.click();
  await page.waitForLoadState('networkidle');

  // WMS連携ログ表示タブが存在することを確認し、タブをクリック
  const wmsTab = page.getByTestId('tab-wms');
  await expect(wmsTab).toBeVisible();
  await wmsTab.click();

  // WMS連携ログ表示タブが切り替わり、ログ検索フォームが表示されることを確認
  const wmsTabContent = page.locator('#tab-wms-content');
  await expect(wmsTabContent).toBeVisible();
  const searchForm = wmsTabContent.locator('form, [class*="search"], [class*="form"]').first();
  await expect(searchForm).toBeVisible();
  
  // ログ検索フォームで期間条件（開始日：2024-01-01、終了日：2024-01-31）を入力
  const dateInputs = wmsTabContent.locator('input[type="date"]');
  const startDateInput = dateInputs.first();
  const endDateInput = dateInputs.nth(1);
  
  await startDateInput.fill('2024-01-01');
  await endDateInput.fill('2024-01-31');

  // 拠点条件をドロップダウンから「東京拠点」を選択
  const siteSelect = wmsTabContent.locator('select').first();
  await siteSelect.selectOption({ label: '東京拠点' });

  // 連携種別条件をドロップダウンから「進捗データ取得」を選択
  const typeSelect = wmsTabContent.locator('select').nth(1);
  await typeSelect.selectOption({ label: '進捗データ取得' });

  // 「検索」ボタンをクリック
  const searchButton = page.getByRole('button', { name: '検索' });
  await searchButton.click();

  // 画面がローディング状態（スピナー・グレーアウト等）を表示する
  const loadingSpinner = page.locator('[class*="loading"], [class*="spinner"]');
  await expect(loadingSpinner).toBeVisible({ timeout: 5000 });
  
  // ローディング状態から復帰し、ログレコード一覧表が表示される
  await expect(loadingSpinner).not.toBeVisible({ timeout: 10000 });
  
  const wmsLogTable = page.locator('#wms-log-tbody');
  await expect(wmsLogTable).toBeVisible();

  // ログレコード一覧表（日時、拠点、連携種別、ステータス、件数等の列）にレコード5件が表示されることを確認
  const logRows = wmsLogTable.locator('tr');
  const rowCount = await logRows.count();
  expect(rowCount).toBe(5);

  // 表示されたレコード5件が日時昇順で並んでいることを確認
  const timestamps: string[] = [];
  for (let i = 0; i < 5; i++) {
    const row = logRows.nth(i);
    const cells = row.locator('td');
    const cellCount = await cells.count();
    expect(cellCount).toBeGreaterThanOrEqual(5);
    
    const timestamp = await cells.first().textContent();
    if (timestamp) {
      timestamps.push(timestamp.trim());
    }
  }
  
  const sortedTimestamps = [...timestamps].sort();
  expect(timestamps).toEqual(sortedTimestamps);

  // ログレコード一覧の下部にダッシュボード統計セクションが表示される
  const dashboardStats = page.locator('[id*="dashboard-stats"], [class*="dashboard-stats"], [id*="stats"]').first();
  await expect(dashboardStats).toBeVisible();

  // ダッシュボード統計に成功件数、失敗件数、平均応答時間、最終更新タイムスタンプが具体的な数値で表示される
  const statsText = await dashboardStats.textContent();
  
  // 成功5件の確認
  expect(statsText).toMatch(/成功\s*[:：]?\s*5\s*件/);
  
  // 失敗0件の確認
  expect(statsText).toMatch(/失敗\s*[:：]?\s*0\s*件/);
  
  // 平均応答時間280msの確認
  expect(statsText).toMatch(/平均応答時間\s*[:：]?\s*280\s*m?s/);
  
  // 最終更新タイムスタンプ2024-01-31 23:59:45の確認
  expect(statsText).toMatch(/2024-01-31\s+23:59:45/);
});