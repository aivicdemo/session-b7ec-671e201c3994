import { test, expect } from '@playwright/test';

test('SCEN-945: 認証済みユーザーが配置案実行操作を実行する権限を持たない場合、処理が中断される', async ({ page }) => {
  // テストユーザーでシステムにログインする
  await page.goto('./');
  await page.waitForURL(/.*scr-.*\.html/);
  
  const loginPage = page.url();
  if (loginPage.includes('scr-1789461783315')) {
    // ログイン画面が表示されている場合
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  }

  // 最適人員配置案提案・実行画面へ遷移する
  await page.goto('./panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');

  // 画面に表示された配置案の中から1件を選択する
  const proposalItems = page.locator('[data-testid="proposal-item"], .proposal-item, tr[data-proposal-id]').first();
  await proposalItems.click();

  // 選択前の配置案ステータスを取得
  const initialStatus = await proposalItems.getAttribute('data-status') || await proposalItems.getAttribute('class');

  // 配置案実行ボタンをクリックする
  const executeButton = page.locator('button:has-text("配置案実行"), [data-testid="execute-button"]').first();
  await executeButton.click();

  // エラーメッセージ「この操作を実行する権限がありません」がダイアログまたはバナーで画面に表示される
  const errorMessage = page.locator(':has-text("この操作を実行する権限がありません")').first();
  await expect(errorMessage).toBeVisible();

  // 配置案提案・実行画面の状態が変更されていないことを確認
  const afterStatus = await proposalItems.getAttribute('data-status') || await proposalItems.getAttribute('class');
  expect(initialStatus).toBe(afterStatus);
});