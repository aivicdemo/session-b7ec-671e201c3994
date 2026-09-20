import { test, expect } from '@playwright/test';

test('SCEN-1213: チーム進捗データが受注数0件の場合、エラーメッセージが表示される', async ({ page }) => {
  // テスト環境を初期化し、WmsHandyTerminalDataSource.fetchProgressData()のスタブが受注数=0件の進捗データを返すように設定
  await page.addInitScript(() => {
    // WmsHandyTerminalDataSource.fetchProgressData()をスタブ化
    if (window.WmsHandyTerminalDataSource) {
      window.WmsHandyTerminalDataSource.fetchProgressData = async () => {
        return {
          orderCount: 0,
          completedCount: 0
        };
      };
    }
  });

  // ダッシュボード画面のURLを構築
  const dashboardUrl = '/panels/scr-1789461783315.html';

  // 進捗・人員配置ダッシュボード画面をブラウザで開く
  await page.goto(dashboardUrl, { waitUntil: 'networkidle' });

  // ダッシュボード画面の読み込みが完了し、初期データ表示処理が実行されるまで待機
  await page.waitForLoadState('networkidle');

  // 画面上のエラー表示領域を確認する
  // エラーメッセージ要素が存在することを確認
  const errorBanner = page.locator('[id="error-banner"]');
  const errorMessage = page.locator('[id="error-message"]');

  // エラーが表示されていることを確認
  await expect(errorBanner).toBeVisible();
  await expect(errorMessage).toContainText('進捗データが不正です。受注数と完了数を確認してください');

  // 通常のダッシュボード内容が表示されていないことを確認
  const trendChart = page.locator('[id="trend-chart"]');
  const teamVarianceTable = page.locator('[id="team-variance-tbody"]');
  const siteVarianceTable = page.locator('[id="site-variance-tbody"]');
  const riskAssessmentTable = page.locator('[id="risk-assessment-tbody"]');
  const activePlansTable = page.locator('[id="active-plans-tbody"]');

  // これらの要素が表示されていないことを確認
  await expect(trendChart).not.toBeVisible();
  await expect(teamVarianceTable).not.toBeVisible();
  await expect(siteVarianceTable).not.toBeVisible();
  await expect(riskAssessmentTable).not.toBeVisible();
  await expect(activePlansTable).not.toBeVisible();
});