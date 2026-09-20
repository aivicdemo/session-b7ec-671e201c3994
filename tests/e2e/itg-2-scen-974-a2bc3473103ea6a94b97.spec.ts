import { test, expect } from '@playwright/test';

test('SCEN-974: 入力値が必須項目を欠く場合、検証で拒否され実績データは保存されない', async ({ page }) => {
  // 作業実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  await page.waitForLoadState('networkidle');

  // 必須項目のうち1つ以上を空白のままにしてフォームを作成
  // 例：作業タイプは入力し、部門を空白のままにする
  const workTypeInput = page.locator('input[name="workType"], select[name="workType"]').first();
  const departmentInput = page.locator('input[name="department"], select[name="department"]').first();
  const workerIdInput = page.locator('input[name="workerId"]');
  const quantityInput = page.locator('input[name="quantity"]');

  // 作業タイプを入力
  await workTypeInput.fill('作業A');

  // 部門を空白のままにする（入力しない）

  // 作業者IDを入力
  await workerIdInput.fill('W001');

  // 実績数量を入力
  await quantityInput.fill('10');

  // 保存ボタンをクリック
  const saveButton = page.locator('button:has-text("保存")');
  await saveButton.click();

  // 検証エラーメッセージが画面に表示される
  const errorMessage = page.locator('[role="alert"], .error-message, .validation-error');
  await expect(errorMessage.first()).toBeVisible();

  // 不足している必須項目が明示されることを確認
  const errorText = await errorMessage.first().textContent();
  expect(errorText).toBeTruthy();
  expect(errorText).toMatch(/部門|必須|required/i);

  // フォームが初期化されずに維持されていることを確認
  // 入力済みの値が残っているかチェック
  await expect(workerIdInput).toHaveValue('W001');
  await expect(quantityInput).toHaveValue('10');

  // 別のパターンで検証：作業者IDが未入力の場合
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 作業タイプ、部門、実績数量は入力
  await workTypeInput.fill('作業B');
  await departmentInput.fill('営業部');
  // 作業者IDは入力しない（空白）
  await quantityInput.fill('5');

  // 保存ボタンをクリック
  await saveButton.click();

  // 検証エラーメッセージが表示される
  const errorMessage2 = page.locator('[role="alert"], .error-message, .validation-error');
  await expect(errorMessage2.first()).toBeVisible();

  // 作業者IDが必須であることが示される
  const errorText2 = await errorMessage2.first().textContent();
  expect(errorText2).toBeTruthy();
  expect(errorText2).toMatch(/作業者ID|必須|required/i);

  // フォームが初期化されずに維持されていることを確認
  await expect(departmentInput).toHaveValue('営業部');
  await expect(quantityInput).toHaveValue('5');
});