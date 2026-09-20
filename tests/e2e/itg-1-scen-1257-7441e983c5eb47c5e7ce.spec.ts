import { test, expect } from '@playwright/test';

test.describe('SCEN-1257: 進捗遅延リスク分析実行', () => {
  test('計画進捗を実績進捗が上回っている状態でリスク分析を実行すると、進捗乖離率が負の値として扱われ、リスクレベルが低として判定される', async ({ page }) => {
    // テスト環境にログイン
    await page.goto('/');
    
    // ログイン画面が表示されるまで待機
    await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 10000 }).catch(() => null);
    
    // ログイン操作（テスト用認証情報を入力・送信）
    const userInputs = await page.locator('input[type="text"], input[type="email"]').all();
    const passwordInput = page.locator('input[type="password"]');
    
    if (userInputs.length > 0) {
      await userInputs[0].fill('testuser');
    }
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('testpass');
    }
    
    // ログインボタンをクリック
    await page.click('button:has-text("ログイン"), .login-button');
    
    // 進捗・人員配置ダッシュボード画面に遷移するまで待機
    await page.waitForURL('**/panels/scr-1789461783315.html', { timeout: 15000 });
    await expect(page).toHaveURL(/.*scr-1789461783315\.html/);
    
    // ページが完全にロードされるまで待機
    await page.waitForLoadState('networkidle');
    
    // テストデータの準備：計画進捗率60%、実績進捗率75%をセットアップ
    // API経由でテストデータを挿入
    const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
    const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
    
    if (apiUrl && appId) {
      // サイト分散データテーブルにテストデータを投入
      await page.evaluate(async ({ apiUrl, appId }) => {
        const testData = {
          site_name: 'テスト拠点',
          planned_progress: 60,
          actual_progress: 75,
          variance: -15,
          status: '進行中'
        };
        
        try {
          await fetch(`${apiUrl}/api/site_variance?app=${appId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
          });
        } catch (e) {
          console.log('テストデータ投入スキップ', e);
        }
      }, { apiUrl, appId });
    }
    
    // ページをリロードして最新データを取得
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // サイト分散テーブルの確認
    const siteVarianceTable = page.locator('#site-variance-tbody');
    await siteVarianceTable.waitFor({ state: 'visible', timeout: 5000 });
    
    // テーブル内に計画進捗率60%、実績進捗率75%のデータが存在することを確認
    const siteVarianceRows = siteVarianceTable.locator('tr');
    const rowCount = await siteVarianceRows.count();
    expect(rowCount).toBeGreaterThan(0);
    
    let foundPlannedAndActualData = false;
    for (let i = 0; i < rowCount; i++) {
      const row = siteVarianceRows.nth(i);
      const cells = row.locator('td');
      const cellTexts = await cells.allTextContents();
      
      // 計画進捗率60%と実績進捗率75%が同じ行に存在することを確認
      const hasPlanned60 = cellTexts.some(text => text.trim() === '60%' || text.trim() === '60');
      const hasActual75 = cellTexts.some(text => text.trim() === '75%' || text.trim() === '75');
      
      if (hasPlanned60 && hasActual75) {
        foundPlannedAndActualData = true;
        break;
      }
    }
    
    expect(foundPlannedAndActualData).toBe(true);
    
    // ダッシュボード画面の『リスク分析実行』ボタンをクリック
    const optimizeButton = page.locator('[data-testid="optimize-button"]');
    await optimizeButton.click();
    
    // リスク分析処理が実行され、結果が表示されるまで待機
    await page.waitForLoadState('networkidle');
    
    // リスク評価テーブルが表示されるまで待機
    const riskAssessmentTable = page.locator('[data-testid="risk-assessment-table"]');
    await riskAssessmentTable.waitFor({ state: 'visible', timeout: 10000 });
    
    // リスク評価結果を取得
    const riskRows = page.locator('#risk-assessment-tbody tr');
    const riskRowCount = await riskRows.count();
    expect(riskRowCount).toBeGreaterThan(0);
    
    // 進捗乖離率が『-15%』でリスクレベルが『低』であることを確認
    let foundNegativeVarianceAndLowRisk = false;
    
    for (let i = 0; i < riskRowCount; i++) {
      const row = riskRows.nth(i);
      const cells = row.locator('td');
      const allCellTexts = await cells.allTextContents();
      
      // 進捗乖離率が『-15%』として表示されているか確認
      const hasNegativeVariance = allCellTexts.some(text => {
        const trimmed = text.trim();
        return trimmed === '-15%' || trimmed === '-15';
      });
      
      // リスクレベルが『低』として表示されているか確認
      const hasLowRiskLevel = allCellTexts.some(text => text.trim() === '低');
      
      if (hasNegativeVariance && hasLowRiskLevel) {
        foundNegativeVarianceAndLowRisk = true;
        break;
      }
    }
    
    expect(foundNegativeVarianceAndLowRisk).toBe(true);
    
    // 画面下部のリスク警告セクションを確認
    // リスクレベルが低い場合、警告が表示されないか、優先度が最小レベルで表示される
    const recommendedActions = page.locator('#recommended-actions');
    const recommendedActionsVisible = await recommendedActions.isVisible().catch(() => false);
    
    if (recommendedActionsVisible) {
      // 警告セクションが表示されている場合、その内容を確認
      const warningContent = await recommendedActions.textContent();
      
      // 低リスクの場合、高優先度警告（『高』『極高』『緊急』『重大』）がないことを確認
      const highPriorityKeywords = ['高', '極高', '緊急', '重大'];
      const hasHighPriorityWarning = highPriorityKeywords.some(keyword => 
        (warningContent || '').includes(keyword) && (warningContent || '').match(/警告|リスク|アクション/)
      );
      
      // 低リスクの場合、高優先度警告は表示されないこと、または最小レベルの警告のみ
      expect(hasHighPriorityWarning).toBeFalsy();
    }
    // 警告が表示されないという選択肢も期待される仕様なので、表示されていないことも有効
  });
});