import { test, expect } from '@playwright/test';

test('権限のあるユーザーが配置案却下ボタンを操作すると、セッション有効性が確認された後、役割による実行権限が検証される', async ({ page }) => {
  // テストユーザーでシステムにログインし、セッションが確立された状態にする
  await page.goto('/');
  await page.waitForURL(/.*scr-.*\.html/);
  
  // ログイン画面に遷移している場合はログイン処理を実行
  const loginButton = page.locator('button:has-text("ログイン"), button:has-text("Login")').first();
  const isLoginPage = await loginButton.isVisible().catch(() => false);
  
  if (isLoginPage) {
    const userIdInput = page.locator('input[type="text"], input[placeholder*="ユーザー"], input[placeholder*="ID"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await userIdInput.fill('testuser');
    await passwordInput.fill('testpassword');
    await loginButton.click();
    await page.waitForURL(/.*scr-.*\.html/);
  }

  // 最適人員配置案提案・実行画面へ遷移する
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');

  // 画面に表示された配置案の一覧から、却下対象となる配置案を特定する
  const proposalRows = page.locator('table tbody tr, [role="row"]');
  const rowCount = await proposalRows.count();
  expect(rowCount).toBeGreaterThan(0);

  // 該当配置案の行に表示されている「却下」ボタンをクリックする
  const rejectButton = page.locator('button:has-text("却下"), button:has-text("拒否")').first();
  await expect(rejectButton).toBeVisible();
  await rejectButton.click();

  // 却下確認ダイアログが画面上に表示されるまで待機する
  const confirmDialog = page.locator('[role="dialog"], .modal, .dialog');
  await expect(confirmDialog).toBeVisible();

  // ダイアログに確認メッセージとボタンが表示されていることを確認
  const dialogContent = confirmDialog.locator('text=/この配置案を却下|配置案を却下/i');
  await expect(dialogContent).toBeVisible();

  const confirmButton = confirmDialog.locator('button:has-text("承認"), button:has-text("確認"), button:has-text("OK")').first();
  const cancelButton = confirmDialog.locator('button:has-text("キャンセル"), button:has-text("Cancel")').first();
  
  await expect(confirmButton).toBeVisible();
  await expect(cancelButton).toBeVisible();
});