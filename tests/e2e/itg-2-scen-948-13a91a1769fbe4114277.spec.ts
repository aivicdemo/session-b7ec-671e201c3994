import { test, expect } from '@playwright/test';

test('SCEN-948: 配置案IDに対応する配置計画の現在の状態が取得され、実行前の妥当性確認に用いられる', async ({ page }) => {
  // 最適人員配置案提案・実行画面を開く
  await page.goto('/panels/scr-1789461978707.html');
  
  // 配置案一覧から対象の配置案IDを選択する
  // 配置案リストが表示されるまで待機
  await page.waitForSelector('[data-testid="deployment-plan-list"], [role="table"]', { timeout: 5000 });
  
  // 最初の配置案IDを取得して選択
  const firstDeploymentPlanRow = page.locator('[data-testid="deployment-plan-item"], tbody tr').first();
  await firstDeploymentPlanRow.waitFor({ state: 'visible' });
  
  // 配置案IDを取得
  const deploymentPlanId = await firstDeploymentPlanRow.locator('[data-testid="deployment-plan-id"]').textContent();
  
  // 配置案の詳細確認ボタン（実行前の状態確認ボタン）をクリック
  const detailButton = firstDeploymentPlanRow.locator('button:has-text("詳細確認"), button:has-text("状態確認"), button:has-text("確認")').first();
  await detailButton.click();
  
  // 配置案IDに対応する配置計画の現在の状態情報がモーダルまたはパネルに表示されるまで待機
  await page.waitForSelector('[role="dialog"], [data-testid="deployment-detail-modal"], [data-testid="deployment-status-panel"]', { timeout: 5000 });
  
  // モーダルまたはパネルが表示されたことを確認
  const modal = page.locator('[role="dialog"]').first();
  const panel = page.locator('[data-testid="deployment-status-panel"]').first();
  const detailPanel = page.locator('[data-testid="deployment-detail-modal"]').first();
  
  const displayElement = await Promise.race([
    modal.waitFor({ state: 'visible', timeout: 3000 }).then(() => modal),
    panel.waitFor({ state: 'visible', timeout: 3000 }).then(() => panel),
    detailPanel.waitFor({ state: 'visible', timeout: 3000 }).then(() => detailPanel)
  ]).catch(() => null);
  
  expect(displayElement).not.toBeNull();
  
  // ステータスが表示されていることを確認
  const statusValue = displayElement.locator('[data-testid="status-value"]').first();
  await expect(statusValue).toBeVisible();
  const statusText = await statusValue.textContent();
  expect(statusText).toBeTruthy();
  
  // 作成日時が表示されていることを確認（具体的な日付値を検証）
  const createdDateValue = displayElement.locator('[data-testid="created-date"]').first();
  await expect(createdDateValue).toBeVisible();
  const createdDateText = await createdDateValue.textContent();
  expect(createdDateText).toMatch(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/);
  // 実際の日付が存在することを確認
  expect(createdDateText).toBeTruthy();
  
  // 対象作業者数が表示されていることを確認（具体的な値を検証）
  const workerCountValue = displayElement.locator('[data-testid="target-worker-count"]').first();
  await expect(workerCountValue).toBeVisible();
  const workerCountText = await workerCountValue.textContent();
  expect(workerCountText).toMatch(/\d+名/);
  // 数値が存在することを確認
  const workerCountMatch = workerCountText?.match(/(\d+)名/);
  expect(workerCountMatch).not.toBeNull();
  expect(parseInt(workerCountMatch![1])).toBeGreaterThan(0);
  
  // 配置変更内容が表示されていることを確認
  const deploymentChangesValue = displayElement.locator('[data-testid="deployment-changes"]').first();
  await expect(deploymentChangesValue).toBeVisible();
  const deploymentChangesText = await deploymentChangesValue.textContent();
  expect(deploymentChangesText).toBeTruthy();
  
  // 最終更新者が表示されていることを確認
  const lastUpdatedByValue = displayElement.locator('[data-testid="last-updated-by"]').first();
  await expect(lastUpdatedByValue).toBeVisible();
  const lastUpdatedByText = await lastUpdatedByValue.textContent();
  expect(lastUpdatedByText).toBeTruthy();
  
  // 配置案IDが表示内容に反映されていることを確認（紐付けの確認）
  const displayedPlanId = await displayElement.locator('[data-testid="plan-id"]').textContent();
  expect(displayedPlanId).toBe(deploymentPlanId);
});