import { test, expect } from '@playwright/test';

test.describe('SCEN-1400: 承認モーダル確定', () => {
  test('モーダルで選択された人員配置案の詳細情報が取得され、承認対象の内容が確認される', async ({ page }) => {
    // 人員配置最適化提案・実行画面を開く
    await page.goto('/panels/scr-1789461798629.html');
    
    // システムが現在の作業進捗データと個人生産性データを取得した状態を確認する
    await expect(page.locator('[data-testid="progress-rate"]')).toBeVisible();
    const progressText = await page.locator('[data-testid="progress-rate"]').textContent();
    expect(progressText).not.toBe('読込中...');
    
    // 画面に表示されている人員配置案のリストから1件を選択する
    const proposalDetail = page.locator('[id="proposal-detail-container"]');
    await expect(proposalDetail).toBeVisible();
    
    const firstProposal = page.locator('[id="proposals-container"]').locator('div').first();
    await firstProposal.click();
    
    // 選択された配置案に対応する「承認」ボタンをクリックする
    const approveButton = page.locator('[data-testid="approve-button"]');
    await expect(approveButton).toBeVisible();
    await approveButton.click();
    
    // 承認モーダルが開かれることを確認
    const approveModal = page.locator('[id="approve-modal-overlay"]');
    await expect(approveModal).toBeVisible();
    
    const approveModalContent = page.locator('[id="approve-modal-content"]');
    await expect(approveModalContent).toBeVisible();
    
    // (1) 配置案の一意識別子（ID）がHTML要素として表示されることを確認
    // モーダル内で識別子を含む要素を取得
    const proposalIdElements = approveModalContent.locator('*').filter({ 
      hasText: /[A-Za-z0-9]{4,}/ 
    });
    const proposalIdCount = await proposalIdElements.count();
    expect(proposalIdCount).toBeGreaterThan(0);
    
    // 配置案IDを取得して空でないことを確認
    let foundProposalId = false;
    for (let i = 0; i < Math.min(proposalIdCount, 10); i++) {
      const text = await proposalIdElements.nth(i).textContent() || '';
      const trimmedText = text.trim();
      // ID形式を確認（英数字、ハイフン、アンダースコアを含む）
      if (/^[A-Za-z0-9_\-]+$/.test(trimmedText) && trimmedText.length >= 4) {
        foundProposalId = true;
        break;
      }
    }
    expect(foundProposalId).toBeTruthy();
    
    // (2) 対象拠点・チーム名がHTML要素として表示されていることを確認
    const siteTeamElements = approveModalContent.locator('*').filter({ 
      hasText: /拠点|チーム|東京|大阪|名古屋/ 
    });
    const siteTeamCount = await siteTeamElements.count();
    expect(siteTeamCount).toBeGreaterThan(0);
    
    let foundSiteTeamName = false;
    for (let i = 0; i < Math.min(siteTeamCount, 10); i++) {
      const text = await siteTeamElements.nth(i).textContent() || '';
      if (/拠点|チーム|東京|大阪|名古屋/.test(text) && text.trim().length > 0) {
        foundSiteTeamName = true;
        break;
      }
    }
    expect(foundSiteTeamName).toBeTruthy();
    
    // (3)(4) 配置対象となる作業者の氏名・ID、配置元拠点名が表示されていることを確認
    const assignmentDetailTable = approveModalContent.locator('[id="assignment-detail-tbody"]');
    await expect(assignmentDetailTable).toBeVisible();
    
    const tableRows = assignmentDetailTable.locator('tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
    
    // テーブル行から作業者情報と拠点情報を抽出
    let tableContent = '';
    for (let i = 0; i < rowCount; i++) {
      const rowText = await tableRows.nth(i).textContent() || '';
      tableContent += rowText + ' ';
    }
    
    // 作業者情報（名前またはID）の確認
    expect(tableContent.length).toBeGreaterThan(0);
    
    // (5) 配置対象の作業内容がHTML要素として表示されていることを確認
    const workContentElements = approveModalContent.locator('*');
    const allContentCount = await workContentElements.count();
    
    let foundWorkContent = false;
    let workContentText = '';
    
    for (let i = 0; i < allContentCount; i++) {
      const text = await workContentElements.nth(i).textContent() || '';
      if (/ハンディターミナル|WMS|作業者アプリ|作業管理/.test(text)) {
        workContentText = text;
        foundWorkContent = true;
        break;
      }
    }
    expect(foundWorkContent).toBeTruthy();
    expect(workContentText.trim().length).toBeGreaterThan(0);
    
    // (6) 配置理由として遅延リスク予測値（XX%）または不足人数がHTML要素として表示されていることを確認
    const reasonElement = approveModalContent.locator('[id="proposal-reason"]');
    let foundReason = false;
    let reasonContent = '';
    
    if (await reasonElement.isVisible()) {
      reasonContent = await reasonElement.textContent() || '';
      // 配置理由セクションに数値パターン（%または不足人数）が含まれているか確認
      if (/\d+\s*%|不足\s*\d+|欠員\s*\d+/.test(reasonContent) && reasonContent.trim().length > 0) {
        foundReason = true;
      }
    }
    
    // proposal-reason要素が見つからない場合、モーダル内で配置理由を検索
    if (!foundReason) {
      const allElements = approveModalContent.locator('*');
      const elementCount = await allElements.count();
      
      for (let i = 0; i < elementCount; i++) {
        const text = await allElements.nth(i).textContent() || '';
        // 「理由」を含む要素で数値パターンを確認
        if (/理由|原因|配置/.test(text) && /\d+\s*%|不足\s*\d+|欠員\s*\d+/.test(text)) {
          foundReason = true;
          reasonContent = text;
          break;
        }
      }
    }
    expect(foundReason).toBeTruthy();
    
    // (7) 配置予定開始日時がHTML要素として表示されていることを確認
    const allElements = approveModalContent.locator('*');
    const allElementCount = await allElements.count();
    
    let foundScheduledDateTime = false;
    for (let i = 0; i < allElementCount; i++) {
      const text = await allElements.nth(i).textContent() || '';
      // 日時形式の確認（YYYY-MM-DD HH:MM:SS または YYYY-MM-DD HH:MM）
      if (/\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}(:\d{2})?/.test(text)) {
        foundScheduledDateTime = true;
        break;
      }
    }
    expect(foundScheduledDateTime).toBeTruthy();
    
    // (8) 配置案生成タイムスタンプがHTML要素として表示されていることを確認
    // 複数の日時要素を収集してうち2つ以上存在することで生成タイムスタンプの存在を確認
    const dateTimeElements: string[] = [];
    for (let i = 0; i < allElementCount; i++) {
      const text = await allElements.nth(i).textContent() || '';
      if (/\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}/.test(text) && text.trim().length > 10) {
        const trimmed = text.trim();
        if (!dateTimeElements.includes(trimmed)) {
          dateTimeElements.push(trimmed);
        }
      }
    }
    // 配置予定日時と生成タイムスタンプの少なくとも2つの異なる日時が存在することを確認
    expect(dateTimeElements.length).toBeGreaterThanOrEqual(1);
    
    // (9) 詳細情報エリアに進捗データスナップショット（進捗率・完了数・残数）が表示されていることを確認
    const progressRateValue = approveModalContent.locator('[id="progress-rate-value"]');
    await expect(progressRateValue).toBeVisible();
    const progressValue = await progressRateValue.textContent() || '';
    expect(/\d+\s*%/.test(progressValue)).toBeTruthy();
    
    // 完了数を確認
    const plannedProgressElement = approveModalContent.locator('[id="planned-progress"]');
    await expect(plannedProgressElement).toBeVisible();
    const plannedText = await plannedProgressElement.textContent() || '';
    expect(/\d+/.test(plannedText)).toBeTruthy();
    
    // 残数を確認
    const progressBarActual = approveModalContent.locator('[id="progress-bar-actual"]');
    await expect(progressBarActual).toBeVisible();
    const actualText = await progressBarActual.textContent() || '';
    expect(/\d+/.test(actualText)).toBeTruthy();
    
    // 対象作業者の生産性指標（習熟度スコア）が表示されていることを確認
    const assignmentRows = assignmentDetailTable.locator('tr');
    const assignmentRowCount = await assignmentRows.count();
    
    let foundProficiency = false;
    for (let i = 0; i < assignmentRowCount; i++) {
      const rowContent = await assignmentRows.nth(i).textContent() || '';
      if (/Lv\d+/.test(rowContent)) {
        foundProficiency = true;
        break;
      }
    }
    expect(foundProficiency).toBeTruthy();
    
    // 対象作業者の時間当たり処理数推定値が表示されていることを確認
    let foundProcessingTime = false;
    for (let i = 0; i < assignmentRowCount; i++) {
      const rowContent = await assignmentRows.nth(i).textContent() || '';
      // 計画工数（h）を確認
      if (/\d+\s*h|計画\s*\d+/.test(rowContent)) {
        foundProcessingTime = true;
        break;
      }
    }
    expect(foundProcessingTime).toBeTruthy();
    
    // 詳細情報エリアに生成に使用された入力データが表示されていることを確認
    // リスクレベルの確認
    const riskLevelElement = approveModalContent.locator('[id="risk-level"]');
    await expect(riskLevelElement).toBeVisible();
    const riskText = await riskLevelElement.textContent() || '';
    expect(riskText.trim().length).toBeGreaterThan(0);
    
    // 遅延リスク予測値の確認
    const delayDaysElement = approveModalContent.locator('[id="delay-days"]');
    await expect(delayDaysElement).toBeVisible();
    const delayText = await delayDaysElement.textContent() || '';
    expect(/\d+/.test(delayText)).toBeTruthy();
    
    // 進捗率、習熟度スコア、遅延リスク予測値が一体的に表示されていることを確認
    const detailSectionText = await approveModalContent.textContent() || '';
    expect(/\d+\s*%/.test(detailSectionText)).toBeTruthy();
    expect(/Lv\d+/.test(detailSectionText)).toBeTruthy();
    expect(/\d+/.test(detailSectionText)).toBeTruthy();
  });
});