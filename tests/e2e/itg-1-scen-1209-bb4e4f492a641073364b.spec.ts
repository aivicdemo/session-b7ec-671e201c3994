import { test, expect } from '@playwright/test';

test.describe('SCEN-1209: ダッシュボード表示 - 進捗乖離率が負の値の場合のリスクレベル判定', () => {
  test('進捗乖離率が負の値（-15%）の場合、リスクレベルが低に設定される', async ({ page, context }) => {
    // ステップ1: ログイン
    await page.goto('/');
    await page.waitForURL('**/login**', { timeout: 5000 }).catch(() => {});
    
    const loginForm = page.locator('form').first();
    const existsLoginForm = await loginForm.isVisible().catch(() => false);
    
    if (existsLoginForm) {
      await page.fill('input[type="text"]', 'testuser');
      await page.fill('input[type="password"]', 'password');
      await page.click('button:has-text("ログイン")');
      await page.waitForURL('**/scr-1789461783315**', { timeout: 10000 });
    }

    // ダッシュボード画面が読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // ステップ2-3: WmsHandyTerminalDataSourceの呼び出し窓口経由でfetchProgressDataを呼び出し、
    // テストデータ（計画進捗率50%、実績進捗率65%、乖離率-15%）をスタブから取得
    // 拠点・チーム・作業指示の3つのレベルでテストデータを準備
    const testProgressData = {
      sites: [
        {
          site_id: 'SITE-001',
          site_name: 'テスト拠点_負乖離',
          planned_progress: 50,
          actual_progress: 65,
          variance_rate: -15
        }
      ],
      teams: [
        {
          team_id: 'TEAM-001',
          team_name: 'テストチーム_負乖離',
          site_id: 'SITE-001',
          planned_progress: 50,
          actual_progress: 65,
          variance_rate: -15
        }
      ],
      instructions: [
        {
          instruction_id: 'INSTR-001',
          instruction_name: 'テスト作業指示_負乖離',
          site_id: 'SITE-001',
          team_id: 'TEAM-001',
          planned_progress: 50,
          actual_progress: 65,
          variance_rate: -15
        }
      ]
    };

    // WmsHandyTerminalDataSourceの呼び出し窓口経由でfetchProgressDataを呼び出し
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('progress') || url.includes('fetchProgressData') || url.includes('dashboard')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(testProgressData)
        });
      } else {
        route.continue();
      }
    });

    // ステップ4: ダッシュボード画面の更新/リロード
    await page.reload();
    await page.waitForLoadState('networkidle');

    // ステップ5-6: 拠点・チーム・作業指示の3つのレベルでリスクレベル表示を確認

    // 拠点レベルのリスク確認
    const siteVarianceTable = page.locator('#site-variance-tbody');
    await expect(siteVarianceTable).toBeVisible({ timeout: 5000 });

    const siteRows = page.locator('#site-variance-tbody tr');
    let siteLowRiskConfirmed = false;
    
    for (let i = 0; i < await siteRows.count(); i++) {
      const row = siteRows.nth(i);
      const rowText = await row.textContent();
      
      if (rowText && rowText.includes('50') && rowText.includes('65')) {
        const cells = row.locator('td');
        
        for (let j = 0; j < await cells.count(); j++) {
          const cell = cells.nth(j);
          const cellText = await cell.textContent();
          
          if (cellText && (cellText.trim() === '低' || cellText.trim() === 'Low')) {
            expect(cellText.trim()).toBe('低');
            
            const cellClass = await cell.getAttribute('class');
            const cellStyle = await cell.getAttribute('style');
            const parentClass = await row.getAttribute('class');
            const icon = cell.locator('svg, i, [class*="icon"]').first();
            const iconExists = await icon.isVisible().catch(() => false);
            
            const hasLowRiskClass = 
              (cellClass && (cellClass.includes('low') || cellClass.includes('success') || cellClass.includes('green'))) ||
              (parentClass && (parentClass.includes('low') || parentClass.includes('success') || parentClass.includes('green')));
            
            const hasLowRiskStyle = 
              cellStyle && (cellStyle.includes('green') || cellStyle.includes('#22c55e') || cellStyle.includes('rgba(34, 197, 94'));
            
            expect(hasLowRiskClass || hasLowRiskStyle || iconExists).toBeTruthy();
            siteLowRiskConfirmed = true;
            break;
          }
        }
        if (siteLowRiskConfirmed) break;
      }
    }
    
    expect(siteLowRiskConfirmed).toBeTruthy();

    // チームレベルのリスク確認
    const teamVarianceTable = page.locator('#team-variance-tbody');
    await expect(teamVarianceTable).toBeVisible({ timeout: 5000 });

    const teamRows = page.locator('#team-variance-tbody tr');
    let teamLowRiskConfirmed = false;
    
    for (let i = 0; i < await teamRows.count(); i++) {
      const row = teamRows.nth(i);
      const rowText = await row.textContent();
      
      if (rowText && rowText.includes('50') && rowText.includes('65')) {
        const cells = row.locator('td');
        
        for (let j = 0; j < await cells.count(); j++) {
          const cell = cells.nth(j);
          const cellText = await cell.textContent();
          
          if (cellText && (cellText.trim() === '低' || cellText.trim() === 'Low')) {
            expect(cellText.trim()).toBe('低');
            
            const cellClass = await cell.getAttribute('class');
            const cellStyle = await cell.getAttribute('style');
            const parentClass = await row.getAttribute('class');
            const icon = cell.locator('svg, i, [class*="icon"]').first();
            const iconExists = await icon.isVisible().catch(() => false);
            
            const hasLowRiskClass = 
              (cellClass && (cellClass.includes('low') || cellClass.includes('success') || cellClass.includes('green'))) ||
              (parentClass && (parentClass.includes('low') || parentClass.includes('success') || parentClass.includes('green')));
            
            const hasLowRiskStyle = 
              cellStyle && (cellStyle.includes('green') || cellStyle.includes('#22c55e') || cellStyle.includes('rgba(34, 197, 94'));
            
            expect(hasLowRiskClass || hasLowRiskStyle || iconExists).toBeTruthy();
            teamLowRiskConfirmed = true;
            break;
          }
        }
        if (teamLowRiskConfirmed) break;
      }
    }
    
    expect(teamLowRiskConfirmed).toBeTruthy();

    // 作業指示レベルのリスク確認
    const riskAssessmentTable = page.locator('#risk-assessment-tbody');
    await expect(riskAssessmentTable).toBeVisible({ timeout: 5000 });

    const instructionRows = page.locator('#risk-assessment-tbody tr');
    let instructionLowRiskConfirmed = false;
    
    for (let i = 0; i < await instructionRows.count(); i++) {
      const row = instructionRows.nth(i);
      const rowText = await row.textContent();
      
      if (rowText && rowText.includes('50') && rowText.includes('65')) {
        const cells = row.locator('td');
        
        for (let j = 0; j < await cells.count(); j++) {
          const cell = cells.nth(j);
          const cellText = await cell.textContent();
          
          if (cellText && (cellText.trim() === '低' || cellText.trim() === 'Low')) {
            expect(cellText.trim()).toBe('低');
            
            const cellClass = await cell.getAttribute('class');
            const cellStyle = await cell.getAttribute('style');
            const parentClass = await row.getAttribute('class');
            const icon = cell.locator('svg, i, [class*="icon"]').first();
            const iconExists = await icon.isVisible().catch(() => false);
            
            const hasLowRiskClass = 
              (cellClass && (cellClass.includes('low') || cellClass.includes('success') || cellClass.includes('green'))) ||
              (parentClass && (parentClass.includes('low') || parentClass.includes('success') || parentClass.includes('green')));
            
            const hasLowRiskStyle = 
              cellStyle && (cellStyle.includes('green') || cellStyle.includes('#22c55e') || cellStyle.includes('rgba(34, 197, 94'));
            
            expect(hasLowRiskClass || hasLowRiskStyle || iconExists).toBeTruthy();
            instructionLowRiskConfirmed = true;
            break;
          }
        }
        if (instructionLowRiskConfirmed) break;
      }
    }
    
    expect(instructionLowRiskConfirmed).toBeTruthy();
  });
});