import { test, expect } from '@playwright/test';

test.describe('SCEN-1333: 検討対象の配置案が0件の場合の警告メッセージ表示', () => {
  test('検討対象の配置案が0件の場合、警告メッセージが表示される', async ({ page }) => {
    // 進捗・人員配置ダッシュボードからの遷移経路を検証
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // ダッシュボードが表示されたことを確認
    const dashboardNav = page.locator('[class="shell-nav-item"]').filter({ hasText: '人員配置最適化提案' });
    await expect(dashboardNav).toBeVisible();

    // 人員配置最適化提案画面へナビゲート
    await dashboardNav.click();
    await page.waitForLoadState('networkidle');

    // 人員配置最適化提案・実行画面が表示されたことを確認
    const proposalsContainer = page.locator('#proposals-container');
    await expect(proposalsContainer).toBeVisible();

    // フィルタ条件を複数入力・確定
    // サイト（拠点）フィルタを設定
    const siteFilterElement = page.locator('[data-testid="site-filter"]');
    if (await siteFilterElement.isVisible()) {
      await siteFilterElement.click();
      const siteOption = page.locator('text=東京拠点').first();
      if (await siteOption.isVisible()) {
        await siteOption.click();
      }
    }

    // リスクレベルフィルタを設定
    const riskLevelFilter = page.locator('[data-testid="risk-level-filter"]');
    if (await riskLevelFilter.isVisible()) {
      await riskLevelFilter.click();
      const riskOption = page.locator('text=高').first();
      if (await riskOption.isVisible()) {
        await riskOption.click();
      }
    }

    // 進捗率フィルタを設定
    const progressRateInput = page.locator('#progress-rate-value');
    if (await progressRateInput.isVisible()) {
      await progressRateInput.fill('90');
    }

    // 人員配置案を自動生成ボタンをクリック
    const generateButton = page.getByRole('button', { name: '人員配置案を自動生成' });
    await generateButton.click();

    // AIエンジンからの応答を待機
    await page.waitForLoadState('networkidle');

    // 警告メッセージが配置案の表示領域に表示されることを確認
    const warningMessage = page.locator('text=検討対象の配置案が見つかりません。フィルタ条件を見直してください');
    await expect(warningMessage).toBeVisible();

    // メッセージが配置案の表示領域（proposal-detail-container）内に含まれることを確認
    const proposalDetailContainer = page.locator('#proposal-detail-container');
    const messageInContainer = proposalDetailContainer.locator('text=検討対象の配置案が見つかりません。フィルタ条件を見直してください');
    await expect(messageInContainer).toBeVisible();

    // ページのレイアウトが正常に保たれていることを確認
    await expect(proposalDetailContainer).toBeVisible();

    // ダッシュボードへの戻却ボタンが操作可能であることを確認
    const backButton = page.getByRole('button', { name: 'ダッシュボードに戻る' });
    await expect(backButton).toBeEnabled();

    // フィルタの再編集が可能であることを確認
    if (await progressRateInput.isVisible()) {
      await expect(progressRateInput).toBeEnabled();
    }
  });

  test('直接アクセスで配置案0件の警告メッセージが表示される', async ({ page }) => {
    // 人員配置最適化提案・実行画面に直接アクセス
    await page.goto('/panels/scr-1789461798629.html');
    await page.waitForLoadState('networkidle');

    // 画面が表示されたことを確認
    const proposalsContainer = page.locator('#proposals-container');
    await expect(proposalsContainer).toBeVisible();

    // フィルタ条件を複数入力・確定
    // サイト（拠点）フィルタを設定
    const siteFilterElement = page.locator('[data-testid="site-filter"]');
    if (await siteFilterElement.isVisible()) {
      await siteFilterElement.click();
      const siteOption = page.locator('text=大阪拠点').first();
      if (await siteOption.isVisible()) {
        await siteOption.click();
      }
    }

    // リスクレベルフィルタを設定
    const riskLevelFilter = page.locator('[data-testid="risk-level-filter"]');
    if (await riskLevelFilter.isVisible()) {
      await riskLevelFilter.click();
      const riskOption = page.locator('text=極高').first();
      if (await riskOption.isVisible()) {
        await riskOption.click();
      }
    }

    // 進捗率フィルタを設定
    const progressRateInput = page.locator('#progress-rate-value');
    if (await progressRateInput.isVisible()) {
      await progressRateInput.fill('95');
    }

    // 人員配置案を自動生成ボタンをクリック
    const generateButton = page.getByRole('button', { name: '人員配置案を自動生成' });
    await generateButton.click();

    // AIエンジンからの応答を待機
    await page.waitForLoadState('networkidle');

    // 警告メッセージが配置案の表示領域に表示されることを確認
    const warningMessage = page.locator('text=検討対象の配置案が見つかりません。フィルタ条件を見直してください');
    await expect(warningMessage).toBeVisible();

    // メッセージが配置案の表示領域（proposal-detail-container）内に含まれることを確認
    const proposalDetailContainer = page.locator('#proposal-detail-container');
    const messageInContainer = proposalDetailContainer.locator('text=検討対象の配置案が見つかりません。フィルタ条件を見直してください');
    await expect(messageInContainer).toBeVisible();

    // ページのレイアウトが正常に保たれていることを確認
    await expect(proposalDetailContainer).toBeVisible();

    // ダッシュボードへの戻却ボタンが操作可能であることを確認
    const backButton = page.getByRole('button', { name: 'ダッシュボードに戻る' });
    await expect(backButton).toBeEnabled();

    // フィルタの再編集が可能であることを確認
    if (await progressRateInput.isVisible()) {
      await expect(progressRateInput).toBeEnabled();
    }
  });
});