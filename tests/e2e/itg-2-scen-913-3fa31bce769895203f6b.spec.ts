import { test, expect } from '@playwright/test';

test('SCEN-913: 権限のあるユーザーが配置案却下操作を実行するとき、セッションが有効であれば認証が成功し、次の権限検証へ進む', async ({ page }) => {
  // テスト対象ユーザーでシステムにログインし、セッションを確立する
  await page.goto('/');
  
  // ログイン画面への遷移を待つ
  await page.waitForURL(/.*login.*|.*auth.*/i, { timeout: 5000 }).catch(() => {
    // ログイン画面が表示されない場合はすでにログイン済み
  });
  
  // ログイン画面が表示されている場合はログイン操作を実行
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="メール"], input[placeholder*="ユーザー"]').first();
  const passwordInput = page.locator('input[type="password"]');
  const loginButton = page.locator('button:has-text("ログイン"), button:has-text("Login")');
  
  const emailExists = await emailInput.isVisible().catch(() => false);
  
  if (emailExists) {
    await emailInput.fill('testuser@example.com');
    await passwordInput.fill('TestPassword123');
    await loginButton.click();
    
    // ログイン後の自動遷移を待つ
    await page.waitForNavigation({ timeout: 10000 }).catch(() => {
      // ナビゲーションがない場合もある
    });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  }
  
  // 最適人員配置案提案・実行画面に遷移する
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle', { timeout: 5000 });
  
  // 却下対象となる配置案を画面上で特定し、その配置案に対する「却下」ボタンまたはメニューオプションを操作する
  // 配置案のテーブル行またはカードを特定
  const proposalRow = page.locator('[data-testid*="proposal"], [class*="proposal"], tr[data-id], .card').first();
  
  await proposalRow.hover();
  
  // 「却下」ボタンまたはメニューを探す
  const rejectButton = page.locator(
    'button:has-text("却下"), button:has-text("Reject"), [data-action="reject"], [data-action="decline"]'
  ).first();
  
  // メニューボタンが存在する場合はメニューを開く
  const menuButton = page.locator('button[aria-label*="メニュー"], button[aria-label*="menu"], [class*="menu-button"]').first();
  
  let hasMenuButton = false;
  try {
    hasMenuButton = await menuButton.isVisible({ timeout: 1000 });
  } catch {
    hasMenuButton = false;
  }
  
  if (hasMenuButton) {
    await menuButton.click();
    const rejectMenuOption = page.locator('[role="menuitem"]:has-text("却下"), [role="menuitem"]:has-text("Reject")').first();
    await rejectMenuOption.click();
  } else {
    // 直接「却下」ボタンをクリック
    await rejectButton.click();
  }
  
  // 却下操作のトリガーに伴い、セッション有効性の検証処理がシステムバックエンドで実行される
  // 権限検証結果の次のステップが現れることを確認
  
  // 権限検証後の画面要素を確認
  // 却下理由入力欄が表示される、または権限不足メッセージが表示されないことを確認
  
  // 権限不足メッセージが表示されていないことを確認
  const errorMessage = page.locator(
    'text=/権限がありません|アクセスが拒否されました|認証に失敗|Unauthorized|Forbidden/i'
  );
  
  const errorVisible = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
  expect(errorVisible).toBe(false);
  
  // 却下理由入力欄、またはダイアログ、または次のステップの画面要素が表示されることを確認
  const reasonInput = page.locator(
    'input[placeholder*="理由"], textarea[placeholder*="理由"], [data-testid="reject-reason"], [class*="reason"]'
  ).first();
  
  const dialog = page.locator('[role="dialog"]');
  
  let hasReasonInput = false;
  let hasDialog = false;
  
  try {
    hasReasonInput = await reasonInput.isVisible({ timeout: 2000 });
  } catch {
    hasReasonInput = false;
  }
  
  try {
    hasDialog = await dialog.isVisible({ timeout: 2000 });
  } catch {
    hasDialog = false;
  }
  
  // 却下理由入力欄またはダイアログのいずれかが表示されていることを確認
  expect(hasReasonInput || hasDialog).toBe(true);
});