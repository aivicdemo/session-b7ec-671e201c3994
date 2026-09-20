import { test, expect } from '@playwright/test';

test('SCEN-848: 最適人員配置案表示権限がないユーザーは進行が拒否される', async ({ page }) => {
  // テスト用ユーザー（最適人員配置案表示権限なし、他の権限あり）でシステムにログイン
  await page.goto('/');
  
  // ログイン画面が表示されるのを待つ
  await page.waitForSelector('.login-form');
  
  // ユーザー情報を入力してログイン
  // テスト用ユーザーの認証情報を使用
  await page.fill('input[type="text"]', 'testuser_no_optimal_placement');
  await page.fill('input[type="password"]', 'testpassword');
  await page.click('button[type="submit"]');
  
  // ログイン後の自動遷移が完了するまで待機
  await page.waitForNavigation();
  
  // 生産性ダッシュボード・分析画面へ遷移
  await page.goto('/panels/scr-1789461964046.html');
  await page.waitForLoadState('networkidle');
  
  // 生産性ダッシュボード・分析画面が表示されていることを確認
  const dashboardPageTitle = await page.title();
  expect(dashboardPageTitle).toContain('作業管理システム');
  
  // 最適人員配置案提案・実行画面へのナビゲーション要素を探す
  // リンク、ボタン、またはナビゲーション要素を選択
  const navigationElement = await page.locator('a, button').filter({ hasText: /最適人員配置|配置案|配置/ }).first();
  
  // ナビゲーション要素が存在することを確認
  await expect(navigationElement).toBeVisible();
  
  // ナビゲーション要素をクリックして最適人員配置案提案・実行画面へアクセスを試みる
  await navigationElement.click();
  
  // アクセス拒否のエラーメッセージが表示されることを確認
  await expect(page.locator('text=/アクセス権限がありません|この機能を利用するための権限がありません/')).toBeVisible();
  
  // 生産性ダッシュボード・分析画面に留まっていることを確認
  // ページが /scr-1789461964046.html に留まっているか、またはダッシュボード画面の要素が表示されているかを検証
  const currentPageTitle = await page.title();
  expect(currentPageTitle).toContain('作業管理システム');
  
  // 最適人員配置案提案・実行画面には遷移していないことを確認
  const pageUrl = page.url();
  expect(pageUrl).not.toContain('scr-1789461978707');
});