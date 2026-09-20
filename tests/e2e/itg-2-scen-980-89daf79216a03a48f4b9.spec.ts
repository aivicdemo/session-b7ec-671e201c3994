import { test, expect } from '@playwright/test';

test('SCEN-980: エラー系：作業日が未入力または不正な形式で送信されると、入力データ検証段階で拒否される', async ({ page }) => {
  // 作業実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  
  // 作業者情報、作業タイプ、部門を正常に入力する
  await page.fill('[name="worker"]', 'テスト作業者');
  await page.fill('[name="workType"]', '通常作業');
  await page.fill('[name="department"]', '営業部');
  
  // 作業日フィールドを空のまま（未入力）にして保存ボタンをクリックする
  // 作業日フィールドは意図的に入力しない
  const saveButton = page.locator('button:has-text("保存")');
  await saveButton.click();
  
  // 画面の入力検証メッセージを確認する
  // 作業日フィールドの直下に「作業日は必須項目です」というエラーメッセージが赤色で表示される
  const workDateErrorMessage = page.locator('[data-field="workDate"] + .error-message, [data-field="workDate"] ~ .error-message, .error-message:near([name="workDate"])');
  await expect(workDateErrorMessage).toContainText('作業日は必須項目です');
  await expect(workDateErrorMessage).toHaveCSS('color', /rgb\(220,\s*38,\s?38\)|rgb\(239,\s*68,\s?68\)|#dc2626|#ef4444|red/i);
  
  // 保存処理は実行されず、画面は作業実績データ記録・入力画面のままである
  await expect(page).toHaveURL('/panels/scr-1789461993203.html');
  
  // 保存ボタンは押下後も有効なままである
  await expect(saveButton).toBeEnabled();
});