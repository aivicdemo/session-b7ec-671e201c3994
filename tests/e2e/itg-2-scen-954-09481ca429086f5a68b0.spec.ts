import { test, expect } from '@playwright/test';

test('SCEN-954: セッションが有効なユーザーが生産性ダッシュボードから実績データ入力画面を表示すると、認証・権限確認を通過して、作業者・部門・作業タイプのドロップダウンが入力フォームとともに表示される', async ({ page }) => {
  // ログイン画面に遷移
  await page.goto('/');
  
  // ログイン処理
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpassword');
  await page.click('button[type="submit"]');
  
  // リダイレクト後の画面読み込み完了を待機
  await page.waitForLoadState('networkidle');
  
  // 生産性ダッシュボード・分析画面に遷移
  await page.goto('/panels/scr-1789461964046.html');
  await page.waitForLoadState('networkidle');
  
  // 実績データ入力画面へ遷移するリンク・ボタンをクリック
  const dataInputLink = page.locator('a, button').filter({ hasText: /実績|データ|入力/i }).first();
  await dataInputLink.click();
  
  // 実績データ入力画面の読み込み完了を待機
  await page.waitForLoadState('networkidle');
  
  // 認証・権限確認が通過した状態でページが描画されていることを確認
  // ページが正常に読み込まれ、エラーが表示されていないことを確認
  const errorElements = page.locator('text=/エラー|権限がありません|認証に失敗/i');
  await expect(errorElements).toHaveCount(0);
  
  // 作業者選択ドロップダウンが表示されていることを確認
  const workerDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /作業者/ }).first();
  await expect(workerDropdown).toBeVisible();
  
  // 作業者ドロップダウンをクリックして登録済み作業者の一覧が表示されることを確認
  await workerDropdown.click();
  const workerOptions = page.locator('[role="option"], option');
  await expect(workerOptions).not.toHaveCount(0);
  
  // 部門選択ドロップダウンが表示されていることを確認
  const departmentDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /部門/ }).first();
  await expect(departmentDropdown).toBeVisible();
  
  // 部門ドロップダウンをクリックして登録済み部門の一覧が表示されることを確認
  await departmentDropdown.click();
  const departmentOptions = page.locator('[role="option"], option');
  await expect(departmentOptions).not.toHaveCount(0);
  
  // 作業タイプ選択ドロップダウンが表示されていることを確認
  const workTypeDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /作業タイプ|作業種/ }).first();
  await expect(workTypeDropdown).toBeVisible();
  
  // 作業タイプドロップダウンをクリックして登録済み作業タイプの一覧が表示されることを確認
  await workTypeDropdown.click();
  const workTypeOptions = page.locator('[role="option"], option');
  await expect(workTypeOptions).not.toHaveCount(0);
  
  // 入力フォーム要素が表示されていることを確認
  const inputForm = page.locator('form, [role="form"]').first();
  await expect(inputForm).toBeVisible();
  
  // ドロップダウンと入力フォームが同一画面内に配置されていることを確認
  const boundingBox = await inputForm.boundingBox();
  await expect(boundingBox).not.toBeNull();
  
  const workerBoundingBox = await workerDropdown.boundingBox();
  const departmentBoundingBox = await departmentDropdown.boundingBox();
  const workTypeBoundingBox = await workTypeDropdown.boundingBox();
  
  await expect(workerBoundingBox).not.toBeNull();
  await expect(departmentBoundingBox).not.toBeNull();
  await expect(workTypeBoundingBox).not.toBeNull();
});