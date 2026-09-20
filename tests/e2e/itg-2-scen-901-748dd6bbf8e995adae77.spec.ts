import { test, expect } from '@playwright/test';

test('SCEN-901: アクセス権限のないユーザーが配置案確認画面へアクセスしようとすると、権限検証で拒否される', async ({ page }) => {
  // テスト用ユーザー（権限: なし）でシステムにログインする
  await page.goto('/');
  
  // ログイン画面でユーザーを入力
  await page.fill('input[type="text"]', 'testuser_no_permission');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // ログイン完了後の遷移を待つ
  await page.waitForNavigation();
  
  // ブラウザのアドレスバーに配置案確認画面のURLを直接入力して遷移を試みる
  await page.goto('/panels/scr-1789461978707.html');
  
  // 画面遷移の実行を待つ
  await page.waitForLoadState('networkidle');
  
  // 権限エラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=このページへのアクセス権限がありません');
  await expect(errorMessage).toBeVisible();
  
  // ユーザーがアクセス可能な画面へリダイレクトされるか、またはログイン画面に戻されることを確認
  const currentUrl = page.url();
  const isRedirected = 
    currentUrl.includes('scr-1789461964046') || // 生産性ダッシュボード・分析画面
    currentUrl.includes('scr-1789461993203') ||  // 作業実績データ記録・入力画面
    currentUrl.includes('login') ||
    currentUrl.includes('auth');
  
  expect(isRedirected).toBeTruthy();
});