import { test, expect } from '@playwright/test';

test('SCEN-1224: 生成された配置案から検討対象を抽出し、実現可能性スコアで優先度付けして表示される', async ({ page }) => {
  // 進捗・人員配置ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');

  // 進捗遅延リスクが検出された拠点のデータが表示されていることを確認する
  const riskCountElement = page.locator('[data-testid="kpi-risk-count"]');
  await expect(riskCountElement).toBeVisible();
  const riskCountText = await riskCountElement.textContent();
  expect(riskCountText).toBeTruthy();

  // ダッシュボード上の「人員配置最適化提案」ボタンをクリックする
  const optimizeButton = page.locator('button:has-text("人員配置最適化提案")');
  await optimizeButton.click();
  await page.waitForLoadState('networkidle');

  // 人員配置最適化提案・実行画面へ遷移する
  await expect(page).toHaveURL(/scr-1789461798629/);

  // 配置案リストが表示されるまで待機
  const assignmentDetailTable = page.locator('[data-testid="assignment-detail-table"]');
  await expect(assignmentDetailTable).toBeVisible();

  // 配置案テーブルの行要素を取得
  const tableBody = page.locator('#assignment-detail-tbody');
  const proposalRows = tableBody.locator('tr');
  const rowCount = await proposalRows.count();
  
  // 複数の配置案候補が存在することを確認
  expect(rowCount).toBeGreaterThanOrEqual(2);

  // 実現可能性スコアで降順にソートされていることを確認し、詳細情報を抽出
  const proposalDetails: { 
    score: number;
    id: string;
    fromSite: string;
    toSite: string;
    personnel: string;
    scoreValue: string;
    scoreText: string;
    row: any;
  }[] = [];
  
  for (let i = 0; i < rowCount; i++) {
    const row = proposalRows.nth(i);
    await expect(row).toBeVisible();
    
    // 各セル要素を取得（テーブル構造を想定：配置案ID、配置元拠点、配置先拠点、追加人員数、実現可能性スコア）
    const cells = row.locator('td');
    const cellCount = await cells.count();
    expect(cellCount).toBeGreaterThanOrEqual(5);
    
    // セルから個別にテキストを抽出し、仕様の5項目に対応させる
    const idCell = cells.nth(0);
    const fromSiteCell = cells.nth(1);
    const toSiteCell = cells.nth(2);
    const personnelCell = cells.nth(3);
    const scoreCell = cells.nth(4);
    
    const id = await idCell.textContent();
    const fromSite = await fromSiteCell.textContent();
    const toSite = await toSiteCell.textContent();
    const personnel = await personnelCell.textContent();
    const scoreText = await scoreCell.textContent();
    
    // スコア値を数値で抽出（%記号があれば除去し、%表示または数値表示の両方に対応）
    const scoreMatch = scoreText?.match(/(\d+(?:\.\d+)?)\s*%?/);
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
    const scoreValue = scoreText?.trim() || '';
    
    // 各項目が正確に対応していることを確認（空でないこと）
    expect(id?.trim()).toBeTruthy();
    expect(fromSite?.trim()).toBeTruthy();
    expect(toSite?.trim()).toBeTruthy();
    expect(personnel?.trim()).toBeTruthy();
    expect(scoreValue).toBeTruthy();
    expect(score).toBeGreaterThan(0);
    
    proposalDetails.push({
      score: score,
      id: id?.trim() || '',
      fromSite: fromSite?.trim() || '',
      toSite: toSite?.trim() || '',
      personnel: personnel?.trim() || '',
      scoreValue: scoreValue,
      scoreText: scoreText?.trim() || '',
      row: row
    });
  }

  // スコアが降順であることを確認（複数候補全体）
  for (let i = 1; i < proposalDetails.length; i++) {
    expect(proposalDetails[i].score).toBeLessThanOrEqual(proposalDetails[i - 1].score);
  }

  // 最上位（スコア最高値）の配置案の詳細情報を確認
  const firstProposal = proposalDetails[0];
  await expect(firstProposal.row).toBeVisible();
  
  // 最上位の配置案が仕様要求の5項目すべてを含むことを確認
  expect(firstProposal.id).toBeTruthy();
  expect(firstProposal.fromSite).toBeTruthy();
  expect(firstProposal.toSite).toBeTruthy();
  expect(firstProposal.personnel).toBeTruthy();
  expect(firstProposal.scoreValue).toBeTruthy();
  expect(firstProposal.score).toBeGreaterThan(0);
  
  // 最上位のスコアが最も高いことを確認
  if (proposalDetails.length > 1) {
    expect(firstProposal.score).toBeGreaterThanOrEqual(proposalDetails[1].score);
  }

  // 2番目以降の配置案も同様に、スコア順に並んでいて各配置案の情報が正確に表示されていることを確認
  for (let i = 1; i < proposalDetails.length; i++) {
    const proposal = proposalDetails[i];
    await expect(proposal.row).toBeVisible();
    
    // 各配置案行に仕様要求の5項目が含まれていることを確認
    expect(proposal.id).toBeTruthy();
    expect(proposal.fromSite).toBeTruthy();
    expect(proposal.toSite).toBeTruthy();
    expect(proposal.personnel).toBeTruthy();
    expect(proposal.scoreValue).toBeTruthy();
    expect(proposal.score).toBeGreaterThan(0);
    
    // スコア順序を確認（降順）
    expect(proposal.score).toBeLessThanOrEqual(proposalDetails[i - 1].score);
  }

  // %表示または数値表示の両方が正しく処理されていることを確認
  for (const proposal of proposalDetails) {
    // scoreValue は元のテキスト（%記号の有無を含む）
    expect(proposal.scoreValue).toMatch(/\d+(?:\.\d+)?%?/);
    // score は数値として抽出されている
    expect(typeof proposal.score).toBe('number');
    expect(proposal.score).toBeGreaterThan(0);
  }

  // 配置案リスト内の各行要素がPlaywrightのセレクタで正確に特定できることを確認
  for (let i = 0; i < Math.min(rowCount, 3); i++) {
    const row = proposalRows.nth(i);
    await expect(row).toBeVisible();
    
    // 行が正確に定位置できることを確認
    const boundingBox = await row.boundingBox();
    expect(boundingBox).toBeTruthy();
    expect(boundingBox?.width).toBeGreaterThan(0);
    expect(boundingBox?.height).toBeGreaterThan(0);
  }

  // 画面遷移が完了し、表示されたDOM要素がPlaywrightのセレクタで安定していることを確認
  await expect(page.locator('[data-testid="assignment-detail-table"]')).toBeVisible();
  await page.waitForLoadState('domcontentloaded');
});