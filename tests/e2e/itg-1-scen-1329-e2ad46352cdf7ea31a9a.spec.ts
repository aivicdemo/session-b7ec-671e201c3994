import { test, expect } from '@playwright/test';

test.describe('人員配置最適化提案画面表示', () => {
  test('配置案一覧の下部に集計値（分析対象拠点数・高リスク拠点数・推奨配置案数）が表示される', async ({ page }) => {
    // テストユーザーでシステムにログインする
    await page.goto('/');
    await page.waitForURL(/.*login|.*scr-.*/);
    
    // ログイン画面が表示されている場合はログイン
    const loginForm = await page.locator('form').first().isVisible().catch(() => false);
    if (loginForm) {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button:has-text("ログイン")');
      await page.waitForURL(/.*scr-1789461783315/);
    }

    // 進捗・人員配置ダッシュボードから「人員配置最適化提案・実行画面」へ遷移する
    await page.click('a[href*="scr-1789461798629"]');
    await page.waitForURL(/.*scr-1789461798629/);

    // 人員配置最適化提案・実行画面が読み込まれたことを確認
    await page.waitForSelector('[id="proposals-container"]', { state: 'visible' });

    // 配置案一覧に複数の配置案が表示されていることを確認
    const proposalElements = await page.locator('[id="proposals-container"] > div').count();
    expect(proposalElements).toBeGreaterThanOrEqual(1);

    // 配置案一覧の下部までスクロール
    await page.locator('[id="proposals-container"]').scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const container = document.getElementById('proposals-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });

    // 集計値表示エリアが表示されることを確認
    // 各集計値ラベルが視認可能に表示されていることを確認
    const analyzedSitesLabel = page.locator('text=分析対象拠点数');
    await expect(analyzedSitesLabel).toBeVisible();

    const highRiskLabel = page.locator('text=高リスク拠点数');
    await expect(highRiskLabel).toBeVisible();

    const recommendedPlansLabel = page.locator('text=推奨配置案数');
    await expect(recommendedPlansLabel).toBeVisible();

    // 分析対象拠点数：3 がラベルとともに視認可能に表示されていることを確認
    const analyzedSitesContainer = analyzedSitesLabel.locator('..');
    const analyzedSitesText = await analyzedSitesContainer.textContent();
    expect(analyzedSitesText).toContain('分析対象拠点数');
    expect(analyzedSitesText).toContain('3');

    // 高リスク拠点数：1 がラベルとともに視認可能に表示されていることを確認
    const highRiskContainer = highRiskLabel.locator('..');
    const highRiskText = await highRiskContainer.textContent();
    expect(highRiskText).toContain('高リスク拠点数');
    expect(highRiskText).toContain('1');

    // 推奨配置案数：3 がラベルとともに視認可能に表示されていることを確認
    const recommendedPlansContainer = recommendedPlansLabel.locator('..');
    const recommendedPlansText = await recommendedPlansContainer.textContent();
    expect(recommendedPlansText).toContain('推奨配置案数');
    expect(recommendedPlansText).toContain('3');

    // 集計値表示エリアが配置案一覧の下部に位置していることを確認
    const analyzedSitesBoundingBox = await analyzedSitesLabel.boundingBox();
    const containerBoundingBox = await page.locator('[id="proposals-container"]').boundingBox();
    
    if (analyzedSitesBoundingBox && containerBoundingBox) {
      expect(analyzedSitesBoundingBox.y).toBeGreaterThanOrEqual(containerBoundingBox.y);
    }
  });
});