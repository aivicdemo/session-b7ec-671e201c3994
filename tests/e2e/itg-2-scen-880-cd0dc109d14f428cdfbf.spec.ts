import { test, expect } from '@playwright/test';

test('SCEN-880: 作業者IDが空または不正な形式の場合、エラーメッセージが表示される', async ({ page }) => {
  // 作業実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  
  // 作業者IDの入力フィールドに空文字列を入力する
  const workerIdInput = page.locator('input[name="workerId"], input[placeholder*="作業者"], input[aria-label*="作業者"]').first();
  await workerIdInput.fill('');
  
  // 実績データの入力を進め、作業者IDフィールドからフォーカスを外すか、データ送信ボタンを押す
  // フォーカスを外す
  await workerIdInput.blur();
  
  // または送信ボタンを探して押す
  const submitButton = page.locator('button:has-text("送信"), button:has-text("保存"), button:has-text("登録")').first();
  if (await submitButton.isVisible()) {
    await submitButton.click();
  }
  
  // エラーメッセージの表示を確認する
  const errorMessage = page.locator('text=作業者IDが無効です。ハンディターミナルを再起動してください');
  await expect(errorMessage).toBeVisible();
  
  // データは保存されず、作業実績データ記録・入力画面が表示された状態に留まる
  await expect(page).toHaveURL(/scr-1789461993203/);
});