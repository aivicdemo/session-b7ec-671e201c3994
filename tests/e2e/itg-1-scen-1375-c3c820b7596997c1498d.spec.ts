import { test, expect } from '@playwright/test';

test.describe('人員配置案却下 - 権限エラー', () => {
  let testUserId: string;
  let testPassword: string;

  test.beforeAll(async () => {
    testUserId = 'testuser_no_reject_auth';
    testPassword = 'password123';
  });

  test('却下権限を持たないユーザーが却下ボタンを操作するとエラーが表示される', async ({ page }) => {
    // ステップ1: 却下権限なしロールで認証してログイン
    await page.goto('/');
    await page.waitForURL(/login/, { timeout: 5000 });
    
    await page.fill('input[type="text"]', testUserId);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("ログイン")');
    
    await page.waitForNavigation();
    await page.waitForURL(/scr-1789461798629/, { timeout: 10000 });

    // ステップ2: 人員配置最適化提案・実行画面を開き、承認待ちまたは実行中の人員配置案が表示されていることを確認
    await expect(page).toHaveURL(/scr-1789461798629/);
    
    const proposalContainer = page.locator('id=proposals-container');
    await expect(proposalContainer).toBeVisible();
    
    const proposalCards = page.locator('[data-testid="assignment-detail-table"]');
    await expect(proposalCards).toHaveCount(1, { timeout: 5000 });

    // 配置案のステータスが「承認待ち」または「実行中」であることを確認
    const proposalStatus = page.locator('id=proposal-detail-container');
    await expect(proposalStatus).toBeVisible();
    const statusText = await proposalStatus.textContent();
    const isValidStatus = statusText?.includes('承認待ち') || statusText?.includes('実行中');
    expect(isValidStatus).toBeTruthy();

    // ステップ3: 却下ボタンが表示されていることを確認
    const rejectButton = page.locator('id=reject-btn');
    await expect(rejectButton).toBeVisible();
    await expect(rejectButton).toBeEnabled();

    // ステップ4: 却下ボタンをクリック
    // API応答を監視する準備
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/') && response.request().method() === 'POST',
      { timeout: 5000 }
    ).catch(() => null);

    await rejectButton.click();

    // ステップ5: 画面の状態変化、メッセージ表示、API呼び出しを検証
    
    // エラーメッセージがダイアログまたはトースト形式で表示されることを確認
    const errorDialogOverlay = page.locator('[class*="modal-overlay"], [role="dialog"]');
    const errorToast = page.locator('[class*="toast"], [role="alert"]');
    
    const errorMessage1Dialog = errorDialogOverlay.locator('text="この操作を実行する権限がありません"');
    const errorMessage2Dialog = errorDialogOverlay.locator('text="却下権限がないため、この操作はできません"');
    const errorMessage1Toast = errorToast.locator('text="この操作を実行する権限がありません"');
    const errorMessage2Toast = errorToast.locator('text="却下権限がないため、この操作はできません"');
    
    const message1DialogVisible = await errorMessage1Dialog.isVisible({ timeout: 3000 }).catch(() => false);
    const message2DialogVisible = await errorMessage2Dialog.isVisible({ timeout: 3000 }).catch(() => false);
    const message1ToastVisible = await errorMessage1Toast.isVisible({ timeout: 3000 }).catch(() => false);
    const message2ToastVisible = await errorMessage2Toast.isVisible({ timeout: 3000 }).catch(() => false);
    
    const errorMessageDisplayed = message1DialogVisible || message2DialogVisible || message1ToastVisible || message2ToastVisible;
    expect(errorMessageDisplayed).toBeTruthy();

    // 配置案の状態が変化していないことを確認（確定前のまま）
    const statusTextAfter = await proposalStatus.textContent();
    expect(statusTextAfter).not.toContain('却下');
    expect(statusTextAfter).not.toContain('rejected');
    
    // ステータスが確定前（承認待ちまたは実行中）のままであることを確認
    const isStillValidStatus = statusTextAfter?.includes('承認待ち') || statusTextAfter?.includes('実行中');
    expect(isStillValidStatus).toBeTruthy();

    // バックエンド側への却下処理リクエストを検証
    const apiResponse = await responsePromise;
    if (apiResponse) {
      // リクエストが送信された場合、403応答であることを確認
      expect(apiResponse.status()).toBe(403);
    } else {
      // リクエストが送信されなかったことを確認
      expect(apiResponse).toBeNull();
    }

    // 却下ボタンが操作可能な状態のまま残ることを確認
    await expect(rejectButton).toBeEnabled();

    // 別の機能（ナビゲーション）へのアクセスが可能であることを確認
    const dashboardNavLink = page.locator('a:has-text("進捗・人員配置ダッシュボード")');
    await expect(dashboardNavLink).toBeVisible();
    await expect(dashboardNavLink).toBeEnabled();
  });
});