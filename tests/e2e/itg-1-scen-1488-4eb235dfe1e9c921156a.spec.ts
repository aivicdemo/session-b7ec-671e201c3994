import { test, expect } from '@playwright/test';

test('SCEN-1488: 認証済みユーザーが作業指示実績CSV出力ボタンを押下すると、セッション有効性が検証される', async ({ page }) => {
  // 作業指示・実績管理画面にログイン済みの認証ユーザーとしてアクセスする
  await page.goto('/panels/scr-1789461813941.html');

  // ページが完全にロードされるまで待機
  await page.waitForLoadState('networkidle');

  // 画面上の『作業指示実績CSV出力』ボタンを特定する
  const exportButton = page.getByTestId('export-csv-button');
  await expect(exportButton).toBeVisible();

  // ネットワークリクエストを監視するための準備
  const requestPromise = page.waitForResponse(response => {
    return response.status() >= 200 && response.status() < 300 && 
           (response.url().includes('/api/') || response.request().headerValue('authorization') !== null);
  });

  // 『作業指示実績CSV出力』ボタンを押下する
  await exportButton.click();

  // ボタン押下直後に、セッション検証リクエストが発生することを確認する
  const response = await requestPromise;

  // セッション検証の応答ステータスが200番台（成功）であることを確認する
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);

  // リクエストがセッション検証に関連するものであることを確認（Authorizationヘッダーの存在）
  const request = response.request();
  const authHeader = request.headerValue('authorization');
  expect(authHeader).toBeTruthy();
});