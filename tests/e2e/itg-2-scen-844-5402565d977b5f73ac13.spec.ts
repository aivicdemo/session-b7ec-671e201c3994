import { test, expect, Page } from '@playwright/test';

test.describe('生産性ダッシュボード表示', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test('生産性率・品質スコア・習熟度レベルなどの指標が計算され、偏差分析チャートと品質ばらつき検知アラートがダッシュボード画面に表示される', async () => {
    // ログイン画面へ移動
    await page.goto('/');
    await page.waitForURL(/\/panels\//);

    // ログイン処理
    const usernameInput = page.locator('input[placeholder*="ユーザー"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button:has-text("ログイン")').first();

    if (await usernameInput.isVisible()) {
      await usernameInput.fill('testuser');
      await passwordInput.fill('testpass');
      await loginButton.click();
      await page.waitForNavigation();
    }

    // 作業実績データ記録・入力画面で過去データが存在することを確認
    await page.goto('/panels/scr-1789461993203.html');
    await page.waitForLoadState('networkidle');
    
    const recordTable = page.locator('[data-testid="work-record-table"] tbody tr');
    const recordCount = await recordTable.count();
    expect(recordCount).toBeGreaterThan(0);

    // 生産性ダッシュボード・分析画面を開く
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');

    // 画面全体をスクロールして表示領域を確認
    const dashboardContent = page.locator('[data-dashboard-container]');
    if (await dashboardContent.isVisible()) {
      await dashboardContent.scrollIntoViewIfNeeded();
    }
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(300);

    // 生産性率指標の表示確認
    const productivityLabel = page.locator('text=生産性率').first();
    await expect(productivityLabel).toBeVisible();
    const productivityValue = productivityLabel.locator('.. >> [data-metric-value]');
    await expect(productivityValue).toBeVisible();
    const productivityText = await productivityValue.textContent();
    expect(productivityText).toMatch(/\d+\.?\d*%?/);

    // 品質スコア指標の表示確認
    const qualityLabel = page.locator('text=品質スコア').first();
    await expect(qualityLabel).toBeVisible();
    const qualityValue = qualityLabel.locator('.. >> [data-metric-value]');
    await expect(qualityValue).toBeVisible();
    const qualityText = await qualityValue.textContent();
    expect(qualityText).toMatch(/\d+\.?\d*/);

    // 習熟度レベル指標の表示確認
    const proficiencyLabel = page.locator('text=習熟度レベル').first();
    await expect(proficiencyLabel).toBeVisible();
    const proficiencyValue = proficiencyLabel.locator('.. >> [data-metric-value]');
    await expect(proficiencyValue).toBeVisible();
    const proficiencyText = await proficiencyValue.textContent();
    expect(proficiencyText).toMatch(/初級|中級|上級/);

    // 偏差分析チャートの表示確認
    const deviationChart = page.locator('[data-chart-name="偏差分析チャート"]');
    await expect(deviationChart).toBeVisible();
    const chartSvg = deviationChart.locator('svg');
    await expect(chartSvg).toBeVisible();

    // 品質ばらつき検知アラートの表示確認
    const qualityAlert = page.locator('[data-alert-name="品質ばらつき検知アラート"]');
    await expect(qualityAlert).toBeVisible();

    // ブラウザの開発者ツール（F12）を開く
    await page.keyboard.press('F12');
    await page.waitForTimeout(500);

    // ネットワークタブでサーバーからの指標計算結果データを確認
    const capturedResponses: any[] = [];
    const responseHandler = async (response: any) => {
      if (response.url().includes('/api/') && response.status() === 200) {
        try {
          const data = await response.json();
          if (data && (data.productivity !== undefined || data.qualityScore !== undefined || data.proficiencyLevel !== undefined)) {
            capturedResponses.push(data);
          }
        } catch (e) {
          // JSON パース失敗は無視
        }
      }
    };
    page.on('response', responseHandler);

    // ダッシュボード画面を再度読み込んでネットワーク通信を確認
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    expect(capturedResponses.length).toBeGreaterThan(0);
    const metricsResponseData = capturedResponses[0];
    expect(metricsResponseData).toHaveProperty('productivity');
    expect(metricsResponseData).toHaveProperty('qualityScore');
    expect(metricsResponseData).toHaveProperty('proficiencyLevel');

    // 再読み込み後の指標値を確認
    const reloadedProductivityValue = await page.locator('text=生産性率').first().locator('.. >> [data-metric-value]').textContent();
    const reloadedQualityValue = await page.locator('text=品質スコア').first().locator('.. >> [data-metric-value]').textContent();
    const reloadedProficiencyValue = await page.locator('text=習熟度レベル').first().locator('.. >> [data-metric-value]').textContent();

    expect(reloadedProductivityValue).toBe(productivityText);
    expect(reloadedQualityValue).toBe(qualityText);
    expect(reloadedProficiencyValue).toBe(proficiencyText);

    // 再読み込み後のチャートとアラート確認
    await expect(page.locator('[data-chart-name="偏差分析チャート"]')).toBeVisible();
    await expect(page.locator('[data-alert-name="品質ばらつき検知アラート"]')).toBeVisible();

    // クリーンアップ
    page.off('response', responseHandler);
    await page.keyboard.press('F12');
  });
});