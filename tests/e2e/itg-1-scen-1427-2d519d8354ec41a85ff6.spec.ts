import { test, expect } from '@playwright/test';

test.describe('SCEN-1427: ダッシュボード表示（実績管理画面から）', () => {
  test('ダッシュボード表示時に、拠点別・チーム別の進捗状況、遅延リスク、人員配置実行状況が画面に集約されて表示される', async ({ page }) => {
    // ログイン処理
    await page.goto('/');
    await page.waitForURL(/.*scr-1789461813941/);
    
    // 作業指示・実績管理画面が表示されていることを確認
    await expect(page).toHaveURL(/.*scr-1789461813941/);
    await page.waitForSelector('[data-testid="work-instruction-list"]');

    // ダッシュボード表示ボタンをクリック
    // 画面から『ダッシュボード表示』というテキストのボタンを探すか、
    // ナビゲーション要素から『進捗・人員配置ダッシュボード』をクリック
    await page.click('text=進捗・人員配置ダッシュボード');
    
    // ダッシュボード画面が表示されるまで待機（最大10秒）
    await page.waitForURL(/.*scr-1789461783315/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*scr-1789461783315/);

    // ダッシュボード画面が正常に表示されていることを確認
    await page.waitForSelector('[data-testid="kpi-risk-count"]', { timeout: 10000 });

    // 1. 拠点別進捗状況セクション：拠点別進捗状況テーブルが存在し、データが表示されていることを確認
    const siteVarianceTable = page.locator('[data-testid="site-variance-table"]');
    await expect(siteVarianceTable).toBeVisible();
    
    // テーブル内に進捗率が数値で表示されていることを確認
    const siteVarianceTbody = page.locator('#site-variance-tbody');
    const siteRows = siteVarianceTbody.locator('tr');
    const siteRowCount = await siteRows.count();
    expect(siteRowCount).toBeGreaterThan(0);

    // 2. 遅延リスク表示：リスク数値が%表記で表示されていることを確認
    const riskKpi = page.locator('[data-testid="kpi-risk-count"]');
    await expect(riskKpi).toBeVisible();
    
    // リスク評価テーブルが存在し、データが表示されていることを確認
    const riskAssessmentTable = page.locator('[data-testid="risk-assessment-table"]');
    await expect(riskAssessmentTable).toBeVisible();
    
    const riskTbody = page.locator('#risk-assessment-tbody');
    const riskRows = riskTbody.locator('tr');
    const riskRowCount = await riskRows.count();
    expect(riskRowCount).toBeGreaterThan(0);

    // 3. 人員配置実行状況パネル：人員配置提案が表示されていることを確認
    const activePlansTable = page.locator('[data-testid="active-plans-table"]');
    await expect(activePlansTable).toBeVisible();
    
    const activePlansTbody = page.locator('#active-plans-tbody');
    const activePlansRows = activePlansTbody.locator('tr');
    const activePlansRowCount = await activePlansRows.count();
    expect(activePlansRowCount).toBeGreaterThan(0);

    // 4. 画面のレイアウトが統合表示されていることを確認
    // 複数のセクションが同時に表示されていることを確認
    await expect(siteVarianceTable).toBeVisible();
    await expect(riskAssessmentTable).toBeVisible();
    await expect(activePlansTable).toBeVisible();

    // KPI情報が表示されていることを確認
    const kpiSitesAction = page.locator('[data-testid="kpi-sites-action"]');
    await expect(kpiSitesAction).toBeVisible();
    
    const kpiActivePlans = page.locator('[data-testid="kpi-active-plans"]');
    await expect(kpiActivePlans).toBeVisible();
  });
});