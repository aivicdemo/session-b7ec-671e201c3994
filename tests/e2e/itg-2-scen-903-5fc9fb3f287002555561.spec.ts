import { test, expect } from '@playwright/test';

test('権限のないユーザーが配置案詳細表示を操作すると、権限検証で拒否される', async ({ page }) => {
  // Step 1: 権限のないユーザーアカウント（一般作業者権限）でログイン
  await page.goto('/');
  await page.fill('input[type="text"]', 'worker');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  // Step 2: 生産性ダッシュボード・分析画面から最適人員配置案提案・実行画面へ遷移
  await page.goto('/panels/scr-1789461964046.html');
  await page.click('a[href*="scr-1789461978707"]');
  await page.waitForNavigation();

  // Step 3: 最適人員配置案提案・実行画面で配置案の一覧が表示されていることを確認
  await expect(page.locator('[role="table"], .list, .items')).toBeVisible();

  // Step 4: 一覧に表示された配置案のいずれかをクリックして詳細表示を試行
  const firstItem = page.locator('[role="row"], .list-item, .item').first();
  await firstItem.click();

  // 期待結果: 詳細表示への遷移が行われず、エラーメッセージが表示される
  await expect(page.locator('text=/この操作を実行する権限がありません|権限がありません|アクセスが拒否されました/')).toBeVisible();

  // ユーザーが一覧表示画面に留まっていることを確認
  await expect(page).toHaveURL(/scr-1789461978707/);
  await expect(page.locator('[role="table"], .list, .items')).toBeVisible();
});