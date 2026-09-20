import { test, expect } from '@playwright/test';

test('SCEN-842: チーム内各作業者の初期割当情報が取得され、割当計画表示パネルにデータが反映される', async ({ page }) => {
  // 生産性ダッシュボード・分析画面にアクセス
  await page.goto('/panels/scr-1789461964046.html');
  
  // ページ読み込み完了を待つ
  await page.waitForLoadState('networkidle');

  // チーム選択ドロップダウンを探して操作
  const teamDropdown = page.locator('[data-testid="team-select"], select[name="team"], .team-dropdown');
  await teamDropdown.waitFor({ state: 'visible' });
  
  // 対象チーム「東京物流センター・ピッキングチームA」を選択
  await teamDropdown.click();
  const teamOption = page.locator('text=東京物流センター・ピッキングチームA');
  await teamOption.click();
  
  // チーム選択後のデータ取得を待つ
  await page.waitForLoadState('networkidle');

  // 割当計画表示パネルの領域を確認
  const allocationPanel = page.locator('[data-testid="allocation-panel"], .allocation-plan-panel, [class*="allocation"]');
  await allocationPanel.waitFor({ state: 'visible' });

  // 割当計画表示パネル内に作業者一覧が表示されていることを確認
  const workerList = allocationPanel.locator('tr, [data-testid="worker-row"], [class*="worker-item"]');
  const workerCount = await workerList.count();
  expect(workerCount).toBeGreaterThan(0);

  // 各作業者行に必要な項目が表示されていることを確認
  // 少なくとも最初の作業者行を検証
  const firstWorkerRow = workerList.first();
  
  // 作業者名を確認
  const workerNameElement = firstWorkerRow.locator('[data-testid="worker-name"], [class*="name"]');
  await expect(workerNameElement).toBeVisible();
  const workerName = await workerNameElement.textContent();
  expect(workerName?.trim().length).toBeGreaterThan(0);

  // 作業者IDを確認
  const workerIdElement = firstWorkerRow.locator('[data-testid="worker-id"], [class*="id"]');
  await expect(workerIdElement).toBeVisible();
  const workerId = await workerIdElement.textContent();
  expect(workerId?.trim().length).toBeGreaterThan(0);

  // 割当作業タイプを確認
  const taskTypeElement = firstWorkerRow.locator('[data-testid="task-type"], [class*="task-type"]');
  await expect(taskTypeElement).toBeVisible();
  const taskType = await taskTypeElement.textContent();
  expect(taskType?.trim().length).toBeGreaterThan(0);

  // 割当開始日時を確認
  const startDateTimeElement = firstWorkerRow.locator('[data-testid="allocation-start"], [class*="start-datetime"]');
  await expect(startDateTimeElement).toBeVisible();
  const startDateTime = await startDateTimeElement.textContent();
  expect(startDateTime?.trim().length).toBeGreaterThan(0);

  // 割当予定工数を確認
  const plannedHoursElement = firstWorkerRow.locator('[data-testid="planned-hours"], [class*="planned-hours"]');
  await expect(plannedHoursElement).toBeVisible();
  const plannedHours = await plannedHoursElement.textContent();
  expect(plannedHours?.trim().length).toBeGreaterThan(0);

  // すべての作業者行に最低限の項目が表示されていることを検証
  for (let i = 0; i < Math.min(workerCount, 5); i++) {
    const row = workerList.nth(i);
    
    // 各行に必須項目が存在することを確認
    const name = row.locator('[data-testid="worker-name"], [class*="name"]');
    const id = row.locator('[data-testid="worker-id"], [class*="id"]');
    const type = row.locator('[data-testid="task-type"], [class*="task-type"]');
    const start = row.locator('[data-testid="allocation-start"], [class*="start-datetime"]');
    const hours = row.locator('[data-testid="planned-hours"], [class*="planned-hours"]');
    
    await expect(name).toBeVisible();
    await expect(id).toBeVisible();
    await expect(type).toBeVisible();
    await expect(start).toBeVisible();
    await expect(hours).toBeVisible();
  }
});