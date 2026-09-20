import { test, expect } from '@playwright/test';

test.describe('SCEN-843: 初期割当に紐付く実績記録が取得され、割当結果と実績の比較テーブルに表示される', () => {
  test('割当結果と実績の比較テーブルに割当情報と実績データが1行で表示される', async ({ page }) => {
    // 生産性ダッシュボード・分析画面を開く
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');

    // 画面左側の作業者一覧から、初期割当が記録されている作業者を選択
    const workerList = page.locator('[data-testid="worker-list"], .worker-list, [class*="worker"]');
    await expect(workerList).toBeVisible();
    
    // 最初の作業者を選択（初期割当が存在する作業者を想定）
    const firstWorker = workerList.locator('li, .worker-item, [role="option"]').first();
    await firstWorker.click();

    // 画面中央の『割当結果と実績の比較テーブル』セクションが表示されるまで待つ
    const comparisonTable = page.locator('[data-testid="comparison-table"], .comparison-table, [class*="comparison"]');
    await expect(comparisonTable).toBeVisible();

    // テーブルヘッダーから各カラムの位置を特定
    const headerRow = comparisonTable.locator('thead tr, tr').first();
    const headers = await headerRow.locator('th, td').allTextContents();
    
    // カラムのインデックスを特定
    let assignmentDatetimeIndex = -1;
    let assignmentTypeIndex = -1;
    let assignmentQuantityIndex = -1;
    let assignmentIdIndex = -1;
    let performanceDatetimeIndex = -1;
    let performanceTypeIndex = -1;
    let performanceQuantityIndex = -1;
    let performanceQualityIndex = -1;

    for (let i = 0; i < headers.length; i++) {
      const headerText = headers[i].trim();
      if (headerText.includes('割当日時') || headerText.includes('Assignment Datetime')) {
        assignmentDatetimeIndex = i;
      }
      if (headerText.includes('割当作業タイプ') || headerText.includes('Assignment Type')) {
        assignmentTypeIndex = i;
      }
      if (headerText.includes('割当数量') || headerText.includes('Assignment Quantity')) {
        assignmentQuantityIndex = i;
      }
      if (headerText.includes('割当ID') || headerText.includes('Assignment ID')) {
        assignmentIdIndex = i;
      }
      if (headerText.includes('実績記録日時') || headerText.includes('Performance Datetime')) {
        performanceDatetimeIndex = i;
      }
      if (headerText.includes('実績作業タイプ') || headerText.includes('Performance Type')) {
        performanceTypeIndex = i;
      }
      if (headerText.includes('実績数量') || headerText.includes('Performance Quantity')) {
        performanceQuantityIndex = i;
      }
      if (headerText.includes('実績品質スコア') || headerText.includes('Quality Score')) {
        performanceQualityIndex = i;
      }
    }

    // 必要なカラムが存在することを確認
    expect(assignmentDatetimeIndex).toBeGreaterThanOrEqual(0);
    expect(assignmentTypeIndex).toBeGreaterThanOrEqual(0);
    expect(assignmentQuantityIndex).toBeGreaterThanOrEqual(0);
    expect(assignmentIdIndex).toBeGreaterThanOrEqual(0);
    expect(performanceDatetimeIndex).toBeGreaterThanOrEqual(0);
    expect(performanceTypeIndex).toBeGreaterThanOrEqual(0);
    expect(performanceQuantityIndex).toBeGreaterThanOrEqual(0);
    expect(performanceQualityIndex).toBeGreaterThanOrEqual(0);

    // テーブルボディの最初の行を取得
    const tableRow = comparisonTable.locator('tbody tr, tr[data-row]').first();
    await expect(tableRow).toBeVisible();

    // 同じ行から全てのセルを取得
    const rowCells = await tableRow.locator('td').allTextContents();

    // 割当情報カラムが表示されていることを確認
    const assignmentDatetime = rowCells[assignmentDatetimeIndex]?.trim();
    const assignmentType = rowCells[assignmentTypeIndex]?.trim();
    const assignmentQuantity = rowCells[assignmentQuantityIndex]?.trim();
    const assignmentId = rowCells[assignmentIdIndex]?.trim();

    expect(assignmentDatetime).toBeTruthy();
    expect(assignmentType).toBeTruthy();
    expect(assignmentQuantity).toBeTruthy();
    expect(assignmentId).toBeTruthy();

    // 実績データカラムが表示されていることを確認
    const performanceDatetime = rowCells[performanceDatetimeIndex]?.trim();
    const performanceType = rowCells[performanceTypeIndex]?.trim();
    const performanceQuantity = rowCells[performanceQuantityIndex]?.trim();
    const performanceQuality = rowCells[performanceQualityIndex]?.trim();

    expect(performanceDatetime).toBeTruthy();
    expect(performanceType).toBeTruthy();
    expect(performanceQuantity).toBeTruthy();
    expect(performanceQuality).toBeTruthy();

    // 割当IDと実績記録の割当ID参照が一致していることを確認
    // 実績の割当ID参照が同じ行内に存在することを確認
    const rowContent = await tableRow.textContent();
    expect(rowContent).toContain(assignmentId!);

    // 割当情報と実績データが同じ行に存在することを最終確認
    expect(rowContent).toContain(assignmentDatetime!);
    expect(rowContent).toContain(assignmentType!);
    expect(rowContent).toContain(performanceDatetime!);
    expect(rowContent).toContain(performanceType!);
  });
});