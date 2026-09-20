import { test, expect } from '@playwright/test';

test('SCEN-874: タイムスタンプが未来の日時の場合、エラーメッセージが表示される', async ({ page }) => {
  // 作業実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  
  // ページが読み込まれるのを待つ
  await page.waitForLoadState('networkidle');
  
  // 未来の日時を計算（現在時刻より5時間30分後を例とする）
  const now = new Date();
  const futureTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  
  // タイムスタンプフィールドを探して値を入力
  const timestampInput = page.locator('input[name="timestamp"], input[type="datetime-local"], input[placeholder*="タイムスタンプ"]').first();
  
  // 日時をフォーマット（ISO形式またはアプリに合わせた形式）
  const year = futureTime.getFullYear();
  const month = String(futureTime.getMonth() + 1).padStart(2, '0');
  const day = String(futureTime.getDate()).padStart(2, '0');
  const hours = String(futureTime.getHours()).padStart(2, '0');
  const minutes = String(futureTime.getMinutes()).padStart(2, '0');
  const seconds = String(futureTime.getSeconds()).padStart(2, '0');
  
  const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  
  // タイムスタンプフィールドに未来の日時を入力
  await timestampInput.fill(formattedDateTime);
  
  // データ送信ボタンをクリック
  const submitButton = page.locator('button:has-text("送信"), button:has-text("保存"), button:has-text("確定"), button[type="submit"]').first();
  await submitButton.click();
  
  // エラーメッセージが表示されるのを待つ
  await page.waitForTimeout(1000);
  
  // 期待するエラーメッセージが表示されていることを確認
  const errorMessage = page.locator('text=タイムスタンプが不正です。ハンディターミナルの日時設定を確認してください');
  await expect(errorMessage).toBeVisible();
  
  // 入力フォームが依然として表示されていることを確認
  const form = page.locator('form, [role="form"]').first();
  await expect(form).toBeVisible();
  
  // タイムスタンプ入力フィールドに値がまだ存在することを確認（保存されていない状態）
  await expect(timestampInput).toHaveValue(formattedDateTime);
});