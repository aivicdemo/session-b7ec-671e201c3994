import { test, expect } from '@playwright/test';

test.describe('SCEN-1500: 作業実績データ送信権限チェック', () => {
  test('送信ユーザーが作業実績データ送信の権限を持たないと、操作は拒否される', async ({ page }) => {
    // リクエストをインターセプトして、送信操作が発生しないことを確認
    const performanceSendRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      // 作業実績送信・連携に関するエンドポイントを監視
      if (url.includes('/api/') && (url.includes('performance') || url.includes('submit') || url.includes('sync') || url.includes('delivery'))) {
        performanceSendRequests.push(url);
      }
    });

    // ステップ1: テストユーザー（権限なし）でシステムにログイン
    await page.goto('/');
    await page.waitForURL(/.*login.*|.*scr-.*\.html/);
    
    const loginForm = page.locator('.login-form');
    if (await loginForm.isVisible()) {
      await page.fill('input[type="text"]', 'testuser_no_permission');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button:has-text("ログイン")');
      await page.waitForNavigation();
    }

    // ステップ2: 進捗・人員配置ダッシュボードから「作業指示・実績管理画面」に遷移
    await page.waitForURL('**/scr-1789461783315.html');
    await expect(page).toHaveURL(/scr-1789461783315/);
    
    const workManagementLink = page.locator('a, button').filter({ hasText: '作業指示・実績管理' });
    await workManagementLink.click();
    await page.waitForNavigation();
    await page.waitForURL('**/scr-1789461813941.html');

    // ステップ3: 作業実績データ送信ボタン/メニュー項目を特定
    await expect(page).toHaveURL(/scr-1789461813941/);
    const performanceSubmitButton = page.getByTestId('performance-submit-button');
    await expect(performanceSubmitButton).toBeVisible();

    // ステップ4・5・6: 作業実績データ送信機能を実行するアクション、権限チェック処理の実行と結果を確認
    // クリック前の送信リクエスト数を記録
    const sendRequestCountBeforeClick = performanceSendRequests.length;
    
    await performanceSubmitButton.click();
    
    // 権限チェック処理の完了を待機
    await page.waitForTimeout(500);

    // 期待結果の検証: ボタンが無効化されているか、またはエラーメッセージが表示される
    const errorBanner = page.getByTestId('error-banner');
    const errorMessage = page.getByTestId('error-message');
    const isButtonDisabled = await performanceSubmitButton.isDisabled();
    const isErrorBannerVisible = await errorBanner.isVisible().catch(() => false);
    const isErrorMessageVisible = await errorMessage.isVisible().catch(() => false);

    // 権限がないため、ボタン無効化またはエラーメッセージのいずれかが表示されていることを確認
    const hasButtonDisabledOrError = isButtonDisabled || isErrorBannerVisible || isErrorMessageVisible;
    expect(hasButtonDisabledOrError).toBeTruthy();

    // エラーメッセージが表示されている場合、その内容を確認
    if (isErrorBannerVisible) {
      await expect(errorBanner).toContainText(/権限がありません|この操作を実行する権限を持っていません/);
    } else if (isErrorMessageVisible) {
      await expect(errorMessage).toContainText(/権限がありません|この操作を実行する権限を持っていません/);
    }

    // 操作は実行されず、作業指示・実績管理画面に留まることを確認
    await expect(page).toHaveURL(/scr-1789461813941/);

    // 外部サービスの呼び出し窓口に対する送信操作が発生しないことを確認
    // クリック後の新規送信リクエストが発生していないことを検証
    const sendRequestCountAfterClick = performanceSendRequests.length;
    const newSendRequests = performanceSendRequests.slice(sendRequestCountBeforeClick);
    
    expect(newSendRequests.length).toBe(0);
  });
});