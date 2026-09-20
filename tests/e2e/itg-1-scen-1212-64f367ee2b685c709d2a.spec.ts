import { test, expect } from '@playwright/test';

test('SCEN-1212: 複数チームの進捗報告時に遅延リスク高のチームに対する推奨対応が優先度付きで表示される', async ({ page }) => {
  // ダッシュボード画面にアクセス
  await page.goto('/panels/scr-1789461783315.html');

  // 複数チームの進捗情報が表示されるまで待機
  await page.waitForSelector('[id="team-variance-tbody"]', { state: 'visible' });

  // チームA、B、Cの進捗情報を確認
  const teamVarianceTable = page.locator('[id="team-variance-tbody"]');
  
  // テーブル行を取得
  const tableRows = await teamVarianceTable.locator('tr').all();
  expect(tableRows.length).toBeGreaterThanOrEqual(3);

  // チームAの情報を確認
  const teamARow = tableRows[0];
  const teamAText = await teamARow.textContent();
  expect(teamAText).toContain('チームA');
  expect(teamAText).toContain('40%');
  expect(teamAText).toContain('2');

  // チームBの情報を確認
  const teamBRow = tableRows[1];
  const teamBText = await teamBRow.textContent();
  expect(teamBText).toContain('チームB');
  expect(teamBText).toContain('65%');
  expect(teamBText).toContain('3');

  // チームCの情報を確認
  const teamCRow = tableRows[2];
  const teamCText = await teamCRow.textContent();
  expect(teamCText).toContain('チームC');
  expect(teamCText).toContain('85%');
  expect(teamCText).toContain('5');

  // 各チームの遅延リスク表示を確認
  expect(teamAText).toContain('遅延リスク高');
  expect(teamBText).toContain('遅延リスク中');
  expect(teamCText).toContain('遅延リスク低');

  // 推奨対応表示エリアを確認
  const recommendedActionsArea = page.locator('[id="recommended-actions"]');
  await recommendedActionsArea.waitFor({ state: 'visible' });

  const recommendedActionsText = await recommendedActionsArea.textContent();

  // チームAに対する推奨対応が優先度付きで表示されることを確認
  expect(recommendedActionsText).toContain('優先度1');
  expect(recommendedActionsText).toContain('チームDから2名を配置転換');
  
  expect(recommendedActionsText).toContain('優先度2');
  expect(recommendedActionsText).toContain('残業時間を4時間追加');

  // チームB、C の推奨対応が表示されないことを確認
  // 推奨対応エリア内でチームBやチームCの対応が独立して表示されていないことを確認
  const recommendedActionsContent = await recommendedActionsArea.locator('div, p, span').allTextContents();
  const allText = recommendedActionsContent.join(' ');
  
  // チームAの推奨対応のみが存在し、チームB、C のものは表示されていないことを確認
  const hasTeamARecommendation = allText.includes('優先度1') && allText.includes('チームDから2名を配置転換');
  const hasTeamAAdditionalRecommendation = allText.includes('優先度2') && allText.includes('残業時間を4時間追加');
  
  expect(hasTeamARecommendation).toBeTruthy();
  expect(hasTeamAAdditionalRecommendation).toBeTruthy();
});