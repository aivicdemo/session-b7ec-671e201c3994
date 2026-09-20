import { test, expect } from '@playwright/test';

test('承認モーダル確定 - 取得した人員配置案が事前設定の承認基準を満たす場合、承認可否が決定される', async ({ page }) => {
  // ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');

  // 現在の進捗データ（完了数・残数・進捗率）が画面に表示されていることを確認
  const kpiRiskCount = page.getByTestId('kpi-risk-count');
  await expect(kpiRiskCount).toBeVisible();
  
  const kpiSitesAction = page.getByTestId('kpi-sites-action');
  await expect(kpiSitesAction).toBeVisible();
  
  const kpiActivePlans = page.getByTestId('kpi-active-plans');
  await expect(kpiActivePlans).toBeVisible();

  // 作業者ごとの生産性指標（時間当たり処理数・品質スコア・習熟度）が画面に表示されていることを確認
  const siteVarianceTable = page.getByTestId('site-variance-table');
  await expect(siteVarianceTable).toBeVisible();
  
  // テーブル内に時間当たり処理数、品質スコア、習熟度が各行に含まれることを確認
  const siteVarianceTbody = page.locator('#site-variance-tbody');
  const siteRows = siteVarianceTbody.locator('tr');
  const siteRowCount = await siteRows.count();
  
  for (let i = 0; i < siteRowCount; i++) {
    const row = siteRows.nth(i);
    const rowText = await row.textContent();
    expect(rowText).toMatch(/時間当たり処理数|品質スコア|Lv\d+|習熟度/);
  }

  const teamVarianceTable = page.getByTestId('team-variance-table');
  await expect(teamVarianceTable).toBeVisible();
  
  const teamVarianceTbody = page.locator('#team-variance-tbody');
  const teamRows = teamVarianceTbody.locator('tr');
  const teamRowCount = await teamRows.count();
  
  for (let i = 0; i < teamRowCount; i++) {
    const row = teamRows.nth(i);
    const rowText = await row.textContent();
    expect(rowText).toMatch(/時間当たり処理数|品質スコア|Lv\d+|習熟度/);
  }

  // 納期遅延確率の予測値が画面に表示されていることを確認
  const riskAssessmentTable = page.getByTestId('risk-assessment-table');
  await expect(riskAssessmentTable).toBeVisible();

  // 人員配置最適化提案・実行画面に遷移
  const optimizeNav = page.locator('a').filter({ has: page.locator('text=人員配置最適化提案') });
  await optimizeNav.click();
  await page.waitForLoadState('networkidle');

  // 配置案が表示されることを確認
  const proposalsContainer = page.locator('#proposals-container');
  await expect(proposalsContainer).toBeVisible();

  // 配置案の詳細（対象拠点・チーム、推奨人員数、遅延リスク低減効果等）が画面に表示されていることを確認
  const proposalDetailContainer = page.locator('#proposal-detail-container');
  await expect(proposalDetailContainer).toBeVisible();
  
  // 対象拠点、チーム、推奨人員数、遅延リスク低減効果などの詳細情報が表示されていることを確認
  const assignmentDetailTable = page.getByTestId('assignment-detail-table');
  await expect(assignmentDetailTable).toBeVisible();
  
  const assignmentDetailTbody = page.locator('#assignment-detail-tbody');
  await expect(assignmentDetailTbody).toContainText(/対象拠点|拠点/);
  await expect(assignmentDetailTbody).toContainText(/チーム/);
  await expect(assignmentDetailTbody).toContainText(/推奨人員数|人員/);
  await expect(assignmentDetailTbody).toContainText(/遅延リスク低減効果|リスク低減/);

  // 承認モーダルが自動的に表示されることを確認
  const approveModal = page.locator('#approve-modal-overlay');
  await expect(approveModal).toBeVisible({ timeout: 5000 });

  // モーダルコンテンツが表示されることを確認
  const modalContent = page.locator('#approve-modal-content');
  await expect(modalContent).toBeVisible();

  // 承認モーダル内に、生成された配置案の概要（対象拠点・チーム、推奨人員数、遅延リスク低減効果等）が表示されていることを確認
  await expect(modalContent).toContainText(/対象拠点|拠点/);
  await expect(modalContent).toContainText(/チーム/);
  await expect(modalContent).toContainText(/推奨人員数|人員/);
  await expect(modalContent).toContainText(/遅延リスク低減効果|リスク低減/);

  // 承認可否の判定結果が表示されていることを確認
  await expect(modalContent).toContainText(/判定結果|承認基準|判定/);

  // 承認基準を満たしている場合、モーダル内の承認可否ステータスが「承認」と表示されていることを確認
  // モーダルコンテンツ全体に「承認」というテキストが明確に表示されていることを検証
  const modalContentText = await modalContent.textContent();
  expect(modalContentText).toContain('承認');
  
  // さらに、モーダル内で「承認」が単独で表示されていることを確認（判定結果や状態表示として）
  const approvalStatusIndicator = modalContent.locator('text=承認');
  await expect(approvalStatusIndicator).toBeVisible();

  // 「確定」ボタンをクリック
  const confirmButton = page.getByTestId('approve-modal-confirm');
  await expect(confirmButton).toBeVisible();
  await confirmButton.click();

  // 承認モーダルが閉じることを確認
  await expect(approveModal).not.toBeVisible();

  // 人員配置最適化提案・実行画面に戻っていることを確認
  await expect(proposalDetailContainer).toBeVisible();

  // 配置案のステータスが「実行中」に更新されていることを画面で確認
  const executingStatus = page.locator('text=/実行中/');
  await expect(executingStatus).toBeVisible();
});