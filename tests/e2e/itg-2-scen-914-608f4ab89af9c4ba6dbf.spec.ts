import { test, expect } from '@playwright/test';

test('SCEN-914: 物流センター長が配置案却下操作を実行するとき、役割に基づく権限検証が成功し、次の入力値検証へ進む', async ({ page }) => {
  // 物流センター長のアカウントでシステムにログインする
  await page.goto('/');
  
  // ログインフォームの入力
  await page.fill('input[type="text"]', 'logistics_manager');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // ログイン後のリダイレクト完了を待つ
  await page.waitForLoadState('networkidle');

  // 生産性ダッシュボード・分析画面から最適人員配置案提案・実行画面へ遷移する
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');

  // 却下対象の配置案を特定し、その配置案の詳細表示エリアにある「却下」ボタンを確認する
  const rejectButton = page.locator('button:has-text("却下")').first();
  await expect(rejectButton).toBeVisible();

  // 「却下」ボタンをクリックする
  await rejectButton.click();

  // 権限検証が完了し、配置案却下操作に必要な入力フォーム（却下理由入力欄、確認ボタンなど）が画面に表示される
  // 却下理由の入力欄が表示されることを確認
  const reasonInput = page.locator('input[placeholder*="却下理由"], textarea[placeholder*="却下理由"]').first();
  await expect(reasonInput).toBeVisible();

  // 確認ボタンが表示されることを確認
  const confirmButton = page.locator('button:has-text("確認"), button:has-text("送信"), button:has-text("実行")').first();
  await expect(confirmButton).toBeVisible();

  // 権限不足のエラーメッセージが表示されていないことを確認
  const errorMessage = page.locator('text="権限がありません", text="アクセスが拒否されました", text="権限不足"');
  await expect(errorMessage).not.toBeVisible();
});