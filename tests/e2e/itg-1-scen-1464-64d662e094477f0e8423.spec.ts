import { test, expect } from '@playwright/test';

test.describe('人員配置最適化提案画面遷移（実績管理画面から）', () => {
  test('作業指示・実績管理画面から遷移ボタンを操作後、人員配置最適化提案・実行画面が表示される', async ({ page }) => {
    // ログイン画面に遷移
    await page.goto('/');
    
    // ログインフォームに入力
    await page.fill('input[name="userId"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    
    // ページロード完了を待機
    await page.waitForLoadState('networkidle');
    
    // 作業指示・実績管理画面へ遷移
    await page.click('a, button:has-text("作業指示・実績管理")');
    await page.waitForLoadState('networkidle');
    
    // 実績データ一覧が表示されていることを確認
    const workInstructionList = page.locator('[data-testid="work-instruction-list"]');
    await expect(workInstructionList).toBeVisible();
    
    // 作業指示一覧のテーブルに行データが存在することを確認
    const tableRows = page.locator('#work-instruction-tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 作業指示一覧から拠点・チーム・実績データが表示されていることを確認
    const workerSummary = page.locator('#worker-summary-list');
    await expect(workerSummary).toBeVisible();

    // 人員配置最適化提案画面への遷移ボタンをクリック
    await page.click('a, button:has-text("人員配置最適化提案")');
    
    // ページロード完了を待機
    await page.waitForLoadState('networkidle');

    // 人員配置最適化提案・実行画面に遷移していることを確認
    await expect(page).toHaveURL(/.*scr-1789461798629/);

    // (1) 各拠点のチーム別進捗率が表示されていることを確認
    const progressRate = page.locator('[data-testid="progress-rate"]');
    await expect(progressRate).toBeVisible();
    
    const progressRateValue = page.locator('#progress-rate-value');
    await expect(progressRateValue).toBeVisible();

    // (2) 作業者別生産性指標がテーブル形式で表示されていることを確認
    const productivityList = page.locator('#productivity-list');
    await expect(productivityList).toBeVisible();
    
    const productivityRows = page.locator('#productivity-list tbody tr');
    const productivityRowCount = await productivityRows.count();
    expect(productivityRowCount).toBeGreaterThan(0);

    // (3) リスク情報（拠点別の納期遅延確率、警告レベル）が表示されていることを確認
    const riskLevel = page.locator('#risk-level');
    await expect(riskLevel).toBeVisible();
    
    const riskLevelText = await riskLevel.textContent();
    expect(riskLevelText).toBeTruthy();

    const delayDays = page.locator('#delay-days');
    await expect(delayDays).toBeVisible();
    
    const delayDaysText = await delayDays.textContent();
    expect(delayDaysText).toBeTruthy();

    // (4) AI提案された人員配置案（配置元拠点・配置先拠点・推奨人員数）が表示されていることを確認
    const assignmentDetailTable = page.locator('[data-testid="assignment-detail-table"]');
    await expect(assignmentDetailTable).toBeVisible();

    // 配置案詳細テーブルに行データが存在することを確認
    const assignmentRows = page.locator('#assignment-detail-tbody tr');
    const assignmentRowCount = await assignmentRows.count();
    expect(assignmentRowCount).toBeGreaterThan(0);

    // 配置案詳細内の作業者情報（配置元・配置先・人員数）が表示されていることを確認
    const workerNameCells = page.locator('#assignment-detail-tbody td');
    const cellCount = await workerNameCells.count();
    expect(cellCount).toBeGreaterThan(0);

    // AI提案された人員配置案の推奨理由が表示されていることを確認
    const proposalReason = page.locator('#proposal-reason');
    await expect(proposalReason).toBeVisible();
    
    const proposalReasonText = await proposalReason.textContent();
    expect(proposalReasonText).toBeTruthy();

    // 推奨アクションが表示されていることを確認
    const recommendedAction = page.locator('#recommended-action');
    await expect(recommendedAction).toBeVisible();
    
    const recommendedActionText = await recommendedAction.textContent();
    expect(recommendedActionText).toBeTruthy();
  });
});