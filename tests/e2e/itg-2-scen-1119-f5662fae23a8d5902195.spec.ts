import { test, expect } from '@playwright/test';

test('SCEN-1119: 認証済みユーザーが配置案実行操作の権限を持たない場合、処理が中断される', async ({ page, context }) => {
  // ユーザーAでログイン
  await page.goto('/');
  await page.fill('input[type="text"]', 'userA');
  await page.fill('input[type="password"]', 'passwordA');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 最適人員配置案提案・実行画面へ遷移
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');

  // 配置案の一覧が表示されていることを確認
  const allocationList = page.locator('[data-testid="allocation-list"], table, .list');
  await expect(allocationList).toBeVisible();

  // ユーザーBのアカウントに切り替え（権限管理画面で『配置案実行』権限を削除した状態で準備済み）
  // 新しいコンテキストでユーザーBでログイン
  const context2 = await context.browser()?.newContext();
  if (!context2) throw new Error('Could not create new context');
  
  const pageB = await context2.newPage();
  await pageB.goto('/');
  await pageB.fill('input[type="text"]', 'userB');
  await pageB.fill('input[type="password"]', 'passwordB');
  await pageB.click('button:has-text("ログイン")');
  await pageB.waitForNavigation();

  // ユーザーBで最適人員配置案提案・実行画面へ遷移
  await pageB.goto('/panels/scr-1789461978707.html');
  await pageB.waitForLoadState('networkidle');

  // 画面上の特定の配置案に対して『実行』ボタンをクリック
  const executeButton = pageB.locator('button:has-text("実行")').first();
  await executeButton.click();

  // エラーメッセージが表示されることを確認
  const errorMessage = pageB.locator('text=この操作を実行する権限がありません');
  await expect(errorMessage).toBeVisible();

  // 配置案の状態が『未実行』のままであることを確認
  const allocationStatus = pageB.locator('[data-testid="allocation-status"], .status').first();
  await expect(allocationStatus).toContainText('未実行');

  await context2.close();
});