import { test, expect } from '@playwright/test';

test('SCEN-1103: セッションが有効でもユーザーに配置案確認権限がない場合は操作を拒否する', async ({ page }) => {
  // テストユーザーでシステムにログインしセッションを確立する
  await page.goto('/');
  
  // ログイン画面でのログイン処理
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpass');
  await page.click('button[type="submit"]');
  
  // ログイン後の自動遷移を待つ
  await page.waitForNavigation();
  
  // 「最適人員配置案提案・実行画面」へ遷移する
  await page.goto('/panels/scr-1789461978707.html');
  
  // 配置案確認画面内の「配置案を確認する」ボタンまたはリンクをクリックする
  const confirmButton = page.locator('button:has-text("配置案を確認する"), a:has-text("配置案を確認する")').first();
  await confirmButton.click();
  
  // 配置案確認処理は実行されず、ユーザーに対して「配置案確認権限がありません」または同等の権限エラーメッセージが画面に表示される
  const errorMessage = page.locator('text=/配置案確認権限がありません|権限がありません/');
  await expect(errorMessage).toBeVisible();
  
  // 現在のURLが変わっていないことを確認
  expect(page.url()).toContain('scr-1789461978707.html');
  
  // 配置案データを表示するための具体的な要素（テーブル、リスト、カード等）が存在しないことを確認
  const placementDataTable = page.locator('table[data-testid*="placement"], table[class*="placement"]').first();
  const placementDataList = page.locator('[data-testid*="placement-list"], [class*="placement-list"]').first();
  const placementDataCard = page.locator('[data-testid*="placement-card"], [class*="placement-card"]').first();
  
  await expect(placementDataTable).not.toBeVisible();
  await expect(placementDataList).not.toBeVisible();
  await expect(placementDataCard).not.toBeVisible();
  
  // エラーメッセージが表示されていることを再確認
  await expect(page.locator('text=/配置案確認権限がありません|権限がありません/')).toBeVisible();
});