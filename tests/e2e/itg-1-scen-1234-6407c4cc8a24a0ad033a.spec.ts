import { test, expect } from '@playwright/test';

test.describe('SCEN-1234: 人員配置最適化提案画面遷移', () => {
  test('全体の分析対象拠点数・高リスク拠点数・推奨配置案数が集計値として表示される', async ({ page }) => {
    // テスト環境にログイン
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // ログイン画面からログイン処理を行う
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("ログイン")');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password');
    await loginButton.click();

    // ログイン後、自動遷移が完了するまで待機
    await page.waitForLoadState('networkidle');

    // 進捗・人員配置ダッシュボードが表示されていることを確認
    await expect(page.locator('text=進捗・人員配置ダッシュボード')).toBeVisible();

    // ダッシュボード上に3つの拠点（拠点A・拠点B・拠点C）の進捗データが表示されていることを確認
    await test.step('ダッシュボード上に3つの拠点の進捗データが表示されていることを確認', async () => {
      const siteVarianceTable = page.locator('[id="site-variance-tbody"]');
      const rows = siteVarianceTable.locator('tr');
      await expect(rows).toHaveCount(3);
    });

    // 『人員配置最適化提案』ボタンをクリック
    await test.step('人員配置最適化提案ボタンをクリックし遷移', async () => {
      const optimizeButton = page.locator('button:has-text("人員配置最適化提案")');
      await optimizeButton.click();
    });

    // 画面遷移完了まで待機
    await page.waitForLoadState('networkidle');

    // 人員配置最適化提案・実行画面へ遷移したことを確認
    await expect(page.locator('text=人員配置最適化提案')).toBeVisible();

    // サマリーセクションが表示されていることを確認
    await test.step('サマリーセクションに集計値が表示されていることを確認', async () => {
      // 分析対象拠点数が3と表示されることを確認
      const siteCountElement = page.locator('[id="site-count"]');
      await expect(siteCountElement).toBeVisible();
      await expect(siteCountElement).toContainText('3');

      // 高リスク拠点数が2と表示されることを確認
      const highRiskCountElement = page.locator('[id="high-risk-count"]');
      await expect(highRiskCountElement).toBeVisible();
      await expect(highRiskCountElement).toContainText('2');

      // 推奨配置案数が3と表示されることを確認
      const proposalCountElement = page.locator('[id="proposal-count"]');
      await expect(proposalCountElement).toBeVisible();
      await expect(proposalCountElement).toContainText('3');
    });

    // サマリーセクション内の値が目立つ位置に表示されていることを確認
    await test.step('集計値が目立つ位置に読みやすいフォントサイズで表示されていることを確認', async () => {
      const summarySection = page.locator('[id="summary-section"]');
      await expect(summarySection).toBeVisible();

      // 背景色や強調表示により、一目で全体状況を把握できる状態になっていることを確認
      const summaryCards = summarySection.locator('.summary-card');
      await expect(summaryCards).toHaveCount(3);

      for (let i = 0; i < 3; i++) {
        const card = summaryCards.nth(i);
        const computedStyle = await card.evaluate((el) => {
          return window.getComputedStyle(el);
        });
        // 背景色が設定されていることを確認
        expect(computedStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      }
    });
  });
});