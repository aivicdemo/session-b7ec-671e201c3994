import { test, expect } from '@playwright/test';

test('認証なしでアクセスした場合、最適人員配置案画面への進行が拒否される', async ({ page }) => {
  // ブラウザを開き、システムのログイン画面を表示する
  await page.goto('/');
  
  // ページロード完了を待つ
  await page.waitForLoadState('networkidle');

  // ログイン画面から認証情報を入力せずに、最適人員配置案提案・実行画面のURLに直接アクセスを試みる
  await page.goto('/panels/scr-1789461978707.html');
  
  // ページロードの完了を待つ
  await page.waitForLoadState('networkidle');

  // ブラウザが認証要求画面（ログイン画面）にリダイレクトされ、最適人員配置案提案・実行画面の内容は一切表示されない
  const currentUrl = page.url();
  expect(currentUrl).toContain('scr-1789461783315');
  
  // ユーザーはログイン認証を完了するまで進行できない状態が画面に表示される
  // ログイン画面の要素が表示されていることを確認
  const loginCard = page.locator('.login-card');
  await expect(loginCard).toBeVisible();
  
  const loginTitle = page.locator('.login-title');
  await expect(loginTitle).toBeVisible();
  
  const formInputs = page.locator('.form-input');
  await expect(formInputs).toHaveCount(2);
  
  const loginButton = page.locator('.login-button');
  await expect(loginButton).toBeVisible();
});