import { test, expect } from '@playwright/test';

test('SCEN-904: 配置案詳細表示が開始されると、選択された配置案の詳細情報がビューに構築される', async ({ page }) => {
  // 最適人員配置案提案・実行画面を開く
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');

  // 生成済みの配置案一覧から1件の配置案を選択する
  const placementCaseRow = page.locator('[data-testid="placement-case-list"] tbody tr').first();
  await expect(placementCaseRow).toBeVisible();
  
  // 選択した配置案のIDを取得（詳細ボタンクリック前）
  const placementCaseId = await placementCaseRow.locator('[data-testid="placement-case-id"]').textContent();
  
  // 選択した配置案の詳細表示をトリガーする操作（詳細ボタンクリック）を実行する
  const detailButton = placementCaseRow.locator('[data-testid="detail-button"]');
  await detailButton.click();
  
  // 配置案詳細ビューが表示されるまで待機する
  const detailView = page.locator('[data-testid="placement-detail-view"]');
  await expect(detailView).toBeVisible();

  // 配置案詳細ビューが描画され、5項目がそれぞれの入力値として画面に表示されることを検証
  
  // (1) 配置案ID：選択した配置案に対応するID文字列
  const displayedPlacementCaseId = await page.locator('[data-testid="detail-placement-case-id"]').textContent();
  expect(displayedPlacementCaseId).toBe(placementCaseId);
  
  // (2) 対象作業者：割当対象の作業者名または作業者ID
  const targetWorker = page.locator('[data-testid="detail-target-worker"]');
  await expect(targetWorker).toBeVisible();
  const workerValue = await targetWorker.textContent();
  expect(workerValue).toBeTruthy();
  
  // (3) 配置部門：配置先部門名（例：ピッキング部門、梱包部門など）
  const placementDepartment = page.locator('[data-testid="detail-placement-department"]');
  await expect(placementDepartment).toBeVisible();
  const departmentValue = await placementDepartment.textContent();
  expect(departmentValue).toBeTruthy();
  
  // (4) 配置職務：割当職務名（例：ピッキング作業、検品作業など）
  const placementDuty = page.locator('[data-testid="detail-placement-duty"]');
  await expect(placementDuty).toBeVisible();
  const dutyValue = await placementDuty.textContent();
  expect(dutyValue).toBeTruthy();
  
  // (5) 生産性向上予測値：数値または百分率で表示される予測向上度（例：12.5%、+15など）
  const productivityGainForecast = page.locator('[data-testid="detail-productivity-gain-forecast"]');
  await expect(productivityGainForecast).toBeVisible();
  const forecastValue = await productivityGainForecast.textContent();
  expect(forecastValue).toBeTruthy();
});