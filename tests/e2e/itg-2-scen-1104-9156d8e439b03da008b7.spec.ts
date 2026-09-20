import { test, expect } from '@playwright/test';

test('SCEN-1104: 配置案IDが空またはnullの場合はバリデーションエラーメッセージを表示する', async ({ page }) => {
  // 最適人員配置案提案・実行画面を開く
  await page.goto('/panels/scr-1789461978707.html');
  
  // ページが読み込まれるまで待機
  await page.waitForLoadState('networkidle');
  
  // 配置案IDフィールドが存在することを確認
  const deploymentIdField = page.locator('input[name*="deployment"][name*="id"], input[id*="deployment"][id*="id"], input[placeholder*="配置案ID"]').first();
  await expect(deploymentIdField).toBeVisible();
  
  // 配置案IDフィールドを空のままにしておく（既に空の場合はそのまま）
  await deploymentIdField.clear();
  
  // 配置案確認処理を実行するボタンをクリック
  // ボタンの候補：「確認」「承認」「実行」等の文字列を含むボタン
  const confirmButton = page.locator('button:has-text("確認"), button:has-text("承認"), button:has-text("実行"), button:has-text("確認する")').first();
  await expect(confirmButton).toBeVisible();
  await confirmButton.click();
  
  // バリデーションエラーメッセージが表示されることを確認
  const errorMessage = page.locator(
    'text=/配置案IDは必須項目です|配置案IDが入力されていません|配置案IDが必須です/'
  );
  await expect(errorMessage).toBeVisible();
  
  // 画面遷移が行われていないことを確認（URLが変わっていない）
  expect(page.url()).toContain('scr-1789461978707.html');
});