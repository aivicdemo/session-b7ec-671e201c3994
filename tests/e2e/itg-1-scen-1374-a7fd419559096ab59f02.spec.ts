import { test, expect } from '@playwright/test';

test.describe('人員配置案却下', () => {
  test('セッション無効な状態で却下ボタンを操作すると認証エラーが発生し、操作が中断される', async ({ page, context }) => {
    // ステップ1: ブラウザで人員配置最適化提案・実行画面にアクセスし、正常にログインして画面を表示する
    await page.goto('/');
    
    // ログイン画面から認証を実行
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("ログイン")');
    
    // ログイン後の自動遷移を待つ
    await page.waitForURL(/\/panels\/scr-\d+\.html/);
    
    // 人員配置最適化提案・実行画面へ移動
    await page.click('a[href*="scr-1789461798629"]');
    await page.waitForURL(/\/panels\/scr-1789461798629\.html/);
    
    // ページロード完了を待つ
    await page.waitForLoadState('networkidle');

    // ステップ2: 人員配置案の行から、却下アクション対象の案を1件選択する
    const proposalsContainer = page.locator('[id="proposals-container"]');
    const proposalRows = proposalsContainer.locator('> div');
    const proposalCount = await proposalRows.count();
    
    // 複数の提案から対象を選択（最初の提案を対象として選択）
    expect(proposalCount).toBeGreaterThan(0);
    const targetProposal = proposalRows.nth(0);
    await targetProposal.click();
    await page.waitForTimeout(500);

    // 選択した案のステータスを取得（提案または実行中の状態を確認）
    const proposalDetailContainer = page.locator('[id="proposal-detail-container"]');
    const statusElement = proposalDetailContainer.locator('[id="logic-status"]');
    const initialStatus = await statusElement.textContent();
    
    // ステータスが「提案」または「実行中」であることを確認
    expect(initialStatus).toMatch(/提案|実行中/);

    // ステップ3: 却下ボタンクリック直前にセッションストレージ/クッキーを削除してセッションを無効化
    await context.clearCookies();
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.removeItem('authToken');
    });

    // ステップ4: 却下ボタンをクリックして却下操作を実行
    const rejectButton = page.locator('[data-testid="reject-button"]');
    
    // 却下ボタンクリック
    await rejectButton.click();

    // 期待結果の検証
    // 1. 認証エラーメッセージが画面に表示される（セッション無効またはトークン有効期限切れ）
    const errorBanner = page.locator('[id="error-banner"]');
    const errorMessage = page.locator('[id="error-message"]');
    
    // エラーメッセージが表示されるまで待機
    await Promise.race([
      errorBanner.waitFor({ state: 'visible', timeout: 5000 }),
      errorMessage.waitFor({ state: 'visible', timeout: 5000 })
    ]);

    // どちらかのエラー要素が表示されていることを確認
    const errorBannerVisible = await errorBanner.isVisible().catch(() => false);
    const errorMessageVisible = await errorMessage.isVisible().catch(() => false);
    
    expect(errorBannerVisible || errorMessageVisible).toBe(true);

    if (errorBannerVisible) {
      const errorText = await errorBanner.textContent();
      expect(errorText).toMatch(/セッションが無効です|認証の有効期限が切れています|ログインし直してください/i);
    } else if (errorMessageVisible) {
      const errorText = await errorMessage.textContent();
      expect(errorText).toMatch(/セッションが無効です|認証の有効期限が切れています|ログインし直してください/i);
    }

    // 2. 画面遷移が発生していない（現在のURLが変わらない）
    const currentUrl = page.url();
    expect(currentUrl).toContain('scr-1789461798629');

    // 3. 却下対象の人員配置案のステータスが変更されていない（「提案」または「実行中」のまま）
    const statusAfterError = await statusElement.textContent();
    expect(statusAfterError).toMatch(/提案|実行中/);
    expect(statusAfterError).toEqual(initialStatus);
  });
});