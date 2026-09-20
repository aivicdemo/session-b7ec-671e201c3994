import { test, expect } from '@playwright/test';

test('SCEN-1235: 納期遅延リスクが高い拠点から順に配置案が並べ替えされて表示される', async ({ page }) => {
  // 1. 進捗・人員配置ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  
  // 2. ダッシュボード上で複数拠点の納期遅延リスク情報が表示されている状態を確認
  const riskCountKPI = page.getByTestId('kpi-risk-count');
  await expect(riskCountKPI).toBeVisible();
  
  // リスク情報が表示されていることを確認（複数拠点のデータが存在）
  const riskAssessmentTable = page.locator('#risk-assessment-tbody');
  await expect(riskAssessmentTable).toBeVisible();
  
  const riskRows = riskAssessmentTable.locator('tr');
  const rowCount = await riskRows.count();
  expect(rowCount).toBeGreaterThan(0);
  
  // 具体的なリスク情報の表示を確認（拠点名とリスク数値）
  const riskTableText = await riskAssessmentTable.textContent();
  expect(riskTableText).toBeTruthy();
  
  // 3. ダッシュボード上で『人員配置最適化提案を表示』または『配置案を確認』ボタンをクリック
  const proposalButton = page.locator('button').filter({ hasText: /人員配置最適化提案|配置案を確認/ }).first();
  await proposalButton.click();
  
  // 4. 人員配置最適化提案・実行画面へ遷移することを確認
  await page.waitForURL('**/scr-1789461798629.html');
  await expect(page).toHaveURL(/scr-1789461798629/);
  
  // ページが読み込まれるのを待つ
  const proposalsContainer = page.locator('#proposals-container');
  await expect(proposalsContainer).toBeVisible();
  
  // 5. 遷移後の画面で、配置案一覧の拠点順序を確認
  // 配置案の詳細テーブルから拠点名とリスク情報を取得して順序を検証
  const assignmentDetailTable = page.locator('#assignment-detail-tbody');
  await expect(assignmentDetailTable).toBeVisible();
  
  const detailRows = assignmentDetailTable.locator('tr');
  const detailRowCount = await detailRows.count();
  
  expect(detailRowCount).toBeGreaterThanOrEqual(3);
  
  // 具体的な拠点名とリスク値の組み合わせを検証し、高い順に並んでいることを確認
  const expectedSites = [
    { name: '拠点A', riskValue: 80 },
    { name: '拠点B', riskValue: 45 },
    { name: '拠点C', riskValue: 15 }
  ];
  
  // 各行のコンテンツを収集
  const rowContents: string[] = [];
  for (let i = 0; i < detailRowCount; i++) {
    const row = detailRows.nth(i);
    const rowContent = await row.textContent();
    rowContents.push(rowContent || '');
  }
  
  // 期待される順序で拠点が配置されていることを検証
  for (let i = 0; i < expectedSites.length && i < detailRowCount; i++) {
    const expectedSite = expectedSites[i];
    const actualRow = rowContents[i];
    
    // 各行に拠点名が含まれていることを確認
    expect(actualRow).toContain(expectedSite.name);
    
    // 各行に「遅延リスク XX%」形式で正確なリスク数値が明示されていることを確認
    const riskPattern = `遅延リスク ${expectedSite.riskValue}%`;
    expect(actualRow).toContain(riskPattern);
  }
  
  // 順序が正しいことを確認：拠点Aが最上行、拠点Bが次、拠点Cが最下行
  expect(rowContents[0]).toContain('拠点A');
  expect(rowContents[0]).toContain('遅延リスク 80%');
  
  expect(rowContents[1]).toContain('拠点B');
  expect(rowContents[1]).toContain('遅延リスク 45%');
  
  expect(rowContents[2]).toContain('拠点C');
  expect(rowContents[2]).toContain('遅延リスク 15%');
});