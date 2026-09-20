import { test, expect } from '@playwright/test';

test('SCEN-860: 実績データ記録入力を開始から完了まで通して、画面操作ユーザーの認証から生産性データ保存までの全工程が順序通り実行される', async ({ page }) => {
  // ステップ1: ログイン画面にアクセスし、ユーザーID（WK001）とパスワードを入力してログイン
  await page.goto('/');
  
  // ログイン画面の表示を確認
  await expect(page.locator('input[name="userId"]')).toBeVisible();
  
  // ユーザーID入力フィールドを取得して入力
  const userIdInput = page.locator('input[name="userId"]');
  await userIdInput.fill('WK001');
  
  // パスワード入力フィールドを取得して入力
  const passwordInput = page.locator('input[name="password"]');
  await passwordInput.fill('password');
  
  // ログインボタンをクリック
  const loginButton = page.locator('button:has-text("ログイン")');
  await loginButton.click();
  
  // ステップ2: 認証成功後、作業実績データ記録・入力画面へ遷移することを確認
  await page.waitForURL(/scr-1789461993203/);
  await expect(page).toHaveURL(/scr-1789461993203/);
  
  // ステップ3: 作業タイプドロップダウンから「ピッキング」を選択
  const workTypeSelect = page.locator('select[name="workType"]');
  await workTypeSelect.selectOption('picking');
  
  // ステップ4: 部門別ドロップダウンから「東京物流センター」を選択
  const departmentSelect = page.locator('select[name="department"]');
  await departmentSelect.selectOption('tokyo_logistics');
  
  // ステップ5: 実績データ入力フィールドに入力
  // 作業数量=150件
  const quantityInput = page.locator('input[name="workQuantity"]');
  await quantityInput.fill('150');
  
  // 作業開始時刻=09:00
  const startTimeInput = page.locator('input[name="startTime"]');
  await startTimeInput.fill('09:00');
  
  // 作業終了時刻=11:30
  const endTimeInput = page.locator('input[name="endTime"]');
  await endTimeInput.fill('11:30');
  
  // 品質評価=良好
  const qualitySelect = page.locator('select[name="quality"]');
  await qualitySelect.selectOption('good');
  
  // ステップ6: 「データ保存」ボタンをクリック
  const saveButton = page.locator('button:has-text("データ保存")');
  await saveButton.click();
  
  // ステップ7: ローカルデータベースへのデータ保存が完了し、「実績データを保存しました」メッセージが表示されることを確認
  const saveSuccessMessage = page.locator('text=実績データを保存しました');
  await expect(saveSuccessMessage).toBeVisible();
  
  // ステップ8: 「WES・WMSとのデータ同期が完了しました」確認メッセージが表示されることを確認
  const syncCompleteMessage = page.locator('text=WES・WMSとのデータ同期が完了しました');
  await expect(syncCompleteMessage).toBeVisible();
  
  // ステップ9: 生産性ダッシュボード・分析画面に遷移し、入力したデータが反映されていることを確認
  // データ同期完了後、自動遷移または遷移ボタンの出現を待機
  const dashboardLink = page.locator('a[href*="scr-1789461964046"], button:has-text("ダッシュボードへ"), button:has-text("生産性ダッシュボード")').first();
  if (await dashboardLink.isVisible()) {
    await dashboardLink.click();
  }
  
  await page.waitForURL(/scr-1789461964046/);
  await expect(page).toHaveURL(/scr-1789461964046/);
  
  // 実績サマリーにピッキング150件が表示されることを確認
  const pickingData = page.locator('text=ピッキング').and(page.locator('text=150'));
  await expect(pickingData).toBeVisible();
  
  // 東京物流センターが表示されることを確認
  const tokyoCenter = page.locator('text=東京物流センター');
  await expect(tokyoCenter).toBeVisible();
});