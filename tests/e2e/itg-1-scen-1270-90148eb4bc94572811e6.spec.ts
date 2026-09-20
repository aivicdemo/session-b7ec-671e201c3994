import { test, expect } from '@playwright/test';

test.describe('進捗遅延リスク分析実行', () => {
  test('配置人員数がゼロの拠点をリスク分析しようとすると、「配置人員がいない拠点は評価できません」というエラーが表示される', async ({ page }) => {
    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    
    // ページが読み込まれるのを待つ
    await page.waitForLoadState('networkidle');
    
    // 拠点フィルターを確認
    const siteFilter = page.getByTestId('site-filter');
    await expect(siteFilter).toBeVisible();
    
    // サイト分散テーブルを確認し、配置人員数がゼロの拠点を特定
    const siteVarianceTable = page.locator('#site-variance-tbody');
    const rows = siteVarianceTable.locator('tr');
    const rowCount = await rows.count();
    
    let zeroStaffSiteFound = false;
    let selectedSiteRow = null;
    
    // テーブルの各行を確認して配置人員数がゼロの拠点を探す
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = row.locator('td');
      const cellCount = await cells.count();
      
      if (cellCount > 0) {
        // 拠点名と配置人員数を抽出
        const rowText = await row.textContent();
        
        // 配置人員数がゼロの情報を確認
        // テーブル構造から配置人員数がゼロであることを判定
        const staffMatch = rowText?.match(/(\\d+)名/);
        const staffCount = staffMatch ? parseInt(staffMatch[1]) : 0;
        
        if (staffCount === 0) {
          zeroStaffSiteFound = true;
          selectedSiteRow = row;
          break;
        }
      }
    }
    
    // 配置人員がゼロの拠点が見つかったことを確認
    expect(zeroStaffSiteFound).toBeTruthy();
    expect(selectedSiteRow).toBeTruthy();
    
    // その拠点を選択
    await selectedSiteRow.click();
    await page.waitForTimeout(500);
    
    // 画面上の「進捗遅延リスク分析」ボタンをクリック
    const riskAnalysisButton = page.getByRole('button', { name: /進捗遅延リスク分析|リスク分析/ });
    await expect(riskAnalysisButton).toBeVisible();
    await riskAnalysisButton.click();
    
    await page.waitForTimeout(500);
    
    // リスク分析の実行を確認するダイアログが表示される場合、「実行」を選択
    const dialogOverlay = page.locator('[class*="modal-overlay"]').first();
    const dialogExists = await dialogOverlay.isVisible().catch(() => false);
    
    if (dialogExists) {
      const executeButton = dialogOverlay.locator('button:has-text("実行"), button:has-text("確認")').first();
      const executeButtonExists = await executeButton.isVisible().catch(() => false);
      
      if (executeButtonExists) {
        await executeButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // エラーメッセージが表示されるのを待つ
    const errorMessage = page.locator('text=配置人員がいない拠点は評価できません');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    // ダッシュボード画面が遷移していないことを確認
    expect(page.url()).toContain('/panels/scr-1789461783315.html');
    
    // エラーメッセージが消去ボタンまたはタイムアウトにより消える
    // 消去ボタンがあるか確認
    const errorBanner = page.locator('text=配置人員がいない拠点は評価できません').first();
    const closeButton = errorBanner.locator('button').first();
    const closeButtonExists = await closeButton.isVisible().catch(() => false);
    
    if (closeButtonExists) {
      // 消去ボタンがある場合、クリック
      await closeButton.click();
      await expect(errorMessage).not.toBeVisible({ timeout: 5000 });
    } else {
      // 消去ボタンがない場合、自動消去を待つ（5～10秒）
      await expect(errorMessage).not.toBeVisible({ timeout: 10000 });
    }
  });
});