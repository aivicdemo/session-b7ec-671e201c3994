import { test, expect } from '@playwright/test';

test.describe('SCEN-1368: 人員配置案却下', () => {
  test('却下ボタン操作時にセッション有効性が検証され、認証済みユーザーとして次工程へ進む', async ({ page }) => {
    // テストユーザーで認証済みの状態でブラウザを開く
    await page.goto('/');
    
    // ログイン画面で認証を完了
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button:has-text("ログイン")');
    
    // ログイン後の自動遷移を待機
    await page.waitForURL(/panels\/scr-1789461783315\.html/);
    await page.waitForLoadState('networkidle');

    // 人員配置最適化提案・実行画面へ遷移
    await page.click('[data-testid="progress-rate"], a:has-text("人員配置最適化提案")');
    await page.waitForURL(/panels\/scr-1789461798629\.html/);
    await page.waitForLoadState('networkidle');

    // 却下対象の人員配置案が画面に表示されていることを確認
    const proposalContainer = page.locator('#proposals-container');
    await expect(proposalContainer).toBeVisible();
    
    const assignmentTable = page.locator('#assignment-detail-tbody');
    await expect(assignmentTable).toBeVisible();

    // 却下ボタンを操作
    const rejectButton = page.locator('#reject-btn, [data-testid="reject-button"]');
    await rejectButton.click();

    // 却下モーダルが表示されることを確認
    const rejectModal = page.locator('#reject-modal-overlay');
    await expect(rejectModal).toBeVisible();

    // 却下を確認
    const rejectConfirmButton = page.locator('[data-testid="reject-modal-confirm"]');
    await rejectConfirmButton.click();

    // 却下処理が完了し、進捗・人員配置ダッシュボードへ遷移することを確認
    await page.waitForURL(/panels\/scr-1789461783315\.html/);
    await page.waitForLoadState('networkidle');

    // ダッシュボード画面が正常に表示されていることを確認
    const contentArea = page.locator('.content-area');
    await expect(contentArea).toBeVisible();

    // ダッシュボード画面でログイン中ユーザーの認証状態が保持されていることを確認
    // ユーザー名表示が表示されている
    const userNameDisplay = page.locator('.shell-user-name');
    await expect(userNameDisplay).toBeVisible();

    // ユーザーメニューが利用可能であることを確認
    const userArea = page.locator('.shell-user-area');
    await expect(userArea).toBeVisible();

    // ナビゲーションメニューが利用可能であることを確認
    const navItems = page.locator('.shell-nav-item');
    await expect(navItems.first()).toBeVisible();

    // ページリロード後もセッションが有効であることを確認
    await page.reload();
    await page.waitForLoadState('networkidle');

    // リロード後もダッシュボードが表示されたままで、ログイン画面に遷移しないことを確認
    await expect(page).toHaveURL(/panels\/scr-1789461783315\.html/);

    // リロード後もユーザー認証情報が保持されていることを確認
    const userNameAfterReload = page.locator('.shell-user-name');
    await expect(userNameAfterReload).toBeVisible();

    // ナビゲーションメニューが利用可能であることを確認
    const navItemsAfterReload = page.locator('.shell-nav-item');
    await expect(navItemsAfterReload.first()).toBeVisible();
  });
});