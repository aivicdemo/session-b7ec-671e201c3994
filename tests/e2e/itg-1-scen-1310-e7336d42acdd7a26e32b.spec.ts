import { test, expect } from '@playwright/test';

test.describe('SCEN-1310: ダッシュボード表示（配置提案画面から）', () => {
  test('配置提案画面から正常にダッシュボード画面へ遷移し、全ての集約データが表示される', async ({ page }) => {
    // Step 1: 人員配置最適化提案・実行画面にログイン状態で遷移する
    await page.goto('/panels/scr-1789461798629.html');
    
    // Step 2 & 3: 画面上部のナビゲーションメニューにある「ダッシュボード」へのリンク/ボタンを識別してクリック
    const dashboardLink = page.locator('nav').getByRole('link', { name: '進捗・人員配置ダッシュボード' });
    await dashboardLink.click();
    
    // Step 4: 画面遷移が完了し、進捗・人員配置ダッシュボード画面のURL/ページタイトルが表示されたことを確認
    await page.waitForURL('**/scr-1789461783315.html');
    await expect(page).toHaveTitle(/作業管理システム/);
    
    // Step 5: ダッシュボード画面上に以下の集約データ表示要素が全て存在することを確認
    // 拠点別作業進捗状況（拠点別ばらつき指標テーブル）
    const siteVarianceTable = page.locator('[data-testid="site-variance-table"]');
    await expect(siteVarianceTable).toBeVisible();
    
    // チーム別進捗ばらつき指標テーブル
    const teamVarianceTable = page.locator('[data-testid="team-variance-table"]');
    await expect(teamVarianceTable).toBeVisible();
    
    // 進捗遅延リスク数値化表示
    const riskCountKpi = page.locator('[data-testid="kpi-risk-count"]');
    await expect(riskCountKpi).toBeVisible();
    
    // 対応が必要な拠点リスト（リスク評価テーブル）
    const riskAssessmentTable = page.locator('[data-testid="risk-assessment-table"]');
    await expect(riskAssessmentTable).toBeVisible();
    
    // 配置案実行状況の可視化領域（アクティブプランテーブル）
    const activePlansTable = page.locator('[data-testid="active-plans-table"]');
    await expect(activePlansTable).toBeVisible();
    
    // Step 6: 各集約データ要素に、現在のWMSおよびハンディターミナルから取得された最新の進捗データ値が入力されていることを確認
    // 拠点別進捗率データが存在し、数値が表示されている
    const siteVarianceRows = page.locator('#site-variance-tbody tr');
    await expect(siteVarianceRows.first()).toBeVisible();
    const siteVarianceRowText = await siteVarianceRows.first().textContent();
    expect(siteVarianceRowText).toBeTruthy();
    expect(siteVarianceRowText).toMatch(/\d+/); // 進捗率などの数値が含まれていることを確認
    
    // チーム別ばらつき指標データが存在し、数値が表示されている
    const teamVarianceRows = page.locator('#team-variance-tbody tr');
    await expect(teamVarianceRows.first()).toBeVisible();
    const teamVarianceRowText = await teamVarianceRows.first().textContent();
    expect(teamVarianceRowText).toBeTruthy();
    expect(teamVarianceRowText).toMatch(/\d+/); // ばらつき度などの数値が含まれていることを確認
    
    // リスク数値（%表示）が表示されている
    const riskCountText = await riskCountKpi.textContent();
    expect(riskCountText).toBeTruthy();
    expect(riskCountText).toMatch(/\d+%?/); // リスク数値が%形式で表示されていることを確認
    
    // リスク評価テーブルに対応が必要な拠点データが存在し、各列に値が入力されている
    const riskAssessmentRows = page.locator('#risk-assessment-tbody tr');
    await expect(riskAssessmentRows.first()).toBeVisible();
    const riskAssessmentRowText = await riskAssessmentRows.first().textContent();
    expect(riskAssessmentRowText).toBeTruthy();
    // 拠点名、リスク、遅延日数などの複数の情報を確認
    expect(riskAssessmentRowText).toMatch(/\d+/); // 数値データが含まれていることを確認
    
    // 配置案実行状況テーブルに進捗率・配置配信ステータスデータが存在し、複数の列に値が入力されている
    const activePlansRows = page.locator('#active-plans-tbody tr');
    await expect(activePlansRows.first()).toBeVisible();
    const activePlansRowText = await activePlansRows.first().textContent();
    expect(activePlansRowText).toBeTruthy();
    // 進捗率（数値）またはステータス（文字列）が含まれていることを確認
    expect(activePlansRowText).toMatch(/\d+|完了|中断|配信中|未配信/); // 進捗率またはステータスが表示されていることを確認
  });
});