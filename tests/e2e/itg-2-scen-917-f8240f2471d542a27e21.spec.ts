import { test, expect } from '@playwright/test';

test('配置案却下', async ({ page }) => {
  // ログイン
  await page.goto('/');
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpass');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 最適人員配置案提案・実行画面を開く
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');

  // 却下対象の配置計画が一覧に表示されていることを確認する
  const planList = page.locator('[data-testid="plan-list"], .plan-list, table tbody tr');
  await expect(planList).not.toHaveCount(0);

  // 却下対象の配置計画の行をクリックして選択する
  const firstPlanRow = page.locator('[data-testid="plan-item"], .plan-item, table tbody tr').first();
  await expect(firstPlanRow).toBeVisible();
  await firstPlanRow.click();

  // 詳細パネルまたはモーダルで配置計画の内容が読み込まれ、表示されるまで待機する
  const detailPanel = page.locator('[data-testid="plan-detail"], .plan-detail, [role="dialog"]');
  await expect(detailPanel).toBeVisible({ timeout: 10000 });

  // 配置計画の状態情報が画面に表示されていることを確認する
  const statusInfo = page.locator('[data-testid="plan-status"], .plan-status, text=/承認待ち|実行予定|待機中/');
  await expect(statusInfo).toBeVisible();

  // 却下実行へ進むためのボタンが活性化された状態で表示されていることを確認する
  const rejectButton = page.locator('button:has-text(/却下|却下へ進む|却下実行/)');
  await expect(rejectButton).toBeVisible();
  await expect(rejectButton).toBeEnabled();
});