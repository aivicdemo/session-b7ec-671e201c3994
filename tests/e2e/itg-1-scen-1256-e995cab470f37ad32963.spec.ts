import { test, expect } from '@playwright/test';

test.describe('SCEN-1256: 進捗遅延リスク分析実行', () => {
  test('平均生産性が0以下の状態でリスク分析を実行すると、警告メッセージが表示されてもリスク判定は続行される', async ({ page }) => {
    // ステップ1: 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // ステップ2: WMS・ハンディターミナルから取得したデータにおいて、平均生産性が0以下の状態になっていることを確認する
    // API経由でWMS・ハンディターミナルデータを取得して平均生産性を確認
    const apiUrl = await page.evaluate(() => window.AIVIC_API_URL);
    const appId = await page.evaluate(() => window.AIVIC_APP_ID);
    const tables = await page.evaluate(() => window.AIVIC_TABLES);

    // 生産性データを取得するためのテーブルを特定
    const productivityTableId = tables?.find((t: any) => 
      t.tableName.includes('productivity') || t.tableName.includes('生産性')
    )?.id;

    let averageProductivity = 0;
    if (productivityTableId && apiUrl && appId) {
      const response = await page.request.get(
        `${apiUrl}/api/${productivityTableId}?app=${appId}`
      );
      if (response.ok()) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          const values = data.map((item: any) => 
            item.productivity || item.average_productivity || 0
          );
          if (values.length > 0) {
            averageProductivity = values.reduce((a: number, b: number) => a + b, 0) / values.length;
          }
        }
      }
    }

    // 平均生産性が0以下であることを確認
    expect(averageProductivity).toBeLessThanOrEqual(0);

    // ステップ3: リスク分析を実行するトリガーを操作
    const optimizeButton = page.locator('[data-testid="optimize-button"]');
    await expect(optimizeButton).toBeVisible();
    await optimizeButton.click();

    // リスク分析の処理が実行されるのを待つ
    await page.waitForLoadState('networkidle');

    // ステップ4: 画面の警告メッセージ表示エリアを確認する
    // 警告メッセージが表示されることを確認
    const warningMessage = page.locator('text=生産性データが不足しています。推定値の精度が低い可能性があります');
    await expect(warningMessage).toBeVisible({ timeout: 5000 });

    // 警告メッセージ要素のスタイルを確認
    const warningContainer = warningMessage.locator('xpath=ancestor::div[contains(@class, "alert") or contains(@class, "warning") or contains(@role, "alert")][1]');
    await expect(warningContainer).toBeVisible();

    // アイコン要素を取得して色を確認
    const iconElement = warningContainer.locator('svg, [class*="icon"], i[class*="alert"], i[class*="warning"]').first();
    
    // アイコンが存在することを確認
    const iconExists = await iconElement.count() > 0;
    expect(iconExists).toBe(true);

    // アイコンまたはコンテナの背景色、テキスト色を確認
    if (iconExists) {
      const computedStyle = await iconElement.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          fill: style.fill,
          backgroundColor: style.backgroundColor,
        };
      });

      // 黄色またはオレンジの色コードをチェック
      const colorRegex = /#f59e0b|#d97706|rgb\(245,\s*158,\s*11\)|rgb\(217,\s*119,\s*6\)|yellow|orange/i;
      const isWarmColor = 
        colorRegex.test(computedStyle.color) || 
        colorRegex.test(computedStyle.fill) || 
        colorRegex.test(computedStyle.backgroundColor);
      
      expect(isWarmColor).toBe(true);
    }

    // ステップ5: リスク判定結果が表示されていることを確認する
    // 拠点別の遅延リスク情報が表示されているか確認
    const siteVarianceTable = page.locator('[id="site-variance-tbody"]');
    await expect(siteVarianceTable).toBeVisible({ timeout: 10000 });

    const siteRows = await siteVarianceTable.locator('tr').count();
    expect(siteRows).toBeGreaterThan(0);

    // 拠点別の遅延状態情報を確認
    const siteRiskContent = await siteVarianceTable.textContent();
    expect(siteRiskContent).toBeTruthy();

    // チーム別の遅延リスク情報が表示されているか確認
    const teamVarianceTable = page.locator('[id="team-variance-tbody"]');
    await expect(teamVarianceTable).toBeVisible({ timeout: 10000 });

    const teamRows = await teamVarianceTable.locator('tr').count();
    expect(teamRows).toBeGreaterThan(0);

    const teamRiskContent = await teamVarianceTable.textContent();
    expect(teamRiskContent).toBeTruthy();

    // リスク判定結果テーブルが表示されていることを確認
    const riskAssessmentTable = page.locator('[id="risk-assessment-tbody"]');
    await expect(riskAssessmentTable).toBeVisible({ timeout: 10000 });

    const riskRows = await riskAssessmentTable.locator('tr').count();
    expect(riskRows).toBeGreaterThan(0);

    const riskContent = await riskAssessmentTable.textContent();
    expect(riskContent).toBeTruthy();

    // 推奨配置案が実際に表示されていることを確認
    // アクティブプランテーブルに推奨配置案の詳細が表示されているか確認
    const activePlansTable = page.locator('[id="active-plans-tbody"]');
    const activePlansVisible = await activePlansTable.isVisible();
    
    if (activePlansVisible) {
      const activePlansContent = await activePlansTable.textContent();
      expect(activePlansContent).toBeTruthy();
      // 配置案の内容（配置案名、進捗率、ステータスなど）が表示されていることを確認
      expect(activePlansContent).toMatch(/進捗|ステータス/);
    }

    // 警告の表示によってリスク分析が続行されていることを確認
    // KPI情報が表示されていることを確認
    const kpiRiskCount = page.locator('[data-testid="kpi-risk-count"]');
    await expect(kpiRiskCount).toBeVisible();
    expect(await kpiRiskCount.textContent()).toBeTruthy();

    const kpiSitesAction = page.locator('[data-testid="kpi-sites-action"]');
    await expect(kpiSitesAction).toBeVisible();
    expect(await kpiSitesAction.textContent()).toBeTruthy();

    const kpiActivePlans = page.locator('[data-testid="kpi-active-plans"]');
    await expect(kpiActivePlans).toBeVisible();
    expect(await kpiActivePlans.textContent()).toBeTruthy();

    // 配置案の生成・配信が阻害されていないことを確認
    // 「人員配置を最適化」ボタンが有効であることを確認
    await expect(optimizeButton).toBeEnabled();
  });
});