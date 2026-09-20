import { test, expect } from '@playwright/test';

test.describe('SCEN-1411: 配信モーダル確定', () => {
  test('配信完了後、人員配置案のステータスが更新され、配信日時と配信者情報が記録される', async ({ page }) => {
    // ログイン画面にアクセス
    await page.goto('/');
    
    // ログイン処理（テストユーザーでログイン）
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button:has-text("ログイン")');
    
    // ログイン完了を待機
    await page.waitForURL(/.*scr-1789461783315.*/, { timeout: 10000 });
    
    // 人員配置最適化提案・実行画面へ遷移
    await page.click('[href*="scr-1789461798629"]');
    await page.waitForURL(/.*scr-1789461798629.*/, { timeout: 5000 });
    
    // 未配信の人員配置案を1件選択（ステータスが「作成済み」または「配信待機中」のもの）
    const proposalContainer = await page.locator('[id="proposals-container"]');
    const proposalRows = await proposalContainer.locator('tr');
    const rowCount = await proposalRows.count();
    
    let selectedProposalIndex = -1;
    let selectedProposalSite = '';
    let selectedProposalTeam = '';
    let selectedProposalId = '';
    
    for (let i = 0; i < rowCount; i++) {
      const row = proposalRows.nth(i);
      const rowText = await row.textContent();
      
      if (rowText?.includes('作成済み') || rowText?.includes('配信待機中')) {
        await row.click();
        selectedProposalIndex = i;
        
        // 配置案の詳細が表示されたことを確認
        const detailContainer = await page.locator('[id="proposal-detail-container"]');
        await expect(detailContainer).toBeVisible({ timeout: 5000 });
        
        // 配置案IDを取得
        const detailText = await detailContainer.textContent();
        const idMatch = detailText?.match(/配置案名[:\s]*([^\n]+)/);
        if (idMatch) {
          selectedProposalId = idMatch[1].trim();
        }
        
        // 配置案の対象拠点とチーム情報を取得
        const cells = await row.locator('td');
        const cellCount = await cells.count();
        
        for (let j = 0; j < cellCount; j++) {
          const cellText = await cells.nth(j).textContent() || '';
          if (cellText.includes('東京') || cellText.includes('大阪') || cellText.includes('名古屋')) {
            selectedProposalSite = cellText.trim();
          }
          if (!selectedProposalTeam && (cellText.includes('チーム') || /チーム\d+/.test(cellText))) {
            selectedProposalTeam = cellText.trim();
          }
        }
        break;
      }
    }
    
    // 配置案が選択されたことを確認
    expect(selectedProposalIndex).toBeGreaterThanOrEqual(0);
    expect(selectedProposalId).toBeTruthy();
    
    // 配信モーダルを開く（「配信」ボタンをクリック）
    await page.click('[data-testid="distribute-button"]');
    await page.waitForSelector('[id="distribute-modal-overlay"]', { timeout: 5000 });
    
    // 配信対象の拠点・チーム・作業者が正しく表示されていることを確認
    const modalContent = await page.locator('[id="distribute-modal-content"]');
    const siteText = await modalContent.textContent();
    expect(siteText).toBeTruthy();
    expect(siteText?.length).toBeGreaterThan(0);
    
    // 選択した拠点・チーム情報がモーダルに表示されていることを確認
    if (selectedProposalSite) {
      expect(siteText).toContain(selectedProposalSite);
    }
    if (selectedProposalTeam) {
      expect(siteText).toContain(selectedProposalTeam);
    }
    
    // 作業者情報が表示されていることを確認
    expect(siteText).toMatch(/作業者|員/);
    
    // モーダル内の「確定」ボタンをクリック
    await page.click('[data-testid="distribute-modal-confirm"]');
    
    // 配信処理の完了を待機（ローディング表示が消えるまで）
    await page.waitForSelector('[id="distribute-modal-overlay"]', { state: 'hidden', timeout: 10000 });
    
    // 配信完了後、提案画面に戻っていることを確認
    await page.waitForURL(/.*scr-1789461798629.*/, { timeout: 5000 });
    
    // 先ほど選択した配置案の行を確認（配置案IDで特定）
    const updatedProposalRows = await page.locator('[id="proposals-container"]').locator('tr');
    let updatedRow = null;
    let foundUpdatedRow = false;
    const updatedRowCount = await updatedProposalRows.count();
    
    for (let i = 0; i < updatedRowCount; i++) {
      const row = updatedProposalRows.nth(i);
      const rowText = await row.textContent();
      
      if (rowText?.includes(selectedProposalId)) {
        updatedRow = row;
        foundUpdatedRow = true;
        break;
      }
    }
    
    expect(foundUpdatedRow).toBeTruthy();
    
    const updatedRowText = await updatedRow?.textContent();
    
    // (1) ステータスが「配信済み」に変更されていることを確認
    expect(updatedRowText).toContain('配信済み');
    
    // (2) 配信日時が表示されていることを確認（YYYY-MM-DD HH:MM:SS形式）
    const distributionDateTimeMatch = updatedRowText?.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);
    expect(distributionDateTimeMatch).toBeTruthy();
    expect(distributionDateTimeMatch?.[0]).toMatch(/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/);
    
    // (3) 配信者情報が表示されていることを確認
    const updatedRowAllCells = await updatedRow?.locator('td');
    const cellCount = await updatedRowAllCells?.count() || 0;
    let foundDistributorInfo = false;
    let distributorInfo = '';
    
    for (let j = 0; j < cellCount; j++) {
      const cellText = await updatedRowAllCells?.nth(j).textContent();
      const trimmedText = cellText?.trim() || '';
      
      // 配信者情報の候補を確認（ステータス行や日時行でない）
      if (trimmedText && 
          !trimmedText.includes('配信済み') && 
          !/^\d{4}-\d{2}-\d{2}/.test(trimmedText) &&
          trimmedText.length > 0) {
        
        // 「システム自動配信」または有効なユーザー識別情報であることを確認
        if (trimmedText === 'システム自動配信' || 
            /^[a-zA-Z0-9_-]+$/.test(trimmedText) || 
            /^[ぁ-んァ-ヴー一-龯\s0-9]+$/.test(trimmedText)) {
          foundDistributorInfo = true;
          distributorInfo = trimmedText;
          break;
        }
      }
    }
    
    expect(foundDistributorInfo).toBeTruthy();
    expect(distributorInfo.length).toBeGreaterThan(0);
    
    // ダッシュボード画面に遷移
    await page.click('[href*="scr-1789461783315"]');
    await page.waitForURL(/.*scr-1789461783315.*/, { timeout: 5000 });
    
    // (4) 配置実行状況パネルを確認し、配信した配置案の対象拠点・チームが「実行中」として表示されていることを確認
    const activePlansTable = await page.locator('[id="active-plans-tbody"]');
    await expect(activePlansTable).toBeVisible();
    
    const activePlansContent = await activePlansTable.textContent();
    expect(activePlansContent).toBeTruthy();
    expect(activePlansContent?.length).toBeGreaterThan(0);
    
    const activePlansRows = await activePlansTable.locator('tr');
    const activePlansRowCount = await activePlansRows.count();
    let foundMatchingDistributionCompletion = false;
    
    for (let i = 0; i < activePlansRowCount; i++) {
      const row = activePlansRows.nth(i);
      const rowText = await row.textContent();
      
      // 「実行中」ステータスを含む行を確認
      if (rowText?.includes('実行中')) {
        const cells = await row.locator('td');
        const cellsCount = await cells.count();
        
        let hasSiteMatch = false;
        let hasTeamMatch = false;
        
        // 配信した配置案の対象拠点・チームと同じ内容が含まれているか確認
        for (let j = 0; j < cellsCount; j++) {
          const cellText = await cells.nth(j).textContent() || '';
          
          // 対象拠点とチームの両方がこの行に含まれているか確認
          if (selectedProposalSite && cellText.includes(selectedProposalSite)) {
            hasSiteMatch = true;
          }
          if (selectedProposalTeam && cellText.includes(selectedProposalTeam)) {
            hasTeamMatch = true;
          }
        }
        
        // 拠点またはチーム情報が一致し、「実行中」ステータスが表示されている行を確認
        if ((hasSiteMatch || hasTeamMatch) && rowText.includes('実行中')) {
          foundMatchingDistributionCompletion = true;
          break;
        }
      }
    }
    
    expect(foundMatchingDistributionCompletion).toBeTruthy();
    
    // 作業指示・実績管理画面を開く
    await page.click('[href*="scr-1789461813941"]');
    await page.waitForURL(/.*scr-1789461813941.*/, { timeout: 5000 });
    
    // (5) 配信された作業指示に対応するレコードを検索・表示する
    const workInstructionList = await page.locator('[id="work-instruction-tbody"]');
    await expect(workInstructionList).toBeVisible();
    
    const workInstructionRows = await workInstructionList.locator('tr');
    const recordCount = await workInstructionRows.count();
    
    // 配信された拠点・チームに関連する作業指示を検索
    let foundDistributedWorkInstruction = false;
    let foundTimestamp = false;
    
    for (let i = 0; i < recordCount; i++) {
      const row = workInstructionRows.nth(i);
      const rowText = await row.textContent();
      
      // 配信された拠点・チームに関連するレコードであることを確認
      const isSiteRelated = selectedProposalSite && rowText?.includes(selectedProposalSite);
      const isTeamRelated = selectedProposalTeam && rowText?.includes(selectedProposalTeam);
      
      if (isSiteRelated || isTeamRelated) {
        foundDistributedWorkInstruction = true;
        
        // 配信タイムスタンプが記録されていることを確認
        const timestampMatch = rowText?.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);
        
        if (timestampMatch) {
          expect(timestampMatch[0]).toMatch(/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/);
          foundTimestamp = true;
        }
        
        if (foundDistributedWorkInstruction && foundTimestamp) {
          break;
        }
      }
    }
    
    // 配信された作業指示レコードが存在することを確認
    expect(foundDistributedWorkInstruction).toBeTruthy();
    // 配信タイムスタンプが記録されていることを確認
    expect(foundTimestamp).toBeTruthy();
  });
});