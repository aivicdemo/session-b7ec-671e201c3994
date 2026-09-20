import { test, expect } from '@playwright/test';

test('SCEN-947: 入力データの形式・値域・必須項目に不備がある場合、入力エラーとして処理が中断される', async ({ page }) => {
  // 最適人員配置案提案・実行画面を開く
  await page.goto('/panels/scr-1789461978707.html');
  
  // 配置案実行機能へアクセスする
  // 配置実行ボタンが存在することを確認し、クリックして配置案実行機能にアクセス
  const accessButton = page.locator('button:has-text("配置案実行"), button:has-text("配置実行を開始"), a:has-text("配置案実行")').first();
  await expect(accessButton).toBeVisible();
  await accessButton.click();
  
  // 配置実行ボタンを再度取得（ページが更新または遷移した可能性を考慮）
  await page.waitForTimeout(500);
  const executeButton = page.locator('button:has-text("配置実行"), button:has-text("実行")').first();
  await expect(executeButton).toBeVisible();
  
  // 必須項目である『対象作業者ID』を空欄のままにして、配置実行ボタンをクリックする
  // フォームをリセット（入力フィールドが空欄の状態を確保）
  const targetWorkerIdInput = page.locator('input[name="targetWorkerId"], input[placeholder*="作業者ID"], input[data-field="targetWorkerId"]').first();
  
  if (await targetWorkerIdInput.isVisible()) {
    await targetWorkerIdInput.clear();
  }
  
  // 配置実行ボタンをクリック
  await executeButton.click();
  
  // 画面の入力エラーメッセージまたはバリデーションエラー表示を確認する
  // 必須項目エラーメッセージが表示されることを確認
  const errorMessage = page.locator(
    'text=/対象作業者IDは必須項目です|対象作業者ID.*必須|作業者ID.*入力してください/'
  );
  await expect(errorMessage).toBeVisible();
  
  // エラー表示後、入力フォームがエラー状態で強調表示されることを確認
  const errorField = page.locator('input[name="targetWorkerId"], input[placeholder*="作業者ID"], input[data-field="targetWorkerId"]').first();
  
  // エラー状態の表現（赤枠など）を確認
  // 入力フィールド自体のクラスまたはスタイルを確認
  const hasErrorClass = await errorField.evaluate((el) => {
    return el.className.includes('error') || el.className.includes('invalid') || el.className.includes('danger') || window.getComputedStyle(el).borderColor.includes('rgb(220,') || window.getComputedStyle(el).borderColor.includes('rgb(239,');
  });
  expect(hasErrorClass).toBeTruthy();
  
  // 配置実行処理が開始されずに画面が最適人員配置案提案・実行画面に留まることを確認
  await expect(page).toHaveURL(/scr-1789461978707/);
});