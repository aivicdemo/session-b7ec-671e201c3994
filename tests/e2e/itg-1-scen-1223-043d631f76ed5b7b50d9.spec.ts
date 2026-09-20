import { test, expect } from '@playwright/test';

test('SCEN-1223: 遅延リスク判定結果に基づいて複数の人員配置案が自動生成される', async ({ page }) => {
  // 進捗・人員配置ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');

  // ダッシュボード上でA拠点チームXの行をクリックして詳細パネルを開く
  const teamVarianceTable = page.locator('#team-variance-tbody');
  await expect(teamVarianceTable).toBeVisible();
  
  // A拠点チームXを特定してクリック
  const teamRows = page.locator('#team-variance-tbody tr');
  let targetRow = null;
  const rowCount = await teamRows.count();
  
  for (let i = 0; i < rowCount; i++) {
    const row = teamRows.nth(i);
    const rowText = await row.textContent();
    if (rowText && rowText.includes('A拠点') && rowText.includes('チームX')) {
      targetRow = row;
      break;
    }
  }
  
  expect(targetRow).not.toBeNull();
  await targetRow.click();

  // 詳細パネル内に「遅延リスク: 72% ⚠ 高」と表示されることを確認する
  const detailPanel = page.locator('[class*="detail"], [class*="panel"]').first();
  await expect(detailPanel).toBeVisible();
  
  // 「遅延リスク: 72% ⚠ 高」という完全な表示を確認
  const riskContent = detailPanel.locator('text=/遅延リスク.*72%.*⚠.*高/');
  await expect(riskContent).toBeVisible();

  // 詳細パネル内の『人員配置案を表示』ボタンをクリックする
  const showProposalButton = detailPanel.locator('button:has-text("人員配置案を表示")');
  await expect(showProposalButton).toBeVisible();
  await showProposalButton.click();

  // 人員配置最適化提案・実行画面へ遷移する
  await page.waitForURL('**/scr-1789461798629.html');
  await page.waitForLoadState('networkidle');
  
  // 遷移先画面を確認
  const proposalContainer = page.locator('#proposals-container');
  await expect(proposalContainer).toBeVisible();

  // 遷移先画面で、3つの異なる人員配置案がカード形式で同時に表示されることを確認する
  const proposalCards = proposalContainer.locator('[class*="proposal-card"], [class*="card"]');
  const cardCount = await proposalCards.count();
  expect(cardCount).toBeGreaterThanOrEqual(3);

  // 各カードを順番に確認し、以下の情報が含まれていることを検証する
  for (let i = 0; i < 3; i++) {
    const card = proposalCards.nth(i);
    await expect(card).toBeVisible();

    // 追加人員数を確認（数字＋「名」という形式）
    const cardText = await card.textContent();
    const hasAssignmentCount = /\d+名/.test(cardText || '');
    expect(hasAssignmentCount).toBe(true);

    // 転配元拠点/派遣区分を確認（「拠点」または「派遣」を含む）
    const hasSourceInfo = /拠点|派遣/.test(cardText || '');
    expect(hasSourceInfo).toBe(true);

    // 予想納期達成確度を確認（数字＋「%」という形式）
    const hasAchievementRate = /\d+%/.test(cardText || '');
    expect(hasAchievementRate).toBe(true);

    // 実行ボタンを確認
    const executeButton = card.locator('button:has-text("実行"), button:has-text("配置案と作業指示を一括配信")');
    await expect(executeButton).toBeVisible();
  }
});