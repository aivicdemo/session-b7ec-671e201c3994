import { test, expect } from '@playwright/test';

test('SCEN-1252: リスク分析実行時に生産性データの取得に失敗するとエラーメッセージが表示されて以降の工程が中断される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  await page.fill('input[name="userId"]', 'testuser');
  await page.fill('input[name="password"]', 'testpassword');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 進捗・人員配置ダッシュボードを開く
  await page.goto('/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');

  // WMS通信エラーをシミュレート
  await page.route('**/api/*', (route) => {
    if (route.request().url().includes('productivity') || route.request().url().includes('wms')) {
      route.abort('timedout');
    } else {
      route.continue();
    }
  });

  // 進捗遅延リスク分析の実行ボタンをクリック
  const optimizeButton = page.locator('[data-testid="optimize-button"]');
  await optimizeButton.click();

  // エラーハンドリングが実行され、画面に結果が反映されるまで待機（最大10秒）
  const errorMessage = page.locator('text=生産性データの取得に失敗しました。リスク分析は中断されました。管理者にお問い合わせください');
  await expect(errorMessage).toBeVisible({ timeout: 10000 });

  // 画面上にエラーメッセージが表示されていることを確認
  await expect(errorMessage).toContainText('生産性データの取得に失敗しました。リスク分析は中断されました。管理者にお問い合わせください');

  // ダッシュボード内の各要素が前回の分析結果を表示したまま更新されていないことを確認
  const kpiRiskCount = page.locator('[data-testid="kpi-risk-count"]');
  const kpiSitesAction = page.locator('[data-testid="kpi-sites-action"]');
  const kpiActivePlans = page.locator('[data-testid="kpi-active-plans"]');

  // 初期状態の値を取得
  const initialRiskCount = await kpiRiskCount.textContent();
  const initialSitesAction = await kpiSitesAction.textContent();
  const initialActivePlans = await kpiActivePlans.textContent();

  // 短い待機後、値が変わっていないことを確認
  await page.waitForTimeout(1000);
  await expect(kpiRiskCount).toContainText(initialRiskCount || '');
  await expect(kpiSitesAction).toContainText(initialSitesAction || '');
  await expect(kpiActivePlans).toContainText(initialActivePlans || '');

  // テーブルのデータが更新されていないことを確認
  const siteVarianceTable = page.locator('[data-testid="site-variance-table"]');
  const teamVarianceTable = page.locator('[data-testid="team-variance-table"]');
  const riskAssessmentTable = page.locator('[data-testid="risk-assessment-table"]');

  // 初期行数を取得
  const initialSiteRows = await siteVarianceTable.locator('tbody tr').count();
  const initialTeamRows = await teamVarianceTable.locator('tbody tr').count();
  const initialRiskRows = await riskAssessmentTable.locator('tbody tr').count();

  // 待機後、行数が変わっていないことを確認
  await page.waitForTimeout(1000);
  await expect(siteVarianceTable.locator('tbody tr')).toHaveCount(initialSiteRows);
  await expect(teamVarianceTable.locator('tbody tr')).toHaveCount(initialTeamRows);
  await expect(riskAssessmentTable.locator('tbody tr')).toHaveCount(initialRiskRows);
});