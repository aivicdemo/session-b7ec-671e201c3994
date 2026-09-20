import { test, expect } from '@playwright/test';

test('SCEN-1323: 生成された配置案が実現可能性スコアに基づいて優先度付けされ、優先度の高い順に表示される', async ({ page }) => {
  // ブラウザで人員配置最適化提案・実行画面にアクセスする
  await page.goto('/panels/scr-1789461798629.html');

  // 現在の作業進捗と生産性データが画面に読み込まれるまで待機する
  await page.waitForSelector('[id="proposals-container"]', { timeout: 30000 });

  // 画面の配置案一覧表示領域が表示されることを確認する
  const proposalsContainer = page.locator('[id="proposals-container"]');
  await expect(proposalsContainer).toBeVisible();

  // 表示された複数の人員配置案が一覧で表示されていることを確認する
  const proposalElements = proposalsContainer.locator('[id="proposal-detail-container"]');
  const count = await proposalElements.count();
  expect(count).toBeGreaterThan(1);

  // 表示されている各配置案の並び順を上から順に記録し、各配置案に表示されている実現可能性スコアの値を記録する
  const scores: number[] = [];
  for (let i = 0; i < count; i++) {
    const proposal = proposalElements.nth(i);
    const scoreText = await proposal.locator('[id="logic-status"]').textContent();
    const scoreMatch = scoreText?.match(/(\d+)/);
    if (scoreMatch) {
      scores.push(parseInt(scoreMatch[1], 10));
    }
  }

  // 各配置案の表示位置に対応するスコア値が高い順の序列と一致していることが画面上で確認できる
  expect(scores.length).toBeGreaterThan(1);
  
  // スコアが高い順に並んでいることを確認
  for (let i = 0; i < scores.length - 1; i++) {
    expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
  }
});