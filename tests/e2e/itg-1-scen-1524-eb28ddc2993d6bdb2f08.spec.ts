import { test, expect } from '@playwright/test';

test('WMS連携ログ表示 - 異常値レコードが統計から除外される', async ({ page }) => {
  // 作業指示・実績管理画面を開く
  await page.goto('/panels/scr-1789461813941.html');
  
  // WMS連携ログの表示領域に遷移する
  const wmsTab = page.getByTestId('tab-wms');
  await wmsTab.click();
  
  // WMS連携ログの一覧表示が完了するまで待機する
  const wmsLogList = page.locator('#wms-log-tbody');
  await wmsLogList.waitFor({ state: 'visible' });
  
  // テーブル行が読み込まれるまで待機
  await page.waitForLoadState('networkidle');
  
  test.step('一覧に表示されているWMS連携ログレコードの総件数をカウント', async () => {
    const rows = await page.locator('#wms-log-tbody tr').count();
    expect(rows).toBe(3);
  });
  
  test.step('各レコードの連携開始日時・連携完了日時の値を確認', async () => {
    const rows = page.locator('#wms-log-tbody tr');
    const recordCount = await rows.count();
    
    // 表示されている3件すべてが正常な日時値を持つことを確認
    const displayedRecords: { startTime: Date; completeTime: Date }[] = [];
    const now = new Date();
    
    for (let i = 0; i < recordCount; i++) {
      const row = rows.nth(i);
      const cells = row.locator('td');
      const cellCount = await cells.count();
      
      if (cellCount >= 2) {
        const startDateTimeText = await cells.nth(cellCount - 2).textContent();
        const completeDateTimeText = await cells.nth(cellCount - 1).textContent();
        
        // 各レコードが有効な日時値を持つことを確認
        expect(startDateTimeText).toBeTruthy();
        expect(completeDateTimeText).toBeTruthy();
        
        const startTime = new Date(startDateTimeText!);
        const completeTime = new Date(completeDateTimeText!);
        
        // 連携開始日時が連携完了日時より前または同時刻であることを確認
        expect(startTime.getTime()).toBeLessThanOrEqual(completeTime.getTime());
        
        // 連携開始日時が現在時刻以前であることを確認（未来日時ではない）
        expect(startTime.getTime()).toBeLessThanOrEqual(now.getTime());
        
        // 連携完了日時が現在時刻以前であることを確認（過去日時）
        expect(completeTime.getTime()).toBeLessThanOrEqual(now.getTime());
        
        displayedRecords.push({ startTime, completeTime });
      }
    }
    
    // 表示されているのは3件（異常値レコード1件は除外されている）
    expect(recordCount).toBe(3);
    expect(displayedRecords.length).toBe(3);
  });
  
  test.step('統計情報エリアの数値を確認', async () => {
    const rows = page.locator('#wms-log-tbody tr');
    const displayedRecordCount = await rows.count();
    expect(displayedRecordCount).toBe(3);
    
    // 表示されている3件の連携時間を計算
    const validTimeDifferences: number[] = [];
    
    for (let i = 0; i < displayedRecordCount; i++) {
      const row = rows.nth(i);
      const cells = row.locator('td');
      const cellCount = await cells.count();
      
      if (cellCount >= 2) {
        const startDateTime = await cells.nth(cellCount - 2).textContent();
        const completeDateTime = await cells.nth(cellCount - 1).textContent();
        
        const startTime = new Date(startDateTime!).getTime();
        const completeTime = new Date(completeDateTime!).getTime();
        const timeDiff = completeTime - startTime;
        
        expect(timeDiff).toBeGreaterThanOrEqual(0);
        validTimeDifferences.push(timeDiff);
      }
    }
    
    expect(validTimeDifferences.length).toBe(3);
    
    // 統計情報エリア内に表示される数値を確認
    const wmsLogContent = page.locator('#tab-wms-content');
    const contentText = await wmsLogContent.textContent() || '';
    expect(contentText).toBeTruthy();
    
    // 合計連携件数が3件であることを確認（統計情報エリアに明示的に表示）
    const statsAreaElement = wmsLogContent.locator('[data-stat-total-count], .stat-total, [class*="stat"], [class*="total"]').first();
    const statsVisible = await statsAreaElement.isVisible().catch(() => false);
    
    if (statsVisible) {
      const statsText = await statsAreaElement.textContent() || '';
      expect(statsText).toContain('3');
    } else {
      // 統計情報が表示テキストに含まれることを確認
      expect(contentText).toMatch(/合計.*3|3.*件|連携件数.*3/);
    }
    
    // 平均連携時間が画面上に表示されていることを確認
    const avgTime = validTimeDifferences.reduce((a, b) => a + b, 0) / validTimeDifferences.length;
    expect(avgTime).toBeGreaterThanOrEqual(0);
    
    // 平均時間が統計情報に表示されていることを確認
    const avgElement = wmsLogContent.locator('[data-stat-avg-time], .stat-average, [class*="avg"]').first();
    const avgVisible = await avgElement.isVisible().catch(() => false);
    
    if (avgVisible) {
      const avgText = await avgElement.textContent() || '';
      expect(avgText.length).toBeGreaterThan(0);
    } else {
      // 平均連携時間に関する情報が含まれることを確認
      expect(contentText).toMatch(/平均.*時間|平均連携|連携時間/);
    }
    
    // 表示されているレコード数から、計算対象が正常値3件分であることを確認
    expect(validTimeDifferences.length).toBe(3);
  });
  
  test.step('異常値レコード1件が実際に除外されていることを確認', async () => {
    // 表示されているのは3件のみであることを再確認
    const displayedRows = await page.locator('#wms-log-tbody tr').count();
    expect(displayedRows).toBe(3);
    
    // API経由でテーブルから全レコード数を確認
    const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
    const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
    
    if (apiUrl && appId) {
      // WMS関連のテーブルを検索
      const tableList = await page.evaluate(() => {
        const tbl = (window as any).AIVIC_TABLES;
        return typeof tbl === 'object' ? Object.values(tbl).flat() : [];
      });
      
      const wmsTableId = tableList.find((id: any) => 
        typeof id === 'string' && id.toLowerCase().includes('wms')
      );
      
      if (wmsTableId) {
        const response = await page.request.get(`${apiUrl}/api/${wmsTableId}?app=${appId}`);
        
        if (response.ok()) {
          const data = await response.json();
          const allRecords = Array.isArray(data) ? data : data.records || [];
          
          // 全レコードから異常値を特定
          const now = new Date();
          let abnormalCount = 0;
          
          allRecords.forEach((record: any) => {
            const startDateTime = record.startDateTime || record.start_datetime || record.開始日時 || record.連携開始日時;
            const completeDateTime = record.completeDateTime || record.complete_datetime || record.完了日時 || record.連携完了日時;
            
            if (startDateTime && completeDateTime) {
              const startTime = new Date(startDateTime);
              const completeTime = new Date(completeDateTime);
              
              // 異常値：連携開始日時が未来日時である場合
              const isStartTimeInFuture = startTime > now;
              
              // 異常値：連携完了日時が連携開始日時より前の場合（時系列が逆転している）
              const isCompleteTimeBeforeStartTime = completeTime < startTime;
              
              if (isStartTimeInFuture || isCompleteTimeBeforeStartTime) {
                abnormalCount++;
              }
            }
          });
          
          // 全体から異常値を除くと3件になることを確認
          const normalRecordCount = allRecords.length - abnormalCount;
          expect(normalRecordCount).toBe(3);
          expect(abnormalCount).toBe(1);
        }
      }
    }
  });
});