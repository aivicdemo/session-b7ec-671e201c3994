import { test, expect } from '@playwright/test';

test('SCEN-1364: 推奨される配置案が画面に表示されるとき、優先度スコアが高い順に並び替えられている', async ({ page }) => {
  // ブラウザを起動し、進捗・人員配置ダッシュボード画面にアクセスする
  await page.goto('/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');

  // 人員配置最適化提案・実行画面に遷移し、画面が完全にロードされるまで待機する
  await page.click('text=人員配置最適化提案');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[id="proposals-container"]', { state: 'visible', timeout: 10000 });

  // 配置案の自動生成処理が完了し、複数の推奨される配置案がリスト表示されている状態を確認する
  const generateButton = page.locator('button:has-text("人員配置案を自動生成")');
  if (await generateButton.isVisible()) {
    await generateButton.click();
    await page.waitForLoadState('networkidle');
  }

  await page.waitForSelector('[id="proposals-container"] > div', { state: 'visible', timeout: 10000 });
  const proposalElements = await page.locator('[id="proposals-container"] > div').all();
  expect(proposalElements.length).toBeGreaterThan(0);

  // 画面に表示されている配置案の一覧を上から順に確認し、各配置案に付与されている優先度スコアを記録する
  const priorityScores: number[] = [];

  for (let i = 0; i < proposalElements.length; i++) {
    const proposal = proposalElements[i];
    
    // 配置案要素が画面に表示されているか確認
    await expect(proposal).toBeVisible();

    // 配置案全体のテキスト内容を取得
    const allText = await proposal.textContent();
    
    if (!allText) {
      continue;
    }

    // テキストから優先度スコアを抽出
    // 「優先度スコア: 85」や「スコア: 92.5」などのパターンを探索
    const scoreMatch = allText.match(/(?:優先度スコア|優先度|スコア|priority\s+score|score)[:：]?\s*([0-9]+(?:\.[0-9]+)?)/i);
    
    if (scoreMatch && scoreMatch[1]) {
      const score = parseFloat(scoreMatch[1]);
      priorityScores.push(score);
    }
  }

  // 抽出されたスコアが複数存在することを確認
  expect(priorityScores.length).toBeGreaterThan(0);

  // 優先度スコアが高い順（降順）に並んでいることを確認
  // 最上部に最も高いスコア値の配置案が表示され、以降に向かってスコア値が単調に減少
  for (let i = 0; i < priorityScores.length - 1; i++) {
    expect(priorityScores[i]).toBeGreaterThanOrEqual(priorityScores[i + 1]);
  }
});