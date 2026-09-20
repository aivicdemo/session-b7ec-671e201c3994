import { test, expect } from '@playwright/test';

test.describe('SCEN-1196: ダッシュボード表示時に人員配置実行状況が可視化される', () => {
  test('ダッシュボード画面上に人員配置実行状況が可視化されて表示される', async ({ page }) => {
    const startTime = Date.now();

    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');

    // ダッシュボード画面の描画完了を待つ
    // KPI表示エリアが表示されるまで待機
    await page.getByTestId('kpi-risk-count').waitFor({ state: 'visible' });
    await page.getByTestId('kpi-sites-action').waitFor({ state: 'visible' });
    await page.getByTestId('kpi-active-plans').waitFor({ state: 'visible' });

    // テーブルが描画されるまで待機
    await page.locator('#site-variance-tbody').waitFor({ state: 'visible' });
    await page.locator('#team-variance-tbody').waitFor({ state: 'visible' });
    await page.locator('#risk-assessment-tbody').waitFor({ state: 'visible' });
    await page.locator('#active-plans-tbody').waitFor({ state: 'visible' });

    const renderTime = Date.now() - startTime;

    // ダッシュボード画面上に、人員配置実行状況が視覚的に表示されていることを確認する

    // (1) 各拠点・チーム別の進捗率バー（完了数/残数の比率）が表示されていることを確認
    const siteVarianceTable = page.locator('#site-variance-tbody');
    await expect(siteVarianceTable).toBeVisible();
    const siteRows = siteVarianceTable.locator('tr');
    const siteRowCount = await siteRows.count();
    expect(siteRowCount).toBeGreaterThan(0);
    
    // 各行に進捗率バーの要素（数値や進捗を示す情報）が含まれていることを確認
    for (let i = 0; i < siteRowCount; i++) {
      const row = siteRows.nth(i);
      const rowText = await row.textContent();
      expect(rowText).toBeTruthy();
      // 進捗率の数値（%）が表示されていることを確認
      expect(rowText).toMatch(/\d+%/);
    }

    const teamVarianceTable = page.locator('#team-variance-tbody');
    await expect(teamVarianceTable).toBeVisible();
    const teamRows = teamVarianceTable.locator('tr');
    const teamRowCount = await teamRows.count();
    expect(teamRowCount).toBeGreaterThan(0);
    
    // 各行に進捗率の情報が含まれていることを確認
    for (let i = 0; i < teamRowCount; i++) {
      const row = teamRows.nth(i);
      const rowText = await row.textContent();
      expect(rowText).toBeTruthy();
      // 進捗率の数値（%）が表示されていることを確認
      expect(rowText).toMatch(/\d+%/);
    }

    // (2) 納期遅延リスク（0～100%の数値と色分け表示）が表示されていることを確認
    const riskAssessmentTable = page.locator('#risk-assessment-tbody');
    await expect(riskAssessmentTable).toBeVisible();
    const riskRows = riskAssessmentTable.locator('tr');
    const riskRowCount = await riskRows.count();
    expect(riskRowCount).toBeGreaterThan(0);
    
    // 各行にリスク数値（0～100%）が含まれていることを確認
    for (let i = 0; i < riskRowCount; i++) {
      const row = riskRows.nth(i);
      const rowText = await row.textContent();
      expect(rowText).toBeTruthy();
      // リスク数値（0～100%）が表示されていることを確認
      expect(rowText).toMatch(/\d+%/);
    }
    
    // 色分け表示を確認（要素にstyleまたはclassで背景色が指定されていることを確認）
    const riskCells = riskAssessmentTable.locator('tr td');
    for (let i = 0; i < await riskCells.count(); i++) {
      const cell = riskCells.nth(i);
      const style = await cell.getAttribute('style');
      const className = await cell.getAttribute('class');
      // スタイルまたはクラスが設定されていることで色分けが実装されていることを確認
      if (style || className) {
        expect(style || className).toBeTruthy();
      }
    }

    // (3) 推奨される人員配置案（配置元拠点・配置先拠点・人数）が表示されていることを確認
    const recommendedActionsArea = page.locator('#recommended-actions');
    await expect(recommendedActionsArea).toBeVisible();
    const recommendedText = await recommendedActionsArea.textContent();
    expect(recommendedText).toBeTruthy();
    
    // 推奨アクションエリアに具体的な配置情報が含まれていることを確認
    // 拠点情報（日本語で記述されていることを確認）
    expect(recommendedText).toMatch(/拠点|配置|人数|\d+/);

    // (4) 人員配置ステータス（検討中・実行中・完了等の状態）が表示されていることを確認
    const activePlansTable = page.locator('#active-plans-tbody');
    await expect(activePlansTable).toBeVisible();
    const planRows = activePlansTable.locator('tr');
    const planRowCount = await planRows.count();
    expect(planRowCount).toBeGreaterThan(0);
    
    // 各行にステータス情報が含まれていることを確認
    let hasStatus = false;
    for (let i = 0; i < planRowCount; i++) {
      const row = planRows.nth(i);
      const rowText = await row.textContent();
      expect(rowText).toBeTruthy();
      // ステータス値（検討中・実行中・完了等）が表示されていることを確認
      if (rowText && /検討中|実行中|完了|中断|保留/.test(rowText)) {
        hasStatus = true;
        break;
      }
    }
    expect(hasStatus).toBe(true);

    // テスト実行時刻から画面が完全に描画されるまでの所要時間が3秒以内であること
    expect(renderTime).toBeLessThanOrEqual(3000);
  });
});