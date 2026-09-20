import { test, expect } from '@playwright/test';

test('SCEN-871: 集約された作業実績データが空の場合、エラーメッセージが表示される', async ({ page }) => {
  // 作業実績データ記録・入力画面にアクセス
  await page.goto('/panels/scr-1789461993203.html');
  
  // ページの読み込み完了を待機
  await page.waitForLoadState('networkidle');

  // 「データ送信確認」または「実績データ集約」に相当するボタンを探して実行
  const aggregateButton = page.locator('button:has-text("実績データ集約"), button:has-text("データ送信確認"), button:has-text("集約")').first();
  
  // ボタンが表示されるまで待機
  await expect(aggregateButton).toBeVisible();
  
  // ボタンをクリック
  await aggregateButton.click();

  // 集約処理が完了するまで待機（ローディング状態が終わるまで）
  await page.waitForLoadState('networkidle');

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=実績データが存在しません。ハンディターミナルからのデータ送信を確認してください');
  
  await expect(errorMessage).toBeVisible();
});