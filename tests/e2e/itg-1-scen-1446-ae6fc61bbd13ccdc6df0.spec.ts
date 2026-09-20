import { test, expect } from '@playwright/test';

test.describe('ダッシュボード表示（実績管理画面から）', () => {
  test('拠点の優先順位付けで、リスク度スコアが高リスク閾値を超える場合、推奨対応が「優先度変更または拠点間融通を検討」と判定される', async ({ page }) => {
    // 進捗・人員配置ダッシュボード画面にアクセス
    await page.goto('/panels/scr-1789461783315.html');
    
    // 画面が正常に読み込まれることを確認
    await expect(page.locator('[data-testid="kpi-risk-count"]')).toBeVisible();
    
    // ダッシュボード画面が読み込まれたことを確認
    const dashboardHeader = page.locator('text=進捗・人員配置ダッシュボード').first();
    await expect(dashboardHeader).toBeVisible();
    
    // リスク評価テーブルを確認（拠点Aの情報を含む）
    const riskAssessmentTable = page.locator('[data-testid="risk-assessment-table"]');
    await expect(riskAssessmentTable).toBeVisible();
    
    // リスク度スコアが85の拠点を検索（高リスク閾値70を超える）
    const tableBody = page.locator('#risk-assessment-tbody');
    const rows = tableBody.locator('tr');
    
    // 拠点Aのリスク情報を確認（完了数=60件、残数=200件、進捗率=23%、納期まで残り時間=8時間、リスク度スコア=85）
    let targetRowFound = false;
    const rowCount = await rows.count();
    
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const riskScoreText = await row.textContent();
      
      // リスク度スコア85を含む行を探す
      if (riskScoreText && riskScoreText.includes('85')) {
        targetRowFound = true;
        
        // 進捗情報を確認：完了数=60件、残数=200件、進捗率=23%、納期まで残り時間=8時間、リスク度スコア=85
        await expect(row).toContainText('60');
        await expect(row).toContainText('200');
        await expect(row).toContainText('23%');
        await expect(row).toContainText('8');
        await expect(row).toContainText('85');
        
        // 拠点Aの推奨対応欄を確認
        const cells = row.locator('td');
        const cellCount = await cells.count();
        
        // 各セルのテキストを確認して推奨対応を含むセルを特定
        let recommendedActionFound = false;
        for (let j = 0; j < cellCount; j++) {
          const cellText = await cells.nth(j).textContent();
          if (cellText && cellText.includes('優先度変更または拠点間融通を検討')) {
            recommendedActionFound = true;
            
            // リスク度スコア85と推奨対応が同じ行に存在することで
            // 高リスク閾値を超えたことと推奨対応の関連付けを検証
            const rowFullText = await row.textContent();
            expect(rowFullText).toContain('85');
            expect(rowFullText).toContain('優先度変更または拠点間融通を検討');
            
            break;
          }
        }
        
        expect(recommendedActionFound).toBe(true);
        break;
      }
    }
    
    // 対象の拠点が見つかったことを確認
    expect(targetRowFound).toBe(true);
  });
});