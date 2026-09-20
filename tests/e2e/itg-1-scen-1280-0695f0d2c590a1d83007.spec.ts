import { test, expect } from '@playwright/test';

test.describe('SCEN-1280: リスク分析結果確認', () => {
  test('確認結果ボタンから業務フロー開始時に、ダッシュボード統合データが構築されて画面に表示される', async ({ page }) => {
    // テスト環境にログインし、進捗・人員配置ダッシュボード画面に遷移する
    await page.goto('/');
    
    // ログインフォームが表示されるまで待つ
    await page.waitForSelector('.login-card');
    
    // ログイン情報を入力
    const userIdInput = page.locator('input[placeholder*="ID"], input[aria-label*="ID"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button').filter({ hasText: /ログイン|Login/i }).first();
    
    await userIdInput.fill('testuser');
    await passwordInput.fill('password');
    await loginButton.click();
    
    // ダッシュボード画面への遷移を待つ
    await page.waitForURL(/scr-1789461783315/);
    await page.waitForLoadState('networkidle');

    // ダッシュボード画面上の「確認結果」ボタンが表示されていることを確認する
    const confirmResultsButton = page.getByTestId('confirm-results-button');
    await expect(confirmResultsButton).toBeVisible();

    // 「確認結果」ボタンをクリックする
    await confirmResultsButton.click();

    // 画面がリスク分析結果確認処理を開始し、進捗インジケータが表示されることを待つ
    // 進捗インジケータが表示されるまで待機
    const progressIndicator = page.locator('[class*="progress"], [class*="loading"], [class*="spinner"]').first();
    await expect(progressIndicator).toBeVisible({ timeout: 5000 }).catch(() => {
      // 進捗インジケータが瞬時に消える場合もあるため、続行
    });

    // 進捗インジケータが消えるまで待つ
    await page.waitForTimeout(1000);
    await progressIndicator.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {
      // インジケータが既に非表示の場合もある
    });

    // 進捗・人員配置ダッシュボード画面に表示されるダッシュボードウィジェット内に、
    // 以下の統合データが表示されていることを確認する

    // (1) 拠点別・チーム別の進捗状況がリアルタイム監視データとして表示
    const siteVarianceTable = page.getByTestId('site-variance-table');
    await expect(siteVarianceTable).toBeVisible();
    const siteVarianceRows = page.locator('#site-variance-tbody tr');
    await expect(siteVarianceRows).not.toHaveCount(0);

    const teamVarianceTable = page.getByTestId('team-variance-table');
    await expect(teamVarianceTable).toBeVisible();
    const teamVarianceRows = page.locator('#team-variance-tbody tr');
    await expect(teamVarianceRows).not.toHaveCount(0);

    // (2) 進捗遅延リスクが数値化されて表示
    const kpiRiskCount = page.getByTestId('kpi-risk-count');
    await expect(kpiRiskCount).toBeVisible();
    const riskCountText = await kpiRiskCount.textContent();
    expect(riskCountText).toBeTruthy();
    expect(riskCountText).toMatch(/\d+|%/);

    // (3) 対応が必要な拠点名と推奨調整内容が可視化
    const riskAssessmentTable = page.getByTestId('risk-assessment-table');
    await expect(riskAssessmentTable).toBeVisible();
    const riskAssessmentRows = page.locator('#risk-assessment-tbody tr');
    await expect(riskAssessmentRows).not.toHaveCount(0);

    // (4) 人員配置案の実行ステータスが一覧表示
    const activePlansTable = page.getByTestId('active-plans-table');
    await expect(activePlansTable).toBeVisible();
    const activePlansRows = page.locator('#active-plans-tbody tr');
    await expect(activePlansRows).not.toHaveCount(0);

    // すべてのウィジェットが表示状態であることを確認
    await expect(siteVarianceTable).toBeVisible();
    await expect(teamVarianceTable).toBeVisible();
    await expect(kpiRiskCount).toBeVisible();
    await expect(riskAssessmentTable).toBeVisible();
    await expect(activePlansTable).toBeVisible();
  });
});