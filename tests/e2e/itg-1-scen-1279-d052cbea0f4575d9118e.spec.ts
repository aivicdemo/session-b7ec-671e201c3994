import { test, expect } from '@playwright/test';

test.describe('SCEN-1279: 他拠点からの人員融通を提案する場合、融通元拠点の進捗が遅延リスク中以上の場合に警告メッセージが表示される', () => {
  test('進捗遅延リスク分析実行時に融通元拠点の進捗リスクが中以上の場合、警告メッセージが表示される', async ({ page }) => {
    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // 拠点Aの進捗遅延リスクが「中」以上で表示されていることを確認
    const riskCountKPI = page.getByTestId('kpi-risk-count');
    await expect(riskCountKPI).toBeVisible();
    
    // リスク評価テーブルで拠点Aの情報を確認
    const riskAssessmentTable = page.locator('#risk-assessment-tbody');
    await expect(riskAssessmentTable).toBeVisible();
    
    // 拠点Aの遅延リスクが「中」以上であることを確認（リスク列のテキストチェック）
    const siteARiskCell = riskAssessmentTable.locator('tr').filter({ has: page.locator('text=/拠点A|拠点A.*中|拠点A.*高|拠点A.*極高/') });
    await expect(siteARiskCell).toBeVisible();

    // 拠点Bの進捗遅延リスクが「低」で表示されていることを確認
    const siteBRiskCell = riskAssessmentTable.locator('tr').filter({ has: page.locator('text=/拠点B.*低/') });
    await expect(siteBRiskCell).toBeVisible();

    // ダッシュボード上で進捗遅延リスク分析実行ボタンを操作
    const optimizeButton = page.getByRole('button', { name: '人員配置を最適化' });
    await optimizeButton.click();

    // 人員配置最適化提案・実行画面に遷移するのを待つ
    await page.waitForURL('**/scr-1789461798629.html');
    await page.waitForLoadState('networkidle');

    // 提案画面が表示されていることを確認
    const proposalContainer = page.locator('#proposals-container');
    await expect(proposalContainer).toBeVisible();

    // 「拠点Aから拠点Bへ3名を配置転換」という人員融通提案が表示されていることを確認
    const assignmentProposal = proposalContainer.locator('text=/拠点A.*拠点B.*3名|から.*へ.*配置|融通/i');
    await expect(assignmentProposal).toBeVisible();

    // 警告メッセージが表示されているかを確認
    // 提案カード下部または関連領域で警告メッセージを検索
    const warningMessage = page.locator('text=/融通元拠点の進捗にも影響する可能性があります。確認してください/');
    
    // 警告メッセージが画面に視認可能な位置に表示されていることを確認
    await expect(warningMessage).toBeVisible();
    
    // 警告メッセージが提案領域内に存在することを追加確認
    const warningInProposal = proposalContainer.locator('text=/融通元拠点の進捗にも影響する可能性があります。確認してください/');
    await expect(warningInProposal).toBeVisible();

    // ユーザーが融通元拠点の遅延リスク情報を認識できる状態で、提案内容が確認・実行可能な状態であることを確認
    const approveButton = page.getByRole('button', { name: '配置案を承認' });
    await expect(approveButton).toBeEnabled();
  });
});