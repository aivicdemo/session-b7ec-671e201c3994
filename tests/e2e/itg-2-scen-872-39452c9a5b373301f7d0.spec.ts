import { test, expect } from '@playwright/test';

test('SCEN-872: 勤務予定作業者数が0以下で設定された場合、エラーメッセージが表示される', async ({ page }) => {
  // 実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  await page.waitForLoadState('networkidle');

  // シフト情報の設定で勤務予定作業者数を0に設定する
  const shiftWorkerCountInput = page.locator('input[name="shiftWorkerCount"], input[placeholder*="勤務予定作業者数"], input[aria-label*="勤務予定作業者数"]').first();
  await shiftWorkerCountInput.fill('0');

  // 実績データの入力フォームに作業タイプ、部門、作業時間などの必須項目を入力する
  const workTypeSelect = page.locator('select[name="workType"], input[placeholder*="作業タイプ"], input[aria-label*="作業タイプ"]').first();
  await workTypeSelect.click();
  const workTypeOption = page.locator('option, [role="option"]').first();
  await workTypeOption.click();

  const departmentSelect = page.locator('select[name="department"], input[placeholder*="部門"], input[aria-label*="部門"]').first();
  await departmentSelect.click();
  const departmentOption = page.locator('option, [role="option"]').first();
  await departmentOption.click();

  const workTimeInput = page.locator('input[name="workTime"], input[placeholder*="作業時間"], input[aria-label*="作業時間"]').first();
  await workTimeInput.fill('8');

  // データ保存ボタンをクリックする
  const saveButton = page.locator('button:has-text("保存"), button:has-text("送信"), button[type="submit"]').first();
  await saveButton.click();

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=勤務予定作業者数の設定が不正です。シフト情報を確認してください');
  await expect(errorMessage).toBeVisible();

  // 実績データが保存されない状態を確認（成功メッセージがないことを確認）
  const successMessage = page.locator('text=保存しました, text=正常に登録されました').first();
  await expect(successMessage).not.toBeVisible();
});