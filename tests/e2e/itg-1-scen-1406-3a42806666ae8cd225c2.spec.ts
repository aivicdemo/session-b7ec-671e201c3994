import { test, expect } from '@playwright/test';

test.describe('承認モーダル確定 - SCEN-1406', () => {
  test('承認操作の権限がないユーザーの場合、操作が拒否される', async ({ page }) => {
    // テストユーザー（権限なし）でシステムにログインする
    await page.goto('/');
    
    // ログイン画面で認証情報を入力（権限なしユーザー）
    await page.fill('input[type="text"]', 'testuser_nopermission');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button:has-text("ログイン")');
    
    // ログイン後の自動遷移を待つ
    await page.waitForURL('**/panels/scr-1789461783315.html', { timeout: 10000 });
    
    // 進捗・人員配置ダッシュボード画面が開かれていることを確認
    const dashboardHeader = page.locator('button:has-text("進捗・人員配置ダッシュボード")');
    await expect(dashboardHeader).toBeVisible();
    
    // 人員配置最適化提案・実行画面に遷移する
    const optimizationNavLink = page.locator('button:has-text("人員配置最適化提案")');
    await optimizationNavLink.click();
    
    // 人員配置最適化提案・実行画面へのナビゲーション完了を待つ
    await page.waitForURL('**/panels/scr-1789461798629.html', { timeout: 10000 });
    
    // 人員配置案が表示されている状態を確認
    const proposalContainer = page.locator('id=proposals-container');
    await expect(proposalContainer).toBeVisible();
    
    // 人員配置案の承認ボタンをクリック
    const approveButton = page.locator('data-testid=approve-button');
    await expect(approveButton).toBeVisible();
    await approveButton.click();
    
    // 承認モーダルが表示されたことを確認
    const approveModal = page.locator('id=approve-modal-overlay');
    await expect(approveModal).toBeVisible();
    
    // 承認モーダルの確定ボタンをクリック
    const approveModalConfirm = page.locator('data-testid=approve-modal-confirm');
    await expect(approveModalConfirm).toBeVisible();
    await approveModalConfirm.click();
    
    // 権限エラーメッセージが表示されることを確認
    const errorBanner = page.locator('id=error-banner');
    await expect(errorBanner).toBeVisible();
    
    const errorMessage = page.locator('id=error-message');
    await expect(errorMessage).toContainText(/この操作を実行する権限がありません|承認権限がないため操作できません/);
    
    // 承認モーダルがまだ表示されたままであることを確認
    await expect(approveModal).toBeVisible();
    
    // 確定ボタンが無効化されているか、またはクリック後も権限エラーが表示されたまま
    const approveModalContent = page.locator('id=approve-modal-content');
    await expect(approveModalContent).toBeVisible();
  });
});