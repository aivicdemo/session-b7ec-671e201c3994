import { test, expect } from '@playwright/test';

test.describe('SCEN-1306: 改善指示配信実行時の古いデータ警告', () => {
  test('進捗データが古い場合、警告メッセージが表示され、ユーザーが「このまま配信する」を選択した場合のみ配信が継続される', async ({ page }) => {
    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/');
    await page.waitForTimeout(1000);

    // ダッシュボード画面で進捗データが表示され、最終更新時刻が「65分前」と表示されていることを確認
    const dashboardContent = await page.locator('[class="content-area"]').first();
    await expect(dashboardContent).toBeVisible();
    
    // 最終更新時刻の表示を確認（65分前）
    const lastUpdateText = await page.locator('text=/65分前/');
    await expect(lastUpdateText).toBeVisible();

    // 人員配置最適化提案・実行画面に遷移
    await page.click('text=人員配置最適化提案');
    await page.waitForNavigation();

    // 改善指示を配信ボタンをクリック
    await page.click('[data-testid="distribute-button"]');
    await page.waitForTimeout(500);

    // 警告メッセージが表示されることを確認
    const warningMessage = await page.locator('text=/進捗データが古い可能性があります/');
    await expect(warningMessage).toBeVisible();

    // 警告メッセージに「65分前」が含まれることを確認
    const warningDetail = await page.locator('text=/最後の更新：65分前/');
    await expect(warningDetail).toBeVisible();

    // 推奨テキストが表示されることを確認
    const recommendationText = await page.locator('text=/配信を実行する前に最新のデータで更新することをお勧めします/');
    await expect(recommendationText).toBeVisible();

    // 「データを更新する」ボタンが表示されていることを確認
    const updateDataButton = await page.locator('button:has-text("データを更新する")');
    await expect(updateDataButton).toBeVisible();

    // 「このまま配信する」ボタンが表示されていることを確認
    const proceedButton = await page.locator('button:has-text("このまま配信する")');
    await expect(proceedButton).toBeVisible();

    // 「このまま配信する」ボタンをクリック
    await proceedButton.click();
    await page.waitForTimeout(500);

    // 配信処理が継続されて、警告ダイアログが閉じることを確認
    await expect(warningMessage).not.toBeVisible();
  });
});