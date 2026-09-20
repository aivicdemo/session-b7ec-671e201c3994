import { test, expect } from '@playwright/test';

test('SCEN-956: 実績データ入力画面へのアクセス権限がないユーザーが表示を試みると、権限検証に失敗して画面遷移が行われない', async ({ page }) => {
  // テストユーザーとしてシステムにログインする（アクセス権限: なし）
  await page.goto('/');
  
  // ログイン画面で認証情報を入力
  await page.fill('input[placeholder*="ユーザー"]', 'testuser_no_access');
  await page.fill('input[placeholder*="パスワード"]', 'password123');
  await page.click('button[type="submit"]');
  
  // ログイン後の遷移を待機
  await page.waitForNavigation();
  
  // 生産性ダッシュボード・分析画面に遷移したことを確認
  await expect(page).toHaveURL(/scr-1789461964046/);
  
  // 作業実績データ記録・入力画面へのリンク・ボタンを操作して遷移を試みる
  const dataInputLink = page.locator('a[href*="scr-1789461993203"], button:has-text("実績データ"), a:has-text("作業実績")').first();
  await dataInputLink.click();
  
  // システムの権限検証処理が実行されるまで待機
  await page.waitForTimeout(1000);
  
  // 権限検証に失敗し、生産性ダッシュボード・分析画面に留まっていることを確認
  await expect(page).toHaveURL(/scr-1789461964046/);
  
  // 権限不足を示す警告メッセージが画面に表示されていることを確認
  const warningMessage = page.locator('text=/この操作を実行する権限がありません|権限がありません|アクセスが拒否されました/');
  await expect(warningMessage).toBeVisible();
});