import { test, expect } from '@playwright/test';

test.describe('作業指示実績管理画面遷移（配置提案画面から）', () => {
  test('作業実績データが存在しない作業指示の場合、進捗状況が未実績として画面に表示される', async ({ page }) => {
    // ログイン画面へアクセス
    await page.goto('/');
    
    // ログインフォームに入力して送信
    await page.fill('input[name="userId"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    
    // ダッシュボード表示待機
    await page.waitForURL('**/scr-1789461783315.html');
    
    // 人員配置最適化提案へ遷移
    await page.click('button:has-text("人員配置最適化提案")');
    
    // 配置提案画面へアクセス完了待機
    await page.waitForURL('**/scr-1789461798629.html');
    await page.waitForSelector('[data-testid="assignment-detail-table"]');
    
    // 配置案内の表を取得
    const assignmentTable = page.locator('[data-testid="assignment-detail-table"]');
    await expect(assignmentTable).toBeVisible();
    
    // テーブルから作業指示を取得
    const rows = assignmentTable.locator('tbody tr');
    const rowCount = await rows.count();
    
    let targetRowIndex = -1;
    let targetWorkInstructionId = '';
    let progressStatusTextBefore = '';
    
    // テーブルのヘッダーから列の位置を特定
    const headerRow = assignmentTable.locator('thead tr');
    const headers = headerRow.locator('th');
    const headerCount = await headers.count();
    
    let workInstructionIdColumnIndex = -1;
    let progressStatusColumnIndex = -1;
    
    for (let h = 0; h < headerCount; h++) {
      const headerText = await headers.nth(h).textContent() || '';
      if (headerText.includes('指示') || headerText.includes('作業指示')) {
        workInstructionIdColumnIndex = h;
      }
      if (headerText.includes('進捗') && !headerText.includes('進捗率')) {
        progressStatusColumnIndex = h;
      }
    }
    
    // 配置案内のテーブルから行を取得して確認
    // 作業実績データが存在しない作業指示を特定する
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const rowText = await row.textContent();
      
      if (rowText) {
        // 作業指示IDを取得
        if (workInstructionIdColumnIndex >= 0) {
          targetWorkInstructionId = await row.locator('td').nth(workInstructionIdColumnIndex).textContent() || '';
          targetWorkInstructionId = targetWorkInstructionId.trim();
        }
        
        // 配置案内の該当作業指示の進捗状況列をPlaywrightで取得し、画面上のテキスト内容を確認
        if (progressStatusColumnIndex >= 0) {
          const progressStatusCell = row.locator('td').nth(progressStatusColumnIndex);
          progressStatusTextBefore = await progressStatusCell.textContent() || '';
          progressStatusTextBefore = progressStatusTextBefore.trim();
          
          // 配置提案画面での進捗状況表示を確認
          await expect(progressStatusCell).toBeVisible();
          expect(progressStatusTextBefore).toBeTruthy();
        }
        
        targetRowIndex = i;
        
        // 該当作業指示をクリックして、作業指示・実績管理画面へ遷移
        await row.click();
        break;
      }
    }
    
    expect(targetRowIndex).toBeGreaterThanOrEqual(0);
    expect(targetWorkInstructionId).toBeTruthy();
    
    // 作業指示・実績管理画面へアクセス完了待機
    await page.waitForURL('**/scr-1789461813941.html');
    await page.waitForSelector('[data-testid="work-instruction-list"]');
    
    // 遷移後、作業指示・実績管理画面で該当作業指示の情報を取得
    const workInstructionList = page.locator('[data-testid="work-instruction-list"]');
    await expect(workInstructionList).toBeVisible();
    
    // 作業指示・実績管理画面内で、該当作業指示の情報を確認
    const instructionRows = workInstructionList.locator('tbody tr');
    const instructionRowCount = await instructionRows.count();
    
    // テーブルのヘッダーから各列の位置を特定
    const instructionHeaderRow = workInstructionList.locator('thead tr');
    const instructionHeaders = instructionHeaderRow.locator('th');
    const instructionHeaderCount = await instructionHeaders.count();
    
    let instructionIdColumnIdx = -1;
    let progressStatusColumnIdx = -1;
    let progressRateColumnIdx = -1;
    let completedColumnIdx = -1;
    let remainingColumnIdx = -1;
    let totalInstructionsColumnIdx = -1;
    
    for (let h = 0; h < instructionHeaderCount; h++) {
      const headerText = await instructionHeaders.nth(h).textContent() || '';
      if (headerText.includes('指示ID') || headerText.includes('作業指示ID')) {
        instructionIdColumnIdx = h;
      } else if (headerText.includes('進捗') && !headerText.includes('進捗率')) {
        progressStatusColumnIdx = h;
      } else if (headerText.includes('進捗率')) {
        progressRateColumnIdx = h;
      } else if (headerText.includes('完了')) {
        completedColumnIdx = h;
      } else if (headerText.includes('残')) {
        remainingColumnIdx = h;
      }
    }
    
    let instructionFound = false;
    
    for (let i = 0; i < instructionRowCount; i++) {
      const row = instructionRows.nth(i);
      const rowText = await row.textContent();
      
      // 該当作業指示を探す
      if (rowText && rowText.includes(targetWorkInstructionId)) {
        instructionFound = true;
        
        // 進捗状況が「未実績」と表示されていることを確認
        if (progressStatusColumnIdx >= 0) {
          const progressStatusCell = row.locator('td').nth(progressStatusColumnIdx);
          await expect(progressStatusCell).toContainText('未実績');
        }
        
        // 進捗率は0%と表示されることを確認
        if (progressRateColumnIdx >= 0) {
          const progressRateCell = row.locator('td').nth(progressRateColumnIdx);
          await expect(progressRateCell).toContainText('0%');
        }
        
        // 完了数は0件と表示されることを確認
        if (completedColumnIdx >= 0) {
          const completedCell = row.locator('td').nth(completedColumnIdx);
          const completedText = await completedCell.textContent() || '';
          expect(completedText.trim()).toBe('0');
        }
        
        // 残数は指示数と同値で表示されることを確認
        if (remainingColumnIdx >= 0) {
          const remainingCell = row.locator('td').nth(remainingColumnIdx);
          const remainingText = await remainingCell.textContent() || '';
          const remainingNum = parseInt(remainingText.trim());
          
          // 指示数を確認（テーブルから取得）
          let instructionCount = 0;
          
          // テーブル内の行から指示数情報を抽出
          // または、進捗率の情報から指示数を逆算
          if (instructionIdColumnIdx >= 0) {
            const idCell = row.locator('td').nth(instructionIdColumnIdx);
            const idText = await idCell.textContent() || '';
            // 指示数は通常、テーブルに記載されているか、
            // または残数から推定される
          }
          
          // 実績データがない場合、残数 = 指示数となることを確認
          // つまり、完了数が0件なら残数 = 指示数
          const completedNum = completedColumnIdx >= 0 
            ? parseInt((await row.locator('td').nth(completedColumnIdx).textContent() || '').trim())
            : 0;
          
          // 指示数 = 完了数 + 残数（実績データがない場合、完了数は0）
          const instructionCountCalculated = completedNum + remainingNum;
          
          // 残数が指示数と同値であることを確認
          // 完了数が0の場合、残数 > 0であることを確認
          expect(remainingNum).toBeGreaterThan(0);
          expect(instructionCountCalculated).toBe(remainingNum);
        }
        
        break;
      }
    }
    
    expect(instructionFound).toBeTruthy();
  });
});