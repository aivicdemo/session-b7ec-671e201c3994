import { test, expect } from '@playwright/test';

test('SCEN-981: エラー系：完了数量が負の値またはゼロで送信されると、入力データ検証段階で拒否される', async ({ page }) => {
  // 作業実績データ記録・入力画面にアクセス
  await page.goto('/panels/scr-1789461993203.html');
  
  // 作業者情報を入力
  await page.fill('input[name="worker"]', 'テスト作業者');
  
  // 作業タイプを入力
  await page.fill('input[name="workType"]', 'テスト作業タイプ');
  
  // 部門を入力
  await page.fill('input[name="department"]', 'テスト部門');
  
  // 完了数量フィールドに負の値を入力
  await page.fill('input[name="completedQuantity"]', '-5');
  
  // データ保存ボタンをクリック
  await page.click('button:has-text("データ保存")');
  
  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=完了数量は0より大きい値を入力してください');
  await expect(errorMessage).toBeVisible();
  
  // 画面が作業実績データ記録・入力画面に留まることを確認
  await expect(page).toHaveURL(/scr-1789461993203\.html/);
  
  // 負の値がまだ入力フィールドに残っていることを確認
  const completedQuantityInput = page.locator('input[name="completedQuantity"]');
  await expect(completedQuantityInput).toHaveValue('-5');
});