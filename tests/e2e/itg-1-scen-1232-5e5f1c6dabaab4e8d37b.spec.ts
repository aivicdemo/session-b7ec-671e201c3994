import { test, expect } from '@playwright/test';

test('SCEN-1232: 優先度スコアに応じてリスクレベル（高・中・低）が付与される', async ({ page }) => {
  // 進捗・人員配置ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');

  // 複数の拠点の作業進捗データが表示されていることを確認する
  const siteVarianceTable = page.locator('#site-variance-tbody');
  await expect(siteVarianceTable).toBeVisible();
  const siteRows = await siteVarianceTable.locator('tr').count();
  expect(siteRows).toBeGreaterThan(0);

  // 人員配置最適化提案・実行画面へ遷移する
  await page.click('text=人員配置最適化提案');
  await page.waitForLoadState('networkidle');

  // 各拠点の進捗・生産性データが画面に読み込まれたことを確認する
  const productivityList = page.locator('#productivity-list');
  await expect(productivityList).toBeVisible();

  // 人員配置最適化提案・実行画面上で『人員配置案を自動生成』ボタンを実行する
  const generateButton = page.locator('[data-testid="generate-proposals-btn"]');
  await expect(generateButton).toBeVisible();
  await generateButton.click();
  await page.waitForLoadState('networkidle');

  // 画面上に生成された人員配置提案の一覧が表示されることを確認する
  const proposalsContainer = page.locator('#proposals-container');
  await expect(proposalsContainer).toBeVisible();

  // 各提案行に『リスクレベル』列が存在することを確認する
  const proposalDetailContainer = page.locator('#proposal-detail-container');
  await expect(proposalDetailContainer).toBeVisible();

  // 提案一覧のテーブルを取得
  const assignmentDetailTable = page.locator('#assignment-detail-tbody');
  const rows = await assignmentDetailTable.locator('tr').all();

  expect(rows.length).toBeGreaterThanOrEqual(3);

  // 各行の拠点名、リスクレベル、背景色、遅延確率を取得し、検証
  const proposalRiskData: Array<{
    index: number;
    siteName: string;
    riskLevel: string;
    bgColor: string;
    delayProbability: number;
  }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = await row.locator('td').all();

    // 各行のセルテキストを取得
    const cellTexts = await Promise.all(cells.map(cell => cell.textContent()));

    // 拠点名、リスクレベル、遅延確率を探索
    let siteName = '';
    let riskLevelText = '';
    let delayProbabilityValue = 0;
    let riskCellElement = null;

    for (let j = 0; j < cells.length; j++) {
      const text = cellTexts[j]?.trim() || '';

      // 拠点名を探索（拠点A、拠点B、拠点Cなど）
      if (text.includes('拠点')) {
        siteName = text;
      }

      // リスクレベルを探索
      if (text === '低' || text === '中' || text === '高') {
        riskLevelText = text;
        riskCellElement = cells[j];
      }

      // 遅延確率を探索（パーセンテージ形式）
      const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
      if (percentMatch) {
        delayProbabilityValue = parseFloat(percentMatch[1]);
      }
    }

    let bgColor = 'rgba(0, 0, 0, 0)';
    if (riskCellElement) {
      bgColor = await riskCellElement.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );
    }

    proposalRiskData.push({
      index: i,
      siteName,
      riskLevel: riskLevelText,
      bgColor,
      delayProbability: delayProbabilityValue,
    });
  }

  // 拠点A、B、Cのリスクレベルを検証
  const siteAData = proposalRiskData.find(data => data.siteName.includes('A'));
  const siteBData = proposalRiskData.find(data => data.siteName.includes('B'));
  const siteCData = proposalRiskData.find(data => data.siteName.includes('C'));

  // 拠点Aの提案行のリスクレベルセルに『低』と表示されていることを確認する
  expect(siteAData).toBeDefined();
  expect(siteAData?.riskLevel).toBe('低');
  // 遅延確率が0～33%未満であることを検証
  expect(siteAData?.delayProbability).toBeGreaterThanOrEqual(0);
  expect(siteAData?.delayProbability).toBeLessThan(33);

  // 拠点Bの提案行のリスクレベルセルに『中』と表示されていることを確認する
  expect(siteBData).toBeDefined();
  expect(siteBData?.riskLevel).toBe('中');
  // 遅延確率が33%以上66%未満であることを検証
  expect(siteBData?.delayProbability).toBeGreaterThanOrEqual(33);
  expect(siteBData?.delayProbability).toBeLessThan(66);

  // 拠点Cの提案行のリスクレベルセルに『高』と表示されていることを確認する
  expect(siteCData).toBeDefined();
  expect(siteCData?.riskLevel).toBe('高');
  // 遅延確率が66%以上100%以下であることを検証
  expect(siteCData?.delayProbability).toBeGreaterThanOrEqual(66);
  expect(siteCData?.delayProbability).toBeLessThanOrEqual(100);

  // リスクレベルの3段階が全て表示されていることを確認
  const riskLevels = new Set(proposalRiskData.map(r => r.riskLevel));
  expect(riskLevels.size).toBeGreaterThanOrEqual(3);
  expect(riskLevels.has('低')).toBe(true);
  expect(riskLevels.has('中')).toBe(true);
  expect(riskLevels.has('高')).toBe(true);

  // 背景色が視覚的に区別されていることを確認
  const lowRiskData = proposalRiskData.filter(r => r.riskLevel === '低');
  const mediumRiskData = proposalRiskData.filter(r => r.riskLevel === '中');
  const highRiskData = proposalRiskData.filter(r => r.riskLevel === '高');

  // 各リスクレベルに対応する背景色を収集
  const lowColors = new Set(lowRiskData.map(r => r.bgColor));
  const mediumColors = new Set(mediumRiskData.map(r => r.bgColor));
  const highColors = new Set(highRiskData.map(r => r.bgColor));

  // 背景色が設定されているかを確認
  const hasLowBgColor = Array.from(lowColors).some(color =>
    color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent'
  );
  const hasMediumBgColor = Array.from(mediumColors).some(color =>
    color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent'
  );
  const hasHighBgColor = Array.from(highColors).some(color =>
    color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent'
  );

  // 背景色が設定されている場合、色系統を検証
  if (hasLowBgColor && hasMediumBgColor && hasHighBgColor) {
    const lowColor = Array.from(lowColors).find(color =>
      color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent'
    ) || 'rgba(0, 0, 0, 0)';
    const mediumColor = Array.from(mediumColors).find(color =>
      color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent'
    ) || 'rgba(0, 0, 0, 0)';
    const highColor = Array.from(highColors).find(color =>
      color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent'
    ) || 'rgba(0, 0, 0, 0)';

    const lowRgb = parseRgbString(lowColor);
    const mediumRgb = parseRgbString(mediumColor);
    const highRgb = parseRgbString(highColor);

    // 低=緑系の確認（G成分が支配的）
    const isLowGreen = lowRgb.g >= lowRgb.r && lowRgb.g >= lowRgb.b;
    expect(isLowGreen).toBe(true);

    // 中=黄系の確認（R・G成分が支配的で、Bが低い）
    const isMediumYellow = mediumRgb.r > mediumRgb.b && mediumRgb.g > mediumRgb.b;
    expect(isMediumYellow).toBe(true);

    // 高=赤系の確認（R成分が支配的）
    const isHighRed = highRgb.r >= highRgb.g && highRgb.r >= highRgb.b;
    expect(isHighRed).toBe(true);

    // 各背景色が異なることを確認
    expect(lowColor).not.toBe(mediumColor);
    expect(mediumColor).not.toBe(highColor);
    expect(lowColor).not.toBe(highColor);
  }
});

function parseRgbString(rgbString: string): { r: number; g: number; b: number } {
  const match = rgbString.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
  };
}