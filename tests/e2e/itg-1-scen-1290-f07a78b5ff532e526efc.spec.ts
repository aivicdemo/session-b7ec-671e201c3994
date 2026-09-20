import { test, expect } from '@playwright/test';

test.describe('SCEN-1290: リスク分析結果確認 - 生産性データ不足時の警告表示', () => {
  test('過去30日間の生産性データが存在しないとき、効率低下判定精度の低下を示す警告メッセージが表示されるが処理は継続される', async ({ page }) => {
    // テスト環境でスタブを設定：過去30日間の生産性データが空の結果を返す
    await page.addInitScript(() => {
      // WmsHandyTerminalDataSource の fetchProductivityData をスタブ化
      const originalFetch = (window as any).fetch;
      (window as any).fetch = function(...args: any[]) {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
        // 生産性データ取得エンドポイント（過去30日間）を特定してスタブ
        if (url && url.includes('productivity') && url.includes('days=30')) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: [] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          );
        }
        return originalFetch.apply(this, args);
      };
      
      // fetchProductivityData メソッドの直接スタブ化
      if ((window as any).WmsHandyTerminalDataSource) {
        (window as any).WmsHandyTerminalDataSource.fetchProductivityData = () => {
          return Promise.resolve([]);
        };
      }
    });

    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    
    // ページの読み込みを待機
    await page.waitForLoadState('networkidle');

    // リスク分析結果確認ボタンを操作してリスク分析処理を実行
    const confirmButton = page.locator('[data-testid="confirm-results-button"]');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // リスク分析処理の実行を待機
    await page.waitForLoadState('networkidle');

    // 警告メッセージが表示されることを確認
    const warningMessage = page.locator('text=/生産性データが不足しているため、効率低下判定の精度が低下しています/');
    await expect(warningMessage).toBeVisible();

    // 警告メッセージが黄色または橙色の注意レベルで表示されていることを確認
    const warningElement = warningMessage.locator('xpath=ancestor::div[@class or @role]').first();
    const backgroundColor = await warningElement.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.backgroundColor || style.background;
    });
    
    // 黄色または橙色を表示していることを確認
    expect(['rgb(255, 193, 7)', 'rgb(255, 152, 0)', 'rgb(245, 158, 11)', '#ffc107', '#ff9800', '#f59e0b']).toContain(
      backgroundColor.replace(/\s/g, '')
    );

    // 警告メッセージが表示された後も、遅延リスク判定結果が表示されていることを確認
    const riskCountKpi = page.locator('[data-testid="kpi-risk-count"]');
    await expect(riskCountKpi).toBeVisible();

    // リスク評価テーブルが表示されていることを確認
    const riskTable = page.locator('[data-testid="risk-assessment-table"]');
    await expect(riskTable).toBeVisible();

    // テーブルの内容（拠点・チーム情報）が表示されていることを確認
    const riskTableBody = page.locator('#risk-assessment-tbody');
    const rows = riskTableBody.locator('tr');
    await expect(rows).not.toHaveCount(0);

    // リスク評価テーブルから前回のキャッシュ結果または代替データに基づく遅延リスク予測値と推奨人員調整案が表示されていることを確認
    const riskTableRows = await riskTableBody.locator('tr').all();
    let hasDelayRiskData = false;
    let hasRecommendationData = false;
    
    for (const row of riskTableRows) {
      const cells = await row.locator('td').all();
      if (cells.length > 0) {
        const cellTexts = await Promise.all(cells.map(cell => cell.textContent()));
        const rowContent = cellTexts.join('|');
        
        // 遅延リスク関連データの存在確認（パーセンテージ形式）
        if (rowContent.match(/\d+\s*%/)) {
          hasDelayRiskData = true;
        }
        
        // 推奨情報（推奨理由や推奨人数など）の確認
        if (rowContent.match(/推奨/)) {
          hasRecommendationData = true;
        }
      }
    }
    
    // 遅延リスク予測値が表示されていることを確認
    expect(hasDelayRiskData).toBe(true);
    
    // 推奨情報を含むデータが表示されていることを確認
    expect(hasRecommendationData).toBe(true);

    // 人員配置最適化提案・実行画面へ遷移するボタンが有効な状態であることを確認
    const optimizeButton = page.locator('[data-testid="optimize-button"]');
    await expect(optimizeButton).toBeVisible();
    await expect(optimizeButton).toBeEnabled();

    // ボタンテキストが「人員配置を最適化」であることを確認
    await expect(optimizeButton).toContainText('人員配置を最適化');
  });
});