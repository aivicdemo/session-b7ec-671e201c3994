import { test, expect } from '@playwright/test';

test.describe('SCEN-1437: ダッシュボード表示（実績管理画面から）', () => {
  test('納期遅延リスク判定時に、進捗乖離率が負の値の場合、計画を上回る進捗として判定され、リスクレベルが「低」に設定される', async ({ page }) => {
    // 作業指示・実績管理画面にアクセス
    await page.goto('/panels/scr-1789461813941.html');
    await page.waitForLoadState('networkidle');

    // テスト用のチーム（拠点A・チームB）を選択する
    // ワーカーサマリーリストから拠点A・チームBを選択
    const workerSummaryList = page.locator('#worker-summary-list');
    await expect(workerSummaryList).toBeVisible();
    
    // 拠点A・チームBの行を検索して選択
    const teamRow = page.locator('#worker-summary-list').locator('tr').filter({ hasText: /拠点A/ }).filter({ hasText: /チームB/ }).first();
    await teamRow.click();
    await page.waitForLoadState('networkidle');

    // WMS連携ログタブを開く
    const wmsTab = page.locator('[data-testid="tab-wms"]');
    await wmsTab.click();
    await page.waitForLoadState('networkidle');

    // WMS連携ログから最新進捗データを確認
    const wmsLogTable = page.locator('#wms-log-tbody');
    await expect(wmsLogTable).toBeVisible();
    
    const wmsLogs = wmsLogTable.locator('tr');
    const logCount = await wmsLogs.count();
    
    let foundExpectedData = false;
    let plannedProgressRate = '';
    let actualProgressRate = '';
    let progressVariance = '';
    
    if (logCount > 0) {
      // 最新のWMSログエントリを取得
      const latestLog = wmsLogs.last();
      const cells = latestLog.locator('td');
      const cellCount = await cells.count();
      
      // テーブルのヘッダーを確認してカラムインデックスを特定
      const headerRow = page.locator('#wms-log-tbody').locator('tr').first();
      const headerCells = headerRow.locator('th, td');
      const headerCount = await headerCells.count();
      
      let plannedProgressIndex = -1;
      let actualProgressIndex = -1;
      let varianceIndex = -1;
      
      // ヘッダーから各列のインデックスを特定
      for (let i = 0; i < headerCount; i++) {
        const headerText = await headerCells.nth(i).textContent();
        const normalizedText = headerText?.trim().toLowerCase() || '';
        
        if (normalizedText.includes('計画') && normalizedText.includes('進捗')) {
          plannedProgressIndex = i;
        } else if (normalizedText.includes('実績') && normalizedText.includes('進捗')) {
          actualProgressIndex = i;
        } else if (normalizedText.includes('乖離') || normalizedText.includes('ばらつき') || normalizedText.includes('差')) {
          varianceIndex = i;
        }
      }
      
      // ヘッダーが明確でない場合は、データから推定
      if (plannedProgressIndex === -1 || actualProgressIndex === -1 || varianceIndex === -1) {
        // 全セルテキストを取得してパターンマッチング
        const allCellTexts: string[] = [];
        for (let i = 0; i < cellCount; i++) {
          const cell = cells.nth(i);
          const cellText = await cell.textContent();
          allCellTexts.push(cellText?.trim() || '');
        }
        
        // 計画進捗率 80%、実績進捗率 85%、進捗乖離率 -5% が順序で存在することを確認
        let index80 = -1;
        let index85 = -1;
        let indexNegative5 = -1;
        
        for (let i = 0; i < allCellTexts.length; i++) {
          const text = allCellTexts[i];
          if (text.includes('80')) {
            index80 = i;
          }
          if (text.includes('85') && index80 !== -1) {
            index85 = i;
          }
          if ((text.includes('-5') || text.includes('−5')) && index85 !== -1) {
            indexNegative5 = i;
          }
        }
        
        if (index80 !== -1 && index85 !== -1 && indexNegative5 !== -1) {
          plannedProgressRate = allCellTexts[index80];
          actualProgressRate = allCellTexts[index85];
          progressVariance = allCellTexts[indexNegative5];
          foundExpectedData = true;
        }
      } else {
        // ヘッダーから特定したインデックスを使用
        plannedProgressRate = await cells.nth(plannedProgressIndex).textContent() || '';
        actualProgressRate = await cells.nth(actualProgressIndex).textContent() || '';
        progressVariance = await cells.nth(varianceIndex).textContent() || '';
        
        foundExpectedData = 
          plannedProgressRate.includes('80') &&
          actualProgressRate.includes('85') &&
          (progressVariance.includes('-5') || progressVariance.includes('−5'));
      }
    }
    
    // 仕様で要求される計画進捗率 80%、実績進捗率 85%、進捗乖離率 -5% のデータが確認できたことを検証
    expect(foundExpectedData).toBeTruthy();
    expect(plannedProgressRate).toContain('80');
    expect(actualProgressRate).toContain('85');
    expect(progressVariance).toMatch(/[-−]5/);

    // 進捗・人員配置ダッシュボード（scr-1789461783315）に遷移
    const dashboardNav = page.locator('nav').locator('text=進捗・人員配置ダッシュボード').first();
    if (await dashboardNav.isVisible().catch(() => false)) {
      await dashboardNav.click();
    } else {
      // ナビゲーション内から選択
      await page.locator('text=進捗・人員配置ダッシュボード').first().click();
    }
    await page.waitForLoadState('networkidle');

    // ダッシュボード上のリスク表示領域を確認
    const riskAssessmentTable = page.locator('#risk-assessment-tbody');
    await expect(riskAssessmentTable).toBeVisible();

    // 拠点A・チームBのリスク行を特定
    const riskRows = riskAssessmentTable.locator('tr');
    let targetRow = null;
    
    for (let i = 0; i < await riskRows.count(); i++) {
      const row = riskRows.nth(i);
      const rowText = await row.textContent();
      
      // 拠点AとチームBの両方を含む行を特定
      if (rowText?.includes('拠点A') && rowText?.includes('チームB')) {
        targetRow = row;
        break;
      }
    }
    
    expect(targetRow).toBeTruthy();

    // 対象行から進捗乖離率とリスクレベルを同時に確認
    const riskCells = targetRow!.locator('td');
    const cellCount = await riskCells.count();
    
    // 行内のすべてのセルテキストを取得
    const rowCellTexts: string[] = [];
    for (let i = 0; i < cellCount; i++) {
      const cell = riskCells.nth(i);
      const cellText = await cell.textContent();
      rowCellTexts.push(cellText?.trim() || '');
    }

    // 進捗乖離率が-5%であることを確認
    const hasNegativeVariance = rowCellTexts.some(text => text.includes('-5') || text.includes('−5'));
    expect(hasNegativeVariance).toBeTruthy();

    // リスクレベル「低」を表示する要素を特定
    let riskLevelLocator = null;
    for (let i = 0; i < cellCount; i++) {
      const cell = riskCells.nth(i);
      const cellText = await cell.textContent();
      if (cellText?.includes('低') || cellText?.includes('中') || cellText?.includes('高') || cellText?.includes('極高')) {
        riskLevelLocator = cell;
        break;
      }
    }
    
    expect(riskLevelLocator).toBeTruthy();
    
    // Locatorで取得した要素が画面上に視認できる状態であることを確認
    await expect(riskLevelLocator).toBeVisible();
    
    // リスクレベルが「低」として画面上に視認できることを確認
    const riskLevelText = await riskLevelLocator!.textContent();
    const trimmedRiskText = riskLevelText?.trim() || '';
    
    // テキスト内容で「低」が含まれることを確認
    expect(trimmedRiskText).toContain('低');

    // ダッシュボード行に拠点A・チームBが含まれ、進捗乖離率-5%が反映されていることで、データが同じものであることを保証
    const rowContent = rowCellTexts.join(' ');
    expect(rowContent).toContain('拠点A');
    expect(rowContent).toContain('チームB');
    expect(rowContent).toMatch(/[-−]5/);
  });
});