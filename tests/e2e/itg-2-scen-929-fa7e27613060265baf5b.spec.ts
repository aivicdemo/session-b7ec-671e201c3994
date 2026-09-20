import { test, expect } from '@playwright/test';

test('SCEN-929: 配置案確認完了の操作を実行するユーザーが現場リーダー未満の権限の場合、操作が拒否される', async ({ page }) => {
  // 手順1: 現場リーダー未満の権限を持つユーザー（一般作業者）でログインする
  await page.goto('/');
  
  // ログイン画面が表示されるまで待機
  await page.waitForURL(/login|auth/, { timeout: 5000 }).catch(() => {
    // ログイン画面へのリダイレクトが必要な場合
  });
  
  // ユーザー認証情報を入力（一般作業者アカウント）
  await page.fill('input[type="text"]', 'general_worker@test.com');
  await page.fill('input[type="password"]', 'password123');
  
  // ログインボタンをクリック
  await page.click('button');
  
  // ログイン後、自動遷移が完了するまで待機
  await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {
    // リダイレクト完了待機
  });

  // 手順2: 生産性ダッシュボード・分析画面から最適人員配置案提案・実行画面へ遷移する
  await page.goto('/panels/scr-1789461964046.html');
  await page.waitForLoadState('networkidle');
  
  // 最適人員配置案提案・実行画面へ遷移
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');

  // 手順3: 最適人員配置案提案・実行画面で、確認済みの配置案に対して「配置案確認完了」ボタンをクリック
  // 確認済みの配置案を特定
  const placementProposalRow = page.locator('tr, div[class*="row"], div[class*="item"]').filter({ hasText: /確認済み/ }).first();
  await placementProposalRow.scrollIntoViewIfNeeded();
  
  // クリック前の状態を取得
  const statusBeforeClick = await placementProposalRow.textContent();
  
  // 「配置案確認完了」ボタンをクリック
  const confirmButton = page.locator('button:has-text("配置案確認完了"), button:has-text("確認完了")').first();
  await confirmButton.click();

  // 手順4: システムの応答を確認する
  // 期待結果: 権限不足を示すエラーメッセージが表示される
  const errorMessage = page.locator(
    'div[class*="error"], div[class*="alert"], div[role="alert"], .error-message'
  );
  
  // エラーメッセージが表示されることを確認
  await expect(errorMessage).toBeVisible({ timeout: 5000 });
  
  // エラーメッセージの内容を確認
  const messageText = await errorMessage.textContent();
  expect(messageText).toMatch(/この操作を実行する権限がありません|権限がありません|現場リーダー以上の権限/i);
  
  // エラー表示後、画面の再描画が完全に完了するまで待機
  await page.waitForTimeout(500);
  
  // 配置案の状態が変更されていないことを確認
  const statusAfterClick = await placementProposalRow.textContent();
  
  // 状態が変更前と同じままであることを確認
  expect(statusAfterClick).toBe(statusBeforeClick);
});