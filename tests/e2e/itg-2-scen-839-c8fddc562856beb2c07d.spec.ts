import { test, expect } from '@playwright/test';

test('SCEN-839: 認証済みユーザーがダッシュボード表示アクションの実行権限を持たない場合、画面表示が拒否される', async ({ page }) => {
  // ステップ1: テスト用ユーザーアカウント（ダッシュボード表示権限なし）で認証を完了し、ログイン状態に遷移する
  await page.goto('/');
  
  // ログイン画面でユーザー認証
  await page.fill('input[type="text"]', 'testuser_no_dashboard');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  
  // ログイン後の遷移完了を待つ
  await page.waitForNavigation();

  // ステップ2: 生産性ダッシュボード・分析画面へのアクセスを試みる（URLダイレクトアクセス）
  const response = await page.goto('/panels/scr-1789461964046.html');

  // ステップ3: アクセス試行直後の画面状態を確認する
  // HTTP 403 Forbidden エラーが返されることを確認
  expect(response?.status()).toBe(403);

  // アクセス拒否を示すメッセージが表示されていることを確認
  // （HTTP 403レスポンスまたはアクセス拒否メッセージの表示）
  const pageContent = await page.content();
  expect(pageContent).toMatch(/アクセス権限がありません|アクセス拒否|Forbidden|403/);

  // ダッシュボード画面の機能要素が表示されていないことを確認
  // エラーページが表示されており、ダッシュボード固有の要素が存在しないことを検証
  await expect(page.locator('body')).not.toContainText(/生産性|ダッシュボード|売上|グラフ/);
});