import { test, expect } from '@playwright/test';

test('SCEN-881: 指示IDが空または存在しない場合、エラーメッセージが表示される', async ({ page }) => {
  // 作業実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');

  // 実績データ入力フォームで、指示IDフィールドを空のままにする
  const instructionIdField = page.locator('input[name="instructionId"]');
  await instructionIdField.fill('');

  // その他の必須フィールドに有効な値を入力する
  await page.locator('input[name="workerId"]').fill('WORKER001');
  await page.locator('select[name="workType"]').selectOption('type1');
  await page.locator('input[name="quantity"]').fill('10');

  // 「保存」ボタンをクリックする
  await page.locator('button:has-text("保存")').click();

  // エラーメッセージが表示されるまで待機し、確認する
  const errorMessage = page.locator('text="指示IDが見つかりません。指示の再配信をリクエストしてください"');
  await expect(errorMessage).toBeVisible();

  // フォームは送信されず、ユーザーはフォーム上にとどまることを確認
  await expect(page).toHaveURL('/panels/scr-1789461993203.html');

  // 指示IDフィールドが編集可能な状態のままであることを確認
  await expect(instructionIdField).toBeEditable();
});