import { test, expect } from '@playwright/test';

test.describe('SCEN-1338: 作業指示実績管理画面遷移（配置提案画面から）', () => {
  test('作業指示・実績管理画面へのアクセス権限を保有するユーザーが遷移を実行した場合、権限検証に成功して次の工程に進む', async ({ page }) => {
    // ログイン画面からテストユーザー（作業指示・実績管理画面へのアクセス権限を保有）でシステムにログインする
    await page.goto('/');
    
    // ログインフォームが表示されるまで待機
    await page.waitForSelector('.login-card');
    
    // テストユーザーでログイン
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button:has-text("ログイン")');
    
    // ログイン後のリダイレクト完了を待機
    await page.waitForURL('**/scr-1789461783315.html');
    
    // 進捗・人員配置ダッシュボード画面が表示されたことを確認する
    await expect(page).toHaveURL(/scr-1789461783315\.html/);
    await expect(page.locator('text=進捗・人員配置ダッシュボード')).toBeVisible();
    
    // 画面上から人員配置最適化提案・実行画面へ遷移する
    await page.click('a[href*="scr-1789461798629"], button:has-text("人員配置最適化提案")');
    
    // 人員配置最適化提案・実行画面が正常に表示されたことを確認する
    await page.waitForURL('**/scr-1789461798629.html');
    await expect(page).toHaveURL(/scr-1789461798629\.html/);
    await expect(page.locator('text=人員配置最適化提案')).toBeVisible();
    
    // 人員配置最適化提案・実行画面内の『作業指示・実績管理画面へ遷移』ボタン（または同等のリンク）を操作する
    const workInstructionNavLink = page.locator('a[href*="scr-1789461813941"], button:has-text("作業指示・実績管理"), nav a:has-text("作業指示・実績管理")');
    await workInstructionNavLink.first().click();
    
    // ブラウザが作業指示・実績管理画面のパスに遷移し始める
    await page.waitForURL('**/scr-1789461813941.html');
    
    // 作業指示・実績管理画面に正常に遷移し、画面に各パネルが表示されている
    await expect(page).toHaveURL(/scr-1789461813941\.html/);
    
    // 『作業指示の受領・実行状況』パネルが表示されていることを確認
    await expect(page.locator('[data-testid="work-instruction-list"]')).toBeVisible();
    
    // 『ハンディターミナル連携ログ』パネルが表示されていることを確認
    await expect(page.locator('[data-testid="tab-handy-terminal"]')).toBeVisible();
    
    // 『WMS連携ログ』パネルが表示されていることを確認
    await expect(page.locator('[data-testid="tab-wms"]')).toBeVisible();
    
    // ブラウザのURLが作業指示・実績管理画面のパスに変更されていることを確認
    await expect(page).toHaveURL(/scr-1789461813941\.html/);
    
    // 画面要素（作業指示一覧、実績記録フォーム、ログビューア）がすべて読み込まれた状態で表示される
    await expect(page.locator('[id="work-instruction-tbody"]')).toBeVisible();
    await expect(page.locator('[id="performance-form-section"]')).toBeVisible();
    await expect(page.locator('[id="handy-terminal-log-tbody"]')).toBeVisible();
  });

  test('作業指示・実績管理画面へのアクセス権限を保有していないユーザーが遷移を実行した場合、エラーメッセージが表示され遷移は成立しない', async ({ page }) => {
    // ログイン画面からテストユーザー（作業指示・実績管理画面へのアクセス権限がない）でシステムにログインする
    await page.goto('/');
    
    // ログインフォームが表示されるまで待機
    await page.waitForSelector('.login-card');
    
    // アクセス権限がないテストユーザーでログイン
    await page.fill('input[type="text"]', 'testuser_no_permission');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button:has-text("ログイン")');
    
    // ログイン後のリダイレクト完了を待機
    await page.waitForURL('**/scr-1789461783315.html');
    
    // 進捗・人員配置ダッシュボード画面が表示されたことを確認する
    await expect(page).toHaveURL(/scr-1789461783315\.html/);
    await expect(page.locator('text=進捗・人員配置ダッシュボード')).toBeVisible();
    
    // 画面上から人員配置最適化提案・実行画面へ遷移する
    await page.click('a[href*="scr-1789461798629"], button:has-text("人員配置最適化提案")');
    
    // 人員配置最適化提案・実行画面が表示される
    await page.waitForURL('**/scr-1789461798629.html');
    await expect(page).toHaveURL(/scr-1789461798629\.html/);
    
    // 人員配置最適化提案・実行画面内の『作業指示・実績管理画面へ遷移』ボタンを操作する
    const workInstructionNavLink = page.locator('a[href*="scr-1789461813941"], button:has-text("作業指示・実績管理"), nav a:has-text("作業指示・実績管理")');
    await workInstructionNavLink.first().click();
    
    // エラーメッセージが画面に表示される
    await expect(page.locator('text=アクセス権限がありません')).toBeVisible();
    
    // 遷移が成立せず、現在の画面が変わらないことを確認
    await expect(page).toHaveURL(/scr-1789461798629\.html/);
  });
});