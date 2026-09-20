import { test, expect } from '@playwright/test';

test('SCEN-1098: 権限のないユーザーが却下操作を試みると、役割検証段階で失敗して処理が進まない', async ({ page }) => {
  // ステップ1: 権限のないユーザー（一般作業者ロール）でシステムにログインする
  await page.goto('/');
  
  // ログイン画面が表示されることを確認
  await expect(page.locator('.login-card')).toBeVisible();
  
  // 一般作業者ロールのテストユーザーでログイン
  await page.fill('input[name="username"]', 'worker_user');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  
  // ログイン後の遷移を待機
  await page.waitForNavigation();
  
  // ステップ2: 生産性ダッシュボード・分析画面から最適人員配置案提案・実行画面に遷移する
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');
  
  // ステップ3: 配置案一覧から任意の配置案を選択し、詳細画面を開く
  const placementCaseItem = page.locator('[data-testid="placement-case-item"]').first();
  await expect(placementCaseItem).toBeVisible();
  
  const placementCaseState = await placementCaseItem.locator('[data-testid="case-state"]').textContent();
  
  await placementCaseItem.click();
  await page.waitForLoadState('networkidle');
  
  // 配置案詳細画面が表示されることを確認
  await expect(page.locator('[data-testid="placement-case-detail"]')).toBeVisible();
  
  // ステップ4: 配置案の却下ボタンをクリックする
  const rejectButton = page.locator('button:has-text("却下")');
  await expect(rejectButton).toBeVisible();
  await rejectButton.click();
  
  // ステップ5: 役割検証エラーメッセージが画面に表示されることを確認する
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();
  
  const messageText = await errorMessage.textContent();
  const isAuthError = messageText?.includes('この操作を実行する権限がありません') || 
                     messageText?.includes('却下操作は管理者権限が必要です');
  await expect(isAuthError).toBe(true);
  
  // 配置案詳細画面が表示されたままであることを確認（遷移していないことを確認）
  await expect(page.locator('[data-testid="placement-case-detail"]')).toBeVisible();
  
  // 配置案の状態が変わっていないことを確認
  const placementCaseStateAfter = await page.locator('[data-testid="case-state"]').textContent();
  await expect(placementCaseState).toBe(placementCaseStateAfter);
});