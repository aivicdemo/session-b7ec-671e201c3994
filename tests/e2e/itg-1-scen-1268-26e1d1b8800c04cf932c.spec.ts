import { test, expect } from '@playwright/test';

test('SCEN-1268: 複数拠点の遅延リスク分析が実行された場合、リスクスコアが高い順に拠点がソートされて優先度が付与される', async ({ page }) => {
  // ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');

  // 複数拠点の進捗データがダッシュボードに表示されていることを確認
  const riskAssessmentTable = page.locator('#risk-assessment-tbody');
  await expect(riskAssessmentTable).toBeVisible();
  
  const rows = await riskAssessmentTable.locator('tr').count();
  expect(rows).toBeGreaterThanOrEqual(3);

  // 「進捗遅延リスク分析を実行」ボタンをクリック
  const analyzeButton = page.getByRole('button', { name: '進捗遅延リスク分析を実行' });
  await analyzeButton.click();

  // リスク分析完了まで待機（最大30秒）
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle');

  // リスク分析結果セクションの拠点一覧を確認
  const resultRows = await riskAssessmentTable.locator('tr').all();
  
  // 最初の3つの行を検証
  expect(resultRows.length).toBeGreaterThanOrEqual(3);

  // 各行のテキストを取得
  const rowTexts: string[] = [];
  for (let i = 0; i < Math.min(3, resultRows.length); i++) {
    const text = await resultRows[i].textContent();
    if (text) {
      rowTexts.push(text);
    }
  }

  // B拠点がリスクスコア92で最初に表示されることを確認
  expect(rowTexts[0]).toContain('B拠点');
  expect(rowTexts[0]).toContain('92');
  expect(rowTexts[0]).toContain('高');

  // A拠点がリスクスコア78で2番目に表示されることを確認
  expect(rowTexts[1]).toContain('A拠点');
  expect(rowTexts[1]).toContain('78');
  expect(rowTexts[1]).toContain('中');

  // C拠点がリスクスコア45で3番目に表示されることを確認
  expect(rowTexts[2]).toContain('C拠点');
  expect(rowTexts[2]).toContain('45');
  expect(rowTexts[2]).toContain('低');
});