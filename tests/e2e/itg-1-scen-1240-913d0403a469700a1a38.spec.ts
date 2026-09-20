import { test, expect } from '@playwright/test';

test.describe('人員配置最適化提案画面遷移', () => {
  test('リスク判定エンジン（AI）が一時的に利用不可の場合、前回の判定結果がキャッシュから表示される', async ({ page }) => {
    // ステップ1: 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // ステップ2: ダッシュボード画面でリスク判定結果が表示されていることを確認
    const riskCountElement = page.getByTestId('kpi-risk-count');
    await expect(riskCountElement).toBeVisible();
    const riskCountText = await riskCountElement.textContent();
    const dashboardRiskText = riskCountText?.trim() || '';
    expect(dashboardRiskText.length).toBeGreaterThan(0);

    // リスク評価テーブルから対象拠点と推奨配置情報を取得
    const riskAssessmentTbody = page.locator('#risk-assessment-tbody');
    await expect(riskAssessmentTbody).toBeVisible();
    const riskAssessmentRows = riskAssessmentTbody.locator('tr');
    const rowCount = await riskAssessmentRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 最初の行から対象拠点と推奨配置情報を記録
    const firstRow = riskAssessmentRows.first();
    const dashboardSiteText = await firstRow.locator('td').nth(0).textContent();
    const dashboardRecommendationText = await firstRow.locator('td').nth(1).textContent();
    
    expect(dashboardSiteText).toBeTruthy();
    expect(dashboardRecommendationText).toBeTruthy();

    // ステップ3: 人員配置最適化提案画面へ遷移するボタンをクリック
    const optimizeButton = page.getByRole('button', { name: '人員配置を最適化' });
    await expect(optimizeButton).toBeVisible();
    await optimizeButton.click();

    // ステップ4: 人員配置最適化提案・実行画面が表示されるまで待機（最大10秒程度）
    await page.waitForURL(/\/panels\/scr-1789461798629\.html/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // ステップ5: 画面に表示された配置案・数値がステップ2で確認した結果と同じ内容であることを視認

    // 期待結果(1): 遅延リスク判定結果の数値・対象拠点・推奨配置人数が前回判定結果と一致している
    const proposalDetailContainer = page.locator('#proposal-detail-container');
    await expect(proposalDetailContainer).toBeVisible();

    // リスクレベルの確認
    const riskLevelElement = page.locator('#risk-level');
    await expect(riskLevelElement).toBeVisible();
    const proposalRiskText = await riskLevelElement.textContent();
    expect(proposalRiskText).toBeTruthy();
    expect(proposalRiskText?.trim()).toEqual(dashboardRiskText);

    // 遅延日数の確認
    const delayDaysElement = page.locator('#delay-days');
    await expect(delayDaysElement).toBeVisible();
    const proposalDelayText = await delayDaysElement.textContent();
    expect(proposalDelayText).toBeTruthy();

    // 対象拠点と推奨配置情報の比較確認
    const recommendedActionElement = page.locator('#recommended-action');
    await expect(recommendedActionElement).toBeVisible();
    const proposalRecommendationText = await recommendedActionElement.textContent();
    expect(proposalRecommendationText?.trim()).toEqual(dashboardRecommendationText?.trim());

    // 配置詳細テーブルから対象拠点情報を確認
    const assignmentDetailTbody = page.locator('#assignment-detail-tbody');
    await expect(assignmentDetailTbody).toBeVisible();
    const assignmentRows = assignmentDetailTbody.locator('tr');
    const assignmentRowCount = await assignmentRows.count();
    expect(assignmentRowCount).toBeGreaterThan(0);

    // 配置人数の確認
    const firstAssignmentRow = assignmentRows.first();
    const proposalSiteText = await firstAssignmentRow.locator('td').nth(0).textContent();
    expect(proposalSiteText?.trim()).toContain(dashboardSiteText?.trim() || '');

    // 期待結果(2): 配置案の下部に「リスク判定エンジンが一時的に利用できません。前回の判定結果を表示しています」という旨の注記メッセージが表示されている
    const logicStatusElement = page.locator('#logic-status');
    await expect(logicStatusElement).toBeVisible();
    const logicStatusText = await logicStatusElement.textContent();
    expect(logicStatusText).toContain('リスク判定エンジン');
    expect(logicStatusText).toContain('一時的に利用');
    expect(logicStatusText).toContain('前回の判定結果');

    // 期待結果(3): 配置案に対して「更新待機中」というステータスラベルが付与されている
    const proposalsContainer = page.locator('#proposals-container');
    await expect(proposalsContainer).toBeVisible();
    const statusLabel = proposalsContainer.locator('text=更新待機中');
    await expect(statusLabel).toBeVisible();

    // 期待結果(4): ユーザーは配置案の内容を確認でき、画面遷移は完了している
    const assignmentDetailTable = page.getByTestId('assignment-detail-table');
    await expect(assignmentDetailTable).toBeVisible();

    // ページが正常に遷移・読み込まれたことを確認
    const currentUrl = page.url();
    expect(currentUrl).toContain('scr-1789461798629');
  });
});