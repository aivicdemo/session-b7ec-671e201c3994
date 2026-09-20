import { test, expect } from '@playwright/test';

test('SCEN-984: エラー系：必須項目（作業者ID、作業日、完了数量、所要時間、品質スコア）のいずれかが未入力で送信されると、検証段階で拒否される', async ({ page }) => {
  // 作業実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  
  // 作業者IDフィールドを空のままにする（入力しない、またはクリアする）
  const workerIdInput = page.locator('input[name="workerId"], input[aria-label*="作業者ID"], input[id*="worker"]').first();
  await workerIdInput.clear();
  
  // その他の必須項目に有効な値を入力する
  
  // 作業日フィールドを入力
  const dateInput = page.locator('input[name="workDate"], input[aria-label*="作業日"], input[id*="date"]').first();
  await dateInput.fill('2024-01-15');
  
  // 完了数量フィールドを入力
  const quantityInput = page.locator('input[name="completedQuantity"], input[aria-label*="完了数量"], input[id*="quantity"]').first();
  await quantityInput.fill('100');
  
  // 所要時間フィールドを入力
  const timeInput = page.locator('input[name="requiredTime"], input[aria-label*="所要時間"], input[id*="time"]').first();
  await timeInput.fill('480');
  
  // 品質スコアフィールドを入力
  const qualityInput = page.locator('input[name="qualityScore"], input[aria-label*="品質スコア"], input[id*="quality"]').first();
  await qualityInput.fill('95');
  
  // 画面下部の「保存」ボタンをクリック
  const saveButton = page.locator('button:has-text("保存"), button[aria-label="保存"]').first();
  await saveButton.click();
  
  // 検証エラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=/作業者ID.*必須/');
  await expect(errorMessage).toBeVisible();
  
  // 画面が作業実績データ記録・入力画面のままであることを確認
  await expect(page).toHaveURL('/panels/scr-1789461993203.html');
});