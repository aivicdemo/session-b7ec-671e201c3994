import { test, expect } from '@playwright/test';

test.describe('SCEN-1389: 人員配置案配信 - 配置案に含まれる全作業者の現在の稼働状況・習熟度情報取得と作業難度調整適用可能性確認', () => {
  test('配置案に含まれる全作業者の稼働状況・習熟度情報が表示され、作業難度調整の適用可能性が確認される', async ({ page }) => {
    // ログイン処理
    await page.goto('/');
    await page.waitForURL('**/panels/scr-1789461783315.html');
    
    // 人員配置最適化提案・実行画面へ遷移
    await page.click('a[href*="scr-1789461798629"]');
    await page.waitForURL('**/panels/scr-1789461798629.html');
    
    // 配置案が生成可能な状態であることを確認
    const generateProposalsBtn = page.locator('[data-testid="generate-proposals-btn"]');
    await expect(generateProposalsBtn).toBeEnabled();
    
    // 「配置案を生成」ボタンをクリック
    await generateProposalsBtn.click();
    
    // 配置案の生成処理が完了し、詳細が表示されるまで待機
    await page.waitForSelector('[data-testid="assignment-detail-table"]', { state: 'visible' });
    const proposalContainer = page.locator('#proposal-detail-container');
    await expect(proposalContainer).toBeVisible();
    
    // 配置案に含まれる全作業者の情報を取得
    const assignmentRows = page.locator('#assignment-detail-tbody tr');
    const rowCount = await assignmentRows.count();
    
    // 配置案に3名の作業者が含まれていることを確認
    expect(rowCount).toBe(3);
    
    // 現在時刻を記録（タイムスタンプ検証用）
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    // 各作業者の情報を詳細に検証
    for (let i = 0; i < rowCount; i++) {
      const row = assignmentRows.nth(i);
      const cells = row.locator('td');
      const cellCount = await cells.count();
      
      expect(cellCount).toBeGreaterThan(0);
      
      // 各セルのテキストを配列で取得
      const cellTexts: string[] = [];
      for (let j = 0; j < cellCount; j++) {
        const text = await cells.nth(j).textContent();
        cellTexts.push(text || '');
      }
      
      const rowContent = cellTexts.join(' ');
      
      // 作業者ID が表示されていることを確認
      expect(rowContent).toBeTruthy();
      
      // 習熟度スコア（Lv形式で表示）が含まれていることを確認
      const proficiencyMatch = rowContent.match(/Lv\d+/);
      expect(proficiencyMatch).not.toBeNull();
      
      // 習熟度情報の検証：習熟度スコア、時間当たり処理数、品質スコアが数値で表示されていることを確認
      // 習熟度スコア（Lv形式）
      const proficiencyScore = rowContent.match(/Lv(\d+)/);
      expect(proficiencyScore).not.toBeNull();
      expect(proficiencyScore![1]).toBeTruthy();
      
      // 行内のすべての数値を抽出（習熟度スコア、時間当たり処理数、品質スコアの検証）
      const allNumbers = rowContent.match(/\d+(?:\.\d+)?/g);
      expect(allNumbers).not.toBeNull();
      expect(allNumbers!.length).toBeGreaterThanOrEqual(5); // 習熟度スコア、時間当たり処理数、品質スコア、進捗率、残り作業時間を含む
      
      // 各セルから現在の稼働状況（作業指示ID、進捗率、残り作業時間推定値）が表示されていることを確認
      let workInstructionIdFound = false;
      let progressRateFound = false;
      let remainingTimeFound = false;
      let timestampValid = false;
      
      for (const cellText of cellTexts) {
        // 作業指示ID（数値形式の識別子）
        if (cellText && cellText.match(/^\d+$/) && !cellText.match(/^[01]$/)) {
          workInstructionIdFound = true;
        }
        
        // 進捗率（パーセンテージまたは小数形式）
        if (cellText && cellText.match(/\d+(?:\.\d+)?%/)) {
          progressRateFound = true;
        }
        
        // 残り作業時間推定値（数値で表示、h単位が付きうる）
        if (cellText && cellText.match(/\d+(?:\.\d+)?h/)) {
          remainingTimeFound = true;
        }
        
        // タイムスタンプの検証（ISO形式またはJST形式）
        if (cellText) {
          const dateMatch = cellText.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}|\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}:\d{2})/);
          if (dateMatch) {
            const cellDate = new Date(dateMatch[1]);
            if (cellDate >= fiveMinutesAgo && cellDate <= now) {
              timestampValid = true;
            }
          }
        }
      }
      
      // 現在の稼働状況の3つ全ての情報（作業指示ID、進捗率、残り作業時間推定値）が表示されていることを確認
      expect(workInstructionIdFound).toBe(true);
      expect(progressRateFound).toBe(true);
      expect(remainingTimeFound).toBe(true);
      
      // タイムスタンプが現在時刻より5分以内であることを確認
      expect(timestampValid).toBe(true);
      
      // 作業難度調整の適用可能性ステータスが「適用可」または「適用不可」として表示されていることを確認
      const hasApplicableStatus = rowContent.includes('適用可') || rowContent.includes('適用不可');
      expect(hasApplicableStatus).toBe(true);
    }
    
    // 配置案詳細テーブルが表示されていることを確認
    const detailTable = page.locator('[data-testid="assignment-detail-table"]');
    await expect(detailTable).toBeVisible();
    
    // 配置案詳細テーブルに推奨時間と配置人数情報が表示されていることを確認
    const containerText = await proposalContainer.textContent();
    expect(containerText).toMatch(/\d+h/);
    expect(containerText).toMatch(/\d+名/);
  });
});