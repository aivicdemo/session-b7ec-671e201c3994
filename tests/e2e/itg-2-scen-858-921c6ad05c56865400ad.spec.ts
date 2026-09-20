import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-858: 最適人員配置案表示 - 推奨追加作業者数が利用可能な予備作業者数を超える場合', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('推奨追加作業者数が利用可能な予備作業者数を超える場合、優先順位変更が代替手段として推奨される', async () => {
    // 最適人員配置案提案・実行画面を開く
    await page.goto('/panels/scr-1789461978707.html');
    await page.waitForLoadState('networkidle');

    // 推奨追加作業者数が利用可能な予備作業者数を超える状況のテストデータを含む配置案を生成・表示させる
    // 推奨追加作業者数5名、利用可能予備作業者数3名という条件を設定
    const recommendedWorkersInput = page.locator('input[data-testid="recommended-workers"]');
    const availableReserveInput = page.locator('input[data-testid="available-reserve"]');
    
    await recommendedWorkersInput.fill('5');
    await availableReserveInput.fill('3');
    
    // 配置案を生成するボタンをクリック
    const generateButton = page.locator('button:has-text("配置案を生成")');
    await generateButton.click();
    await page.waitForLoadState('networkidle');

    // 画面に表示された配置案の情報エリアを確認し、推奨追加作業者数と利用可能予備作業者数の比較結果を視認する
    const recommendedWorkerDisplay = page.locator('[data-testid="recommended-workers-display"]');
    const availableReserveDisplay = page.locator('[data-testid="available-reserve-display"]');
    
    await expect(recommendedWorkerDisplay).toContainText('5');
    await expect(availableReserveDisplay).toContainText('3');

    // 画面上に「優先順位変更が代替手段として推奨される」という旨のアラート・メッセージ・ガイダンスが表示されていることを確認する
    const alertMessage = page.locator('[data-testid="allocation-alert"]');
    await expect(alertMessage).toBeVisible();
    await expect(alertMessage).toContainText('利用可能な予備作業者では必要数を満たせないため、優先順位変更により既配置作業者の割当を見直すことで対応を推奨します');

    // 画面に優先順位変更を実行するためのアクション（ボタン・リンク・メニュー等）が表示されていることを確認する
    const priorityChangeButton = page.locator('button:has-text("優先順位変更へ移動")');
    await expect(priorityChangeButton).toBeVisible();
    await expect(priorityChangeButton).toBeEnabled();
  });
});