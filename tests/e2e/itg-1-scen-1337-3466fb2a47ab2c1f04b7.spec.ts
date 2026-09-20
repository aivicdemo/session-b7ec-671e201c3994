import { test, expect } from '@playwright/test';

test.describe('作業指示実績管理画面遷移（配置提案画面から）', () => {
  test('配置提案画面から作業指示・実績管理画面へ遷移するユーザーのセッションが有効である場合、認証に成功して次の工程に進む', async ({ page }) => {
    // テスト環境でブラウザを起動し、システムにログイン
    await page.goto('/');
    
    // ログイン画面が表示されることを確認
    await expect(page).toHaveTitle(/作業管理システム/);
    
    // ログイン処理
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button:has-text("ログイン")');
    
    // セッション確立後、ダッシュボードへの自動遷移を待つ
    await page.waitForURL(/.*scr-1789461783315/);
    
    // 進捗・人員配置ダッシュボードが表示されたことを確認
    await expect(page.locator('text=進捗・人員配置ダッシュボード')).toBeVisible();
    
    // 人員配置最適化提案・実行画面へのナビゲーション
    await page.click('a:has-text("人員配置最適化提案")');
    
    // 人員配置最適化提案・実行画面への遷移を待つ
    await page.waitForURL(/.*scr-1789461798629/);
    
    // 配置案の表示を確認
    await expect(page.locator('text=配置案を選択して詳細を表示')).toBeVisible();
    
    // ページが完全に読み込まれるまで待つ
    await page.waitForLoadState('networkidle');
    
    // 作業指示・実績管理画面への遷移ボタンを確認して操作
    // 「作業指示・実績管理に進む」または同等のボタンを操作
    const manageButton = page.locator('a:has-text("作業指示・実績管理")');
    await expect(manageButton).toBeVisible();
    await manageButton.click();
    
    // 作業指示・実績管理画面への遷移を待つ
    await page.waitForURL(/.*scr-1789461813941/);
    
    // セッション検証が完了し、画面が正常に表示されたことを確認
    // URLが作業指示・実績管理画面のエンドポイントに変更されていることを確認
    expect(page.url()).toContain('scr-1789461813941');
    
    // 作業指示・実績管理画面のコンテンツが正常に表示されていることを確認
    await expect(page.locator('text=作業指示・実績管理')).toBeVisible();
    await expect(page.locator('[data-testid="work-instruction-list"]')).toBeVisible();
    
    // ハンディターミナル連携ログ表示領域が存在することを確認
    await expect(page.locator('[data-testid="tab-handy-terminal"]')).toBeVisible();
    
    // セッション無効化エラーが表示されていないことを確認
    await expect(page.locator('[data-testid="error-banner"]')).not.toBeVisible();
    
    // 画面が完全に読み込まれたことを確認
    await page.waitForLoadState('networkidle');
  });
});