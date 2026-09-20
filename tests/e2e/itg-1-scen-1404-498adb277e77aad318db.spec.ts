import { test, expect } from '@playwright/test';

test.describe('SCEN-1404: 承認済み人員配置案と作業指示が現場リーダーに配信され、実行開始が促される', () => {
  test('承認モーダル確定', async ({ page }) => {
    // ステップ1: 進捗・人員配置ダッシュボード画面にログインし、進捗遅延リスクが検出されている拠点・チームを確認
    await page.goto('/');
    await page.waitForURL(/panels\/scr-1789461783315\.html/);
    
    // ダッシュボード画面が読み込まれたことを確認
    await expect(page).toHaveTitle(/作業管理システム/);
    await expect(page.locator('[data-testid="kpi-risk-count"]')).toBeVisible();

    // ステップ2: 人員配置最適化提案・実行画面へ遷移
    const proposalLink = page.locator('a, button').filter({ hasText: /人員配置最適化提案/ }).first();
    await proposalLink.click();
    await page.waitForURL(/panels\/scr-1789461798629\.html/);

    // 配置案が表示されていることを確認
    await expect(page.locator('[data-testid="assignment-detail-table"]')).toBeVisible();

    // ステップ3: 配置案の詳細を確認し、『承認』ボタンをクリック
    const approveButton = page.locator('[data-testid="approve-button"]');
    await expect(approveButton).toBeVisible();
    await approveButton.click();

    // ステップ4: 承認モーダルが開き、『確定』ボタンをクリック
    const approveModalOverlay = page.locator('#approve-modal-overlay');
    await expect(approveModalOverlay).toBeVisible();
    
    const confirmButton = page.locator('[data-testid="approve-modal-confirm"]');
    await expect(confirmButton).toBeVisible();
    
    // ステップ5・6: ローディング表示を確認
    await confirmButton.click();
    
    // ローディング表示が現れることを確認
    const loadingIndicator = page.locator('text=/配置案と作業指示を配信中です/');
    await expect(loadingIndicator).toBeVisible({ timeout: 5000 });

    // 配信処理が完了してローディング表示が消えることを確認
    await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });

    // ステップ7: モーダルが閉じて人員配置最適化提案・実行画面に戻ることを確認
    await expect(approveModalOverlay).not.toBeVisible();
    await expect(page.locator('[data-testid="assignment-detail-table"]')).toBeVisible();

    // ステップ8: 配置案ステータスが『配信完了』に更新されていることを確認
    const statusElement = page.locator('text=/配信完了/');
    await expect(statusElement).toBeVisible();

    // ステップ9: 配置案の詳細セクションに配信ID、配信タイムスタンプ、『現場リーダー受領確認待機中』が表示されていることを確認
    const distributionIdElement = page.locator('text=/配信ID/');
    await expect(distributionIdElement).toBeVisible();

    const timestampElement = page.locator('text=/配信タイムスタンプ/');
    await expect(timestampElement).toBeVisible();

    const waitingStatusElement = page.locator('text=/現場リーダー受領確認待機中/');
    await expect(waitingStatusElement).toBeVisible();
  });
});