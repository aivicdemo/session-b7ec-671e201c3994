import { test, expect } from '@playwright/test';

test.describe('SCEN-1312: ダッシュボード表示時に操作権限がないユーザーでは、ダッシュボード画面に遷移しない', () => {
  test('ダッシュボード表示権限がないユーザーがダッシュボードへのナビゲーションを試みた場合、遷移が拒否される', async ({ page }) => {
    // ステップ1: テスト用ブラウザ環境を初期化
    // Playwright によるブラウザ初期化は自動的に実施される

    // ステップ2: ダッシュボード表示権限がないユーザー（一般作業者ロール）でログイン
    await page.goto('/');
    
    // ログイン画面が表示されるまで待機
    await page.waitForSelector('input[name="username"]', { timeout: 5000 });
    
    // 権限なしユーザーの認証情報でログイン
    await page.fill('input[name="username"]', 'worker_user');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("ログイン")');
    
    // ログイン後の画面遷移を待機
    await page.waitForLoadState('networkidle');

    // ステップ3: 人員配置最適化提案・実行画面に遷移していることを確認
    const proposalScreenUrl = page.url();
    expect(proposalScreenUrl).toContain('scr-1789461798629');
    
    // 人員配置最適化提案・実行画面のUI要素が表示されていることを確認
    await page.waitForSelector('[data-testid="generate-proposals-btn"]', { timeout: 5000 });
    const proposalScreenElement = page.locator('[data-testid="generate-proposals-btn"]');
    await expect(proposalScreenElement).toBeVisible();

    // ステップ3: 画面上に表示されているUI要素からダッシュボード画面へのナビゲーション手段を特定
    // ナビゲーションメニューから「進捗・人員配置ダッシュボード」へのリンク/ボタンを検索
    const dashboardNavLink = page.locator('nav [data-testid="scr-1789461783315"], nav button:has-text("進捗・人員配置ダッシュボード"), nav a:has-text("進捗・人員配置ダッシュボード"), [class*="nav"] [data-testid="scr-1789461783315"], [class*="nav"] button:has-text("進捗・人員配置ダッシュボード"), [class*="nav"] a:has-text("進捗・人員配置ダッシュボード")').first();

    const dashboardNavExists = await dashboardNavLink.isVisible().catch(() => false);

    if (dashboardNavExists) {
      // ステップ4: ダッシュボード遷移ボタンをクリック
      const initialUrl = page.url();
      
      // レスポンスリスナーを設定してHTTPステータスを監視
      let forbiddenResponseReceived = false;
      page.on('response', response => {
        if (response.status() === 403 || response.status() === 401) {
          forbiddenResponseReceived = true;
        }
      });

      await dashboardNavLink.click();
      
      // ページ遷移または画面更新を待機
      await page.waitForLoadState('networkidle').catch(() => {});
      
      // ステップ5: 結果を確認
      const currentUrl = page.url();
      
      // 期待結果の検証
      // (1) 人員配置最適化提案・実行画面のままである
      const stillOnProposalScreen = currentUrl.includes('scr-1789461798629');
      
      // (2) HTTP 403/401 レスポンスを受け取った
      const receivedForbiddenResponse = forbiddenResponseReceived;
      
      // (3) 権限拒否メッセージが表示される
      const errorMessageVisible = await page.locator('text=/アクセス権限|Permission denied|Forbidden/i').isVisible().catch(() => false);
      
      // いずれかの条件が満たされていることを確認
      const conditionMet = stillOnProposalScreen || receivedForbiddenResponse || errorMessageVisible;
      expect(conditionMet).toBeTruthy();

      // ダッシュボード画面のコンテンツが表示されていないことを確認
      // 複数のダッシュボード固有コンテンツ要素を個別に確認
      const kpiRiskCountVisible = await page.locator('[data-testid="kpi-risk-count"]').isVisible().catch(() => false);
      const kpiSitesActionVisible = await page.locator('[data-testid="kpi-sites-action"]').isVisible().catch(() => false);
      const kpiActivePlansVisible = await page.locator('[data-testid="kpi-active-plans"]').isVisible().catch(() => false);
      const siteVarianceTableVisible = await page.locator('[id="site-variance-tbody"]').isVisible().catch(() => false);
      const teamVarianceTableVisible = await page.locator('[id="team-variance-tbody"]').isVisible().catch(() => false);
      const riskAssessmentTableVisible = await page.locator('[id="risk-assessment-tbody"]').isVisible().catch(() => false);
      
      // これらのダッシュボード固有コンテンツはすべて非表示であることを確認
      expect(kpiRiskCountVisible).toBeFalsy();
      expect(kpiSitesActionVisible).toBeFalsy();
      expect(kpiActivePlansVisible).toBeFalsy();
      expect(siteVarianceTableVisible).toBeFalsy();
      expect(teamVarianceTableVisible).toBeFalsy();
      expect(riskAssessmentTableVisible).toBeFalsy();
    } else {
      // ナビゲーション手段そのものが表示されていない場合も権限がないことの証拠
      // この場合、人員配置最適化提案・実行画面に留まっていることを確認
      const currentUrl = page.url();
      expect(currentUrl).toContain('scr-1789461798629');
      
      // ダッシュボード画面のコンテンツが表示されていないことを確認
      const kpiRiskCountVisible = await page.locator('[data-testid="kpi-risk-count"]').isVisible().catch(() => false);
      const kpiSitesActionVisible = await page.locator('[data-testid="kpi-sites-action"]').isVisible().catch(() => false);
      const kpiActivePlansVisible = await page.locator('[data-testid="kpi-active-plans"]').isVisible().catch(() => false);
      const siteVarianceTableVisible = await page.locator('[id="site-variance-tbody"]').isVisible().catch(() => false);
      const teamVarianceTableVisible = await page.locator('[id="team-variance-tbody"]').isVisible().catch(() => false);
      const riskAssessmentTableVisible = await page.locator('[id="risk-assessment-tbody"]').isVisible().catch(() => false);
      
      expect(kpiRiskCountVisible).toBeFalsy();
      expect(kpiSitesActionVisible).toBeFalsy();
      expect(kpiActivePlansVisible).toBeFalsy();
      expect(siteVarianceTableVisible).toBeFalsy();
      expect(teamVarianceTableVisible).toBeFalsy();
      expect(riskAssessmentTableVisible).toBeFalsy();
    }
  });
});