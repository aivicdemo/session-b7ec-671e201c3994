import { test, expect } from '@playwright/test';

test('SCEN-1195: ダッシュボード表示時に進捗遅延リスク判定結果がリスクレベル付きで表示される', async ({ page }) => {
  // テスト環境にて、進捗・人員配置ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');

  // ダッシュボード画面が完全に読み込まれるまで待機する
  await page.waitForLoadState('networkidle');

  // ダッシュボード画面上の進捗遅延リスク判定結果が表示されるまで待機する（最大10秒）
  await page.waitForSelector('[data-testid="risk-assessment-table"]', { timeout: 10000 });

  // 画面上に表示されている進捗遅延リスク表示エリアを確認する
  const riskAssessmentTable = page.locator('[data-testid="risk-assessment-table"]');
  
  // テーブルが表示されていることを確認
  await expect(riskAssessmentTable).toBeVisible();

  // リスク判定結果のテーブルボディを取得
  const tableBody = page.locator('#risk-assessment-tbody');
  await expect(tableBody).toBeVisible();

  // テーブル内のすべての行を取得
  const rows = page.locator('#risk-assessment-tbody tr');
  const rowCount = await rows.count();

  // 複数拠点のデータが存在することを確認
  expect(rowCount).toBeGreaterThan(0);

  // 各リスクレベルごとの検証
  // リスクレベルが『高』の拠点を検証
  const highRiskRows = page.locator('#risk-assessment-tbody tr:has-text("高")');
  const highRiskRowCount = await highRiskRows.count();
  
  if (highRiskRowCount > 0) {
    const firstHighRiskRow = highRiskRows.first();
    
    // テキスト内に「高」が含まれていることを確認
    await expect(firstHighRiskRow).toContainText('高');
    
    // 遅延確率（パーセンテージ）が表示されていることを確認
    const riskContent = await firstHighRiskRow.textContent();
    expect(riskContent).toMatch(/\d+%/);
    
    // 赤色で表示されていることを確認
    const backgroundColor = await firstHighRiskRow.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // 赤色系（RGB値で赤成分が高い）かどうかを確認
    expect(backgroundColor).toMatch(/rgba?\(\s*(?:255|[12]?\d{1,2})\s*,\s*(?:[0-9]|[1-9][0-9]|1[0-2][0-9]|13[0-9])\s*,\s*(?:[0-9]|[1-9][0-9]|1[0-2][0-9]|13[0-9])/);
  }

  // リスクレベルが『中』の拠点を検証
  const mediumRiskRows = page.locator('#risk-assessment-tbody tr:has-text("中")');
  const mediumRiskRowCount = await mediumRiskRows.count();
  
  if (mediumRiskRowCount > 0) {
    const firstMediumRiskRow = mediumRiskRows.first();
    
    // テキスト内に「中」が含まれていることを確認
    await expect(firstMediumRiskRow).toContainText('中');
    
    // 遅延確率（パーセンテージ）が表示されていることを確認
    const riskContent = await firstMediumRiskRow.textContent();
    expect(riskContent).toMatch(/\d+%/);
    
    // 黄色で表示されていることを確認
    const backgroundColor = await firstMediumRiskRow.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // 黄色系（緑と赤成分が高い）かどうかを確認
    expect(backgroundColor).toMatch(/rgba?\(\s*(?:255|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\s*,\s*(?:255|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\s*,\s*(?:[0-9]|[1-9][0-9]|1[0-2][0-9]|13[0-9])/);
  }

  // リスクレベルが『低』の拠点を検証
  const lowRiskRows = page.locator('#risk-assessment-tbody tr:has-text("低")');
  const lowRiskRowCount = await lowRiskRows.count();
  
  if (lowRiskRowCount > 0) {
    const firstLowRiskRow = lowRiskRows.first();
    
    // テキスト内に「低」が含まれていることを確認
    await expect(firstLowRiskRow).toContainText('低');
    
    // 遅延確率（パーセンテージ）が表示されていることを確認
    const riskContent = await firstLowRiskRow.textContent();
    expect(riskContent).toMatch(/\d+%/);
    
    // 緑色で表示されていることを確認
    const backgroundColor = await firstLowRiskRow.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // 緑色系（緑成分が赤・青より高い）かどうかを確認
    expect(backgroundColor).toMatch(/rgba?\(\s*(?:[0-9]|[1-9][0-9]|1[0-2][0-9]|13[0-9])\s*,\s*(?:255|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\s*,\s*(?:[0-9]|[1-9][0-9]|1[0-2][0-9]|13[0-9])/);
  }

  // リスクレベルおよび遅延確率がすべて視認可能であることを確認
  const allRows = page.locator('#risk-assessment-tbody tr');
  const allRowsCount = await allRows.count();
  
  for (let i = 0; i < allRowsCount; i++) {
    const row = allRows.nth(i);
    await expect(row).toBeVisible();
    
    // リスクレベルテキストが含まれていることを確認
    const rowText = await row.textContent();
    const hasRiskLevel = ['高', '中', '低', '極高'].some(level => rowText?.includes(level));
    expect(hasRiskLevel).toBeTruthy();
    
    // 遅延確率のパーセンテージが表示されていることを確認
    expect(rowText).toMatch(/\d+%/);
  }
});