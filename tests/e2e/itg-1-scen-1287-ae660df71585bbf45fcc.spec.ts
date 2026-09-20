import { test, expect } from '@playwright/test';

test('SCEN-1287: リスク分析結果確認 - 進捗乖離率が負の値のとき、計画を上回る進捗として扱われリスクレベルが低に設定される', async ({ page }) => {
  // 進捗・人員配置ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');

  // WMSおよびハンディターミナルから進捗データが自動取得され、
  // 計画進捗率 50%、実績進捗率 45%（進捗乖離率 = -5%）の拠点・チーム・作業指示が画面に表示されるまで待機
  await page.waitForLoadState('networkidle');

  // リスク分析結果を含むテーブルを待機
  const riskAssessmentTable = page.locator('[data-testid="risk-assessment-table"]');
  await riskAssessmentTable.waitFor({ state: 'visible' });

  // リスク分析テーブルのtbody要素を取得
  const tbody = page.locator('#risk-assessment-tbody');
  
  // 進捗乖離率が -5% の行を探す
  // 計画進捗率 50%、実績進捗率 45% の行を検索
  const rows = await tbody.locator('tr').all();
  
  let targetRow = null;
  for (const row of rows) {
    const cells = await row.locator('td').all();
    if (cells.length >= 4) {
      const plannedText = await cells[1].textContent();
      const actualText = await cells[2].textContent();
      
      // 計画進捗率が50%、実績進捗率が45%の行を特定
      if (plannedText?.includes('50%') && actualText?.includes('45%')) {
        targetRow = row;
        break;
      }
    }
  }

  expect(targetRow).not.toBeNull();

  // 当該行のリスクレベル表示エリアを確認
  // リスク分析テーブルの列構造に基づいて、リスクレベルセルを取得
  const cells = await targetRow!.locator('td').all();
  
  // リスクレベルはテーブルの「リスク」列に対応
  // セル構造: [拠点名, 計画進捗率, 実績進捗率, ばらつき度, リスク, 遅延日数]
  // リスク列は index 4
  const riskLevelCell = cells[4];
  const riskLevelText = await riskLevelCell.textContent();

  // リスクレベルが「低」と表示されることを確認
  expect(riskLevelText).toContain('低');

  // リスク警告アイコンが非表示、または警告インジケーターが最小状態のまま表示されることを確認
  // リスクレベルセル内の警告インジケーターを確認
  const warningIndicator = riskLevelCell.locator('[class*="icon"], [class*="indicator"], svg, [role="img"]').first();
  
  // 警告インジケーターが存在するかチェック
  const indicatorExists = await warningIndicator.count() > 0;
  
  if (indicatorExists) {
    // 警告インジケーターが存在する場合、最小状態（非表示またはスタイルで不可視化）であることを確認
    const isHidden = await warningIndicator.evaluate((element) => {
      const style = window.getComputedStyle(element);
      const isDisplayNone = style.display === 'none';
      const isVisibilityHidden = style.visibility === 'hidden';
      const isOpacityZero = parseFloat(style.opacity) === 0;
      const isAriaHidden = element.getAttribute('aria-hidden') === 'true';
      
      return isDisplayNone || isVisibilityHidden || isOpacityZero || isAriaHidden;
    });
    
    expect(isHidden).toBeTruthy();
  }
});