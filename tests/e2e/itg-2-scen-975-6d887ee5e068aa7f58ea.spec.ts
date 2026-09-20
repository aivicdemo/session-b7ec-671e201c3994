import { test, expect } from '@playwright/test';

test('SCEN-975: 入力値が形式・範囲の制約に違反する場合、検証で拒否され実績データは保存されない', async ({ page }) => {
  // 作業実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  await page.waitForLoadState('networkidle');

  // 作業者IDフィールドに「@#$%」と入力する（形式制約違反：英数字のみ許可の場合）
  const workerIdInput = page.locator('input[name="workerId"], input[placeholder*="作業者"]').first();
  await workerIdInput.fill('@#$%');

  // 作業タイプドロップダウンから「ピッキング」を選択する
  const taskTypeDropdown = page.locator('select[name="taskType"], [role="combobox"][aria-label*="作業タイプ"]').first();
  await taskTypeDropdown.click();
  await page.locator('text=ピッキング').click();

  // 実績数量フィールドに「-50」と入力する（範囲制約違反：0以上の値のみ許可の場合）
  const quantityInput = page.locator('input[name="quantity"], input[type="number"][placeholder*="実績"]').first();
  await quantityInput.fill('-50');

  // 部門ドロップダウンから「北東エリア」を選択する
  const departmentDropdown = page.locator('select[name="department"], [role="combobox"][aria-label*="部門"]').first();
  await departmentDropdown.click();
  await page.locator('text=北東エリア').click();

  // 保存ボタンをクリックする
  const saveButton = page.locator('button:has-text("保存"), button:has-text("登録")').first();
  await saveButton.click();

  // 画面上に検証エラーメッセージが表示されるまで待機する
  await page.waitForSelector('[role="alert"], .error-message, .validation-error, .alert-danger, [class*="error"]', { timeout: 5000 });

  // 検証エラーメッセージが画面上に表示されること
  const errorMessages = page.locator('[role="alert"], .error-message, .validation-error, .alert-danger, [class*="error"]');
  await expect(errorMessages).toBeTruthy();

  // 複数のエラーメッセージが表示されていることを確認
  const errorCount = await errorMessages.count();
  expect(errorCount).toBeGreaterThanOrEqual(2);

  // 作業者IDのエラーメッセージを確認
  const workerIdError = page.locator('text=/作業者ID|英数字/i');
  await expect(workerIdError).toBeVisible();

  // 実績数量のエラーメッセージを確認
  const quantityError = page.locator('text=/実績数量|0以上/i');
  await expect(quantityError).toBeVisible();

  // 画面は作業実績データ記録・入力画面に留まっていることを確認
  expect(page.url()).toContain('scr-1789461993203');

  // 入力途中のフォーム内容が保持されていることを確認
  await expect(workerIdInput).toHaveValue('@#$%');
  await expect(quantityInput).toHaveValue('-50');
});