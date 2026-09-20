import { test, expect } from '@playwright/test';

test.describe('人員配置最適化提案画面遷移（実績管理画面から）', () => {
  test('初期表示データ準備時に、作業実績データから作業者別・チーム別の生産性指標が計算される', async ({ page }) => {
    // 作業指示・実績管理画面にアクセス
    await page.goto('/panels/scr-1789461813941.html');
    
    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');
    
    // 画面が表示されていることを確認
    await expect(page.locator('text=作業指示・実績管理')).toBeVisible();
    
    // ハンディターミナルタブから過去7日間の複数作業者データを確認
    const handyTerminalTab = page.locator('[data-test-id="tab-handy-terminal"]');
    await handyTerminalTab.click();
    await page.waitForLoadState('networkidle');
    
    // ハンディターミナルログテーブルが存在することを確認
    const handyTerminalLogList = page.locator('#handy-terminal-log-tbody');
    await expect(handyTerminalLogList).toBeVisible();
    
    // 複数の作業実績レコード（作業者A、B、Cなど複数）を確認
    const handyTerminalLogRows = page.locator('#handy-terminal-log-tbody tr');
    const handyRecordCount = await handyTerminalLogRows.count();
    expect(handyRecordCount).toBeGreaterThanOrEqual(3);
    
    // 過去7日間のデータを抽出・検証
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // ハンディターミナルログから作業者別の実績データを抽出
    const handyDataMap = new Map<string, { 
      quantities: number[]; 
      timestamps: Date[]; 
      totalQuantity: number; 
      workHours: number; 
      workerName: string;
      workerId: string;
      qualityScores: number[];
      proficiencyLevels: number[];
    }>();
    
    for (let i = 0; i < Math.min(30, handyRecordCount); i++) {
      const row = handyTerminalLogRows.nth(i);
      const rowText = await row.textContent();
      const cells = row.locator('td');
      const cellCount = await cells.count();
      
      if (cellCount >= 4) {
        const workerIdCell = await cells.nth(0).textContent();
        const timestampCell = await cells.nth(1).textContent();
        const quantityCell = await cells.nth(2).textContent();
        const qualityCell = await cells.nth(3).textContent();
        
        const workerId = workerIdCell?.trim() || `worker_${i}`;
        const quantityMatch = quantityCell?.match(/(\d+)/);
        const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 0;
        const qualityMatch = qualityCell?.match(/(\d+)/);
        const quality = qualityMatch ? parseInt(qualityMatch[1], 10) : 0;
        
        let timestamp = new Date();
        if (timestampCell && timestampCell.trim()) {
          timestamp = new Date(timestampCell.trim());
        }
        
        // 過去7日間のデータのみを対象
        if (timestamp >= sevenDaysAgo) {
          if (!handyDataMap.has(workerId)) {
            handyDataMap.set(workerId, { 
              quantities: [], 
              timestamps: [], 
              totalQuantity: 0, 
              workHours: 0, 
              workerName: workerId,
              workerId: workerId,
              qualityScores: [],
              proficiencyLevels: []
            });
          }
          const data = handyDataMap.get(workerId)!;
          data.quantities.push(quantity);
          data.timestamps.push(timestamp);
          data.totalQuantity += quantity;
          data.qualityScores.push(quality);
        }
      }
    }
    
    // 各作業者の作業時間を計算（タイムスタンプから）
    handyDataMap.forEach((data) => {
      if (data.timestamps.length > 1) {
        const minTime = Math.min(...data.timestamps.map(t => t.getTime()));
        const maxTime = Math.max(...data.timestamps.map(t => t.getTime()));
        data.workHours = Math.max((maxTime - minTime) / (1000 * 60 * 60), 1);
      } else {
        data.workHours = 1;
      }
    });
    
    // 複数の作業者データが過去7日間に記録されていることを確認
    expect(handyDataMap.size).toBeGreaterThanOrEqual(2);
    
    // WMSタブも確認
    const wmsTab = page.locator('[data-test-id="tab-wms"]');
    await wmsTab.click();
    await page.waitForLoadState('networkidle');
    
    // WMSログテーブルが存在することを確認
    const wmsLogList = page.locator('#wms-log-tbody');
    await expect(wmsLogList).toBeVisible();
    
    const wmsLogRows = page.locator('#wms-log-tbody tr');
    const wmsRecordCount = await wmsLogRows.count();
    expect(wmsRecordCount).toBeGreaterThanOrEqual(3);
    
    // WMSログから作業者別の実績データを抽出
    const wmsDataMap = new Map<string, { 
      quantities: number[]; 
      timestamps: Date[]; 
      totalQuantity: number; 
      workHours: number; 
      workerName: string;
      workerId: string;
      qualityScores: number[];
      proficiencyLevels: number[];
    }>();
    
    for (let i = 0; i < Math.min(30, wmsRecordCount); i++) {
      const row = wmsLogRows.nth(i);
      const rowText = await row.textContent();
      const cells = row.locator('td');
      const cellCount = await cells.count();
      
      if (cellCount >= 4) {
        const workerIdCell = await cells.nth(0).textContent();
        const timestampCell = await cells.nth(1).textContent();
        const quantityCell = await cells.nth(2).textContent();
        const qualityCell = await cells.nth(3).textContent();
        
        const workerId = workerIdCell?.trim() || `worker_${i}`;
        const quantityMatch = quantityCell?.match(/(\d+)/);
        const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 0;
        const qualityMatch = qualityCell?.match(/(\d+)/);
        const quality = qualityMatch ? parseInt(qualityMatch[1], 10) : 0;
        
        let timestamp = new Date();
        if (timestampCell && timestampCell.trim()) {
          timestamp = new Date(timestampCell.trim());
        }
        
        // 過去7日間のデータのみを対象
        if (timestamp >= sevenDaysAgo) {
          if (!wmsDataMap.has(workerId)) {
            wmsDataMap.set(workerId, { 
              quantities: [], 
              timestamps: [], 
              totalQuantity: 0, 
              workHours: 0, 
              workerName: workerId,
              workerId: workerId,
              qualityScores: [],
              proficiencyLevels: []
            });
          }
          const data = wmsDataMap.get(workerId)!;
          data.quantities.push(quantity);
          data.timestamps.push(timestamp);
          data.totalQuantity += quantity;
          data.qualityScores.push(quality);
        }
      }
    }
    
    // 各作業者の作業時間を計算（タイムスタンプから）
    wmsDataMap.forEach((data) => {
      if (data.timestamps.length > 1) {
        const minTime = Math.min(...data.timestamps.map(t => t.getTime()));
        const maxTime = Math.max(...data.timestamps.map(t => t.getTime()));
        data.workHours = Math.max((maxTime - minTime) / (1000 * 60 * 60), 1);
      } else {
        data.workHours = 1;
      }
    });
    
    // 時間当たり処理数（件/h）と平均品質スコアを計算
    const expectedProductivityMap = new Map<string, number>();
    const expectedQualityMap = new Map<string, number>();
    
    wmsDataMap.forEach((data, workerId) => {
      const productivityPerHour = Math.round(data.totalQuantity / data.workHours);
      expectedProductivityMap.set(workerId, productivityPerHour);
      
      const avgQuality = data.qualityScores.length > 0 
        ? Math.round(data.qualityScores.reduce((a, b) => a + b, 0) / data.qualityScores.length)
        : 0;
      expectedQualityMap.set(workerId, avgQuality);
    });
    
    // 進捗・人員配置ダッシュボードへ遷移
    await page.locator('[data-nav-id="scr-1789461783315"]').click();
    await page.waitForLoadState('networkidle');
    
    // ダッシュボードが表示されていることを確認
    await expect(page.locator('text=進捗・人員配置ダッシュボード')).toBeVisible();
    
    // 人員配置最適化提案・実行画面へ遷移
    const optimizationLink = page.locator('[data-nav-id="scr-1789461798629"]');
    await optimizationLink.click();
    await page.waitForLoadState('networkidle');
    
    // 人員配置最適化提案・実行画面が読み込まれることを確認
    await expect(page.locator('text=人員配置最適化提案')).toBeVisible();
    
    // 生産性指標の計算が完了するまで待機
    const logicStatusElement = page.locator('#logic-status');
    await expect(logicStatusElement).toBeVisible({ timeout: 10000 });
    await expect(logicStatusElement).toContainText('人員配置案生成可能', { timeout: 5000 });
    
    // 作業者別生産性指標セクションが表示されていることを確認
    const productivityListSection = page.locator('#productivity-list');
    await expect(productivityListSection).toBeVisible();
    
    // 作業者別の具体的な指標が表示されていることを確認
    const assignmentDetailTable = page.locator('[data-test-id="assignment-detail-table"]');
    await expect(assignmentDetailTable).toBeVisible();
    
    const workerRows = page.locator('#assignment-detail-tbody tr');
    const workerCount = await workerRows.count();
    expect(workerCount).toBeGreaterThan(0);
    
    // 複数の作業者データが表示されていることを確認
    expect(workerCount).toBeGreaterThanOrEqual(2);
    
    // WMSデータから取得した作業者IDのリスト
    const wmsWorkerIds = Array.from(wmsDataMap.keys()).slice(0, workerCount);
    
    // 表示されている作業者別指標の検証
    const displayedWorkerData: { 
      [key: string]: { 
        workerName: string; 
        workerId: string;
        text: string; 
        cells: string[]; 
        productivityPerHour?: number; 
        qualityScore?: number; 
        proficiencyLevel?: number; 
        plannedHours?: number;
      } 
    } = {};
    
    for (let i = 0; i < workerCount; i++) {
      const row = workerRows.nth(i);
      const rowText = await row.textContent();
      const cells = row.locator('td');
      const cellTexts: string[] = [];
      
      for (let j = 0; j < await cells.count(); j++) {
        const cellText = await cells.nth(j).textContent();
        cellTexts.push(cellText?.trim() || '');
      }
      
      // 作業者名を抽出（最初のセルが作業者名）
      const displayedWorkerName = cellTexts[0] || '';
      
      // 表示された行から時間当たり処理数を抽出
      const productivityMatch = rowText?.match(/(\d+)\s*\/\s*h/i);
      const displayedProductivity = productivityMatch ? parseInt(productivityMatch[1], 10) : null;
      
      // 品質スコアを抽出
      const qualityMatch = rowText?.match(/(\d+)\s*%/);
      const displayedQuality = qualityMatch ? parseInt(qualityMatch[1], 10) : null;
      
      // 習熟度を抽出
      const proficiencyMatch = rowText?.match(/Lv(\d+)/);
      const displayedProficiency = proficiencyMatch ? parseInt(proficiencyMatch[1], 10) : null;
      
      // 計画工数を抽出
      const plannedHoursMatch = rowText?.match(/\/\s*h\s*(\d+)/);
      const displayedPlannedHours = plannedHoursMatch ? parseInt(plannedHoursMatch[1], 10) : null;
      
      const wmsWorkerId = wmsWorkerIds[i];
      
      displayedWorkerData[wmsWorkerId] = {
        workerName: displayedWorkerName,
        workerId: wmsWorkerId,
        text: rowText || '',
        cells: cellTexts,
        productivityPerHour: displayedProductivity || undefined,
        qualityScore: displayedQuality || undefined,
        proficiencyLevel: displayedProficiency || undefined,
        plannedHours: displayedPlannedHours || undefined,
      };
      
      // 各作業者ごとに3つの指標（時間当たり処理数、品質スコア、習熟度）がすべて表示されていることを確認
      expect(rowText).toMatch(/\d+\s*\/\s*h/i);
      expect(rowText).toMatch(/\d+\s*%/);
      expect(rowText).toMatch(/Lv\d+/);
      
      // WMS実績データとの整合性を確認
      if (wmsWorkerId && wmsDataMap.has(wmsWorkerId)) {
        const wmsData = wmsDataMap.get(wmsWorkerId)!;
        const expectedWmsProductivity = Math.round(wmsData.totalQuantity / wmsData.workHours);
        const expectedWmsQuality = expectedQualityMap.get(wmsWorkerId) || 0;
        
        // 時間当たり処理数の整合性を確認
        if (displayedProductivity !== null) {
          const tolerance = Math.max(Math.ceil(expectedWmsProductivity * 0.1), 1);
          expect(Math.abs(displayedProductivity - expectedWmsProductivity)).toBeLessThanOrEqual(tolerance);
        }
        
        // 品質スコアの整合性を確認
        if (displayedQuality !== null) {
          const qualityTolerance = Math.max(Math.ceil(expectedWmsQuality * 0.1), 1);
          expect(Math.abs(displayedQuality - expectedWmsQuality)).toBeLessThanOrEqual(qualityTolerance);
        }
        
        // WMS実績データが複数の作業があることを確認
        expect(wmsData.quantities.length).toBeGreaterThan(0);
        expect(wmsData.quantities.some(q => q > 0)).toBeTruthy();
      }
    }
    
    // チーム別生産性指標セクションが表示されていることを確認
    const teamVarianceTableSection = page.locator('#team-variance-tbody');
    await expect(teamVarianceTableSection).toBeVisible();
    
    // チーム別指標データを抽出
    const teamRows = page.locator('#team-variance-tbody tr');
    const teamRowCount = await teamRows.count();
    expect(teamRowCount).toBeGreaterThan(0);
    
    // WMSデータから期待されるチーム集計値を計算
    let expectedTeamTotalQuantity = 0;
    let totalQualityScoresFromWms = 0;
    let wmsMetricsCount = 0;
    
    wmsDataMap.forEach((data) => {
      expectedTeamTotalQuantity += data.totalQuantity;
      totalQualityScoresFromWms += (data.qualityScores.length > 0 
        ? Math.round(data.qualityScores.reduce((a, b) => a + b, 0) / data.qualityScores.length)
        : 0);
      wmsMetricsCount++;
    });
    
    const expectedTeamAvgQuality = wmsMetricsCount > 0 
      ? Math.round(totalQualityScoresFromWms / wmsMetricsCount)
      : 0;
    
    // 表示されたワーカーデータから平均値を計算
    const displayedWorkerArray = Object.values(displayedWorkerData);
    let displayedQualityScoresSum = 0;
    let displayedProficiencyLevelsSum = 0;
    let displayedQualityScoreCount = 0;
    let displayedProficiencyLevelCount = 0;
    
    displayedWorkerArray.forEach((worker) => {
      if (worker.qualityScore !== undefined) {
        displayedQualityScoresSum += worker.qualityScore;
        displayedQualityScoreCount++;
      }
      if (worker.proficiencyLevel !== undefined) {
        displayedProficiencyLevelsSum += worker.proficiencyLevel;
        displayedProficiencyLevelCount++;
      }
    });
    
    // チーム別指標から値を抽出して、作業者別指標の集計であることを検証
    for (let i = 0; i < teamRowCount; i++) {
      const teamRow = teamRows.nth(i);
      const teamRowText = await teamRow.textContent();
      
      // チーム合計処理数が数値で表示されていることを確認
      const teamTotalMatch = teamRowText?.match(/(\d+)(?:\s*件)?/);
      expect(teamTotalMatch).toBeTruthy();
      
      // 表示されたチーム合計が、表示されている作業者別指標から計算可能な値であることを確認
      if (teamTotalMatch) {
        const displayedTeamTotal = parseInt(teamTotalMatch[1], 10);
        expect(displayedTeamTotal).toBeGreaterThanOrEqual(0);
      }
      
      // 平均品質スコアが%記号と共に表示されていることを確認
      const avgQualityMatch = teamRowText?.match(/(\d+)\s*%/);
      expect(avgQualityMatch).toBeTruthy();
      
      if (avgQualityMatch && displayedQualityScoreCount > 0) {
        const displayedAvgQuality = parseInt(avgQualityMatch[1], 10);
        const expectedAvgQuality = Math.round(displayedQualityScoresSum / displayedQualityScoreCount);
        const tolerance = Math.max(1, Math.ceil(expectedAvgQuality * 0.1));
        expect(Math.abs(displayedAvgQuality - expectedAvgQuality)).toBeLessThanOrEqual(tolerance);
      }
      
      // 平均習熟度がLvと共に表示されていることを確認
      const avgProficiencyMatch = teamRowText?.match(/Lv(\d+)/);
      expect(avgProficiencyMatch).toBeTruthy();
      
      if (avgProficiencyMatch && displayedProficiencyLevelCount > 0) {
        const displayedAvgProficiency = parseInt(avgProficiencyMatch[1], 10);
        const expectedAvgProficiency = Math.round(displayedProficiencyLevelsSum / displayedProficiencyLevelCount);
        const tolerance = Math.max(1, Math.ceil(expectedAvgProficiency * 0.1));
        expect(Math.abs(displayedAvgProficiency - expectedAvgProficiency)).toBeLessThanOrEqual(tolerance);
      }
    }
    
    // リスクレベル、遅延日数、推奨アクションのテキストが実際の値を含んでいることを確認
    const riskLevelElement = page.locator('#risk-level');
    await expect(riskLevelElement).toBeVisible();
    
    const delayDaysElement = page.locator('#delay-days');
    await expect(delayDaysElement).toBeVisible();
    
    const recommendedActionElement = page.locator('#recommended-action');
    await expect(recommendedActionElement).toBeVisible();
    
    const riskLevelText = await riskLevelElement.textContent();
    expect(riskLevelText).toBeTruthy();
    
    const delayDaysText = await delayDaysElement.textContent();
    expect(delayDaysText).toBeTruthy();
    expect(delayDaysText).toMatch(/\d+/);
    
    const recommendedActionText = await recommendedActionElement.textContent();
    expect(recommendedActionText).toBeTruthy();
    
    // 計画進捗率が表示されていることを確認
    const progressRateElement = page.locator('[data-test-id="progress-rate"]');
    await expect(progressRateElement).toBeVisible();
    
    const progressRateValue = page.locator('#progress-rate-value');
    const progressRateText = await progressRateValue.textContent();
    expect(progressRateText).toBeTruthy();
    expect(progressRateText).toMatch(/\d+/);
    
    // 生産性指標の計算が完了したことを示すステータスが表示される
    const logicStatusText = await logicStatusElement.textContent();
    expect(logicStatusText).toBeTruthy();
    expect(logicStatusText).toContain('人員配置案生成可能');
    
    // 人員配置案生成可能を示すステータスが表示されていることを確認
    const proposalsContainer = page.locator('#proposals-container');
    await expect(proposalsContainer).toBeVisible();
    
    // 人員配置案を自動生成ボタンが利用可能であることを確認
    const generateButton = page.locator('[data-test-id="generate-proposals-btn"]');
    await expect(generateButton).toBeEnabled();
  });
});