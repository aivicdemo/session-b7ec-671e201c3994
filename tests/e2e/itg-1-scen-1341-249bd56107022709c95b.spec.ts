import { test, expect } from '@playwright/test';

test.describe('作業指示実績管理画面遷移（配置提案画面から）', () => {
  test('作業指示の受領履歴が取得され、受領確認状態と配信状況が画面に表示される', async ({ page, context }) => {
    // 人員配置最適化提案・実行画面を開く
    await page.goto('/panels/scr-1789461798629.html', { waitUntil: 'networkidle' });

    // 配置案リストから1件の配置案を選択
    const proposalsContainer = page.locator('[id="proposals-container"]');
    await expect(proposalsContainer).toBeVisible();
    
    // 配置提案リスト内の最初の配置案要素を取得して選択
    const proposalItems = proposalsContainer.locator('[role="button"], button, div[class*="proposal"]');
    const proposalCount = await proposalItems.count();
    expect(proposalCount).toBeGreaterThan(0);
    
    const firstProposalItem = proposalItems.first();
    await firstProposalItem.click();
    await page.waitForLoadState('networkidle');

    // 選択した配置案の詳細行にある「作業指示実績確認」ボタンをクリック
    const detailContainer = page.locator('[id="proposal-detail-container"]');
    await expect(detailContainer).toBeVisible();
    
    // 詳細行内から「作業指示実績確認」ボタンを検索してクリック
    const buttons = detailContainer.locator('button, a, [role="button"]');
    let found = false;
    for (let i = 0; i < await buttons.count(); i++) {
      const buttonText = await buttons.nth(i).textContent();
      if (buttonText?.includes('作業指示実績確認')) {
        await buttons.nth(i).click();
        found = true;
        break;
      }
    }
    expect(found).toBe(true);

    // 作業指示・実績管理画面への遷移を待つ（読み込み完了まで最大5秒）
    await page.waitForURL('**/panels/scr-1789461813941.html', { timeout: 5000 });

    // 作業指示・実績管理画面が表示されたことを確認
    const contentArea = page.locator('.content-area');
    await expect(contentArea).toBeVisible();

    // 受領履歴一覧セクションを目視確認
    const receiptHistoryTable = page.locator('[id="receipt-history-tbody"]');
    await expect(receiptHistoryTable).toBeVisible();

    // テーブルの行を取得
    const rows = receiptHistoryTable.locator('tr');
    const rowCount = await rows.count();

    expect(rowCount).toBeGreaterThan(0);

    // APIからデータベースの受領履歴件数を取得
    const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
    const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
    const tables = await page.evaluate(() => (window as any).AIVIC_TABLES);
    
    // receipt_history テーブルを探す
    let receiptHistoryTableId: string | null = null;
    if (tables && typeof tables === 'object') {
      for (const [key, value] of Object.entries(tables)) {
        if ((value as any).tableName === 'receipt_history') {
          receiptHistoryTableId = key;
          break;
        }
      }
    }

    let apiRecords: any[] = [];
    if (apiUrl && appId && receiptHistoryTableId) {
      const response = await page.request.get(`${apiUrl}/api/${receiptHistoryTableId}?app=${appId}`);
      if (response.ok()) {
        const data = await response.json();
        apiRecords = Array.isArray(data) ? data : (data.records ? data.records : []);
      }
    }

    // 画面に表示される行数とデータベースの件数が一致することを確認
    expect(rowCount).toBe(apiRecords.length);

    // ISO 8601形式の正規表現
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

    // 各行の列データを検証
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = row.locator('td');
      const cellCount = await cells.count();

      // 5つの列が存在することを確認
      expect(cellCount).toBe(5);

      // (1) 作業指示ID - 第1列
      const workInstructionIdCell = cells.nth(0);
      const workInstructionId = await workInstructionIdCell.textContent();
      expect(workInstructionId).toBeTruthy();
      expect(workInstructionId?.trim()).not.toBe('');

      // (2) 配信日時 - 第2列（ISO 8601形式）
      const deliveryDatetimeCell = cells.nth(1);
      const deliveryDatetime = await deliveryDatetimeCell.textContent();
      expect(deliveryDatetime).toBeTruthy();
      expect(iso8601Regex.test(deliveryDatetime?.trim() || '')).toBe(true);

      // (3) 受領確認状態 - 第3列（「受領確認済」「未確認」「配信失敗」のいずれか）
      const receiptStatusCell = cells.nth(2);
      const receiptStatus = await receiptStatusCell.textContent();
      expect(receiptStatus?.trim()).toMatch(/^(受領確認済|未確認|配信失敗)$/);

      // (4) 受領タイムスタンプ - 第4列
      const receiptTimestampCell = cells.nth(3);
      const receiptTimestamp = await receiptTimestampCell.textContent();

      // 受領確認状態が「未確認」の場合、受領タイムスタンプは空欄
      if (receiptStatus?.trim() === '未確認') {
        expect(receiptTimestamp?.trim()).toBe('');
      }
      // 受領確認済の場合、ISO 8601形式で表示
      else if (receiptStatus?.trim() === '受領確認済') {
        expect(receiptTimestamp).toBeTruthy();
        expect(iso8601Regex.test(receiptTimestamp?.trim() || '')).toBe(true);
      }
      // 配信失敗の場合、受領タイムスタンプは空欄
      else if (receiptStatus?.trim() === '配信失敗') {
        expect(receiptTimestamp?.trim()).toBe('');
      }

      // (5) 配信ステータス - 第5列（「配信完了」「配信中」「再試行待機中」のいずれか）
      const deliveryStatusCell = cells.nth(4);
      const deliveryStatus = await deliveryStatusCell.textContent();
      expect(deliveryStatus?.trim()).toMatch(/^(配信完了|配信中|再試行待機中)$/);

      // 配信ID単位でAPIレコードと対応していることを確認
      if (apiRecords.length > i) {
        const apiRecord = apiRecords[i];
        expect(workInstructionId?.trim()).toBe(String(apiRecord.work_instruction_id || apiRecord.workInstructionId || ''));
      }

      // 配信失敗の場合、ツールチップを確認
      if (receiptStatus?.trim() === '配信失敗') {
        await receiptStatusCell.hover();
        await page.waitForTimeout(300);

        // ツールチップの表示を確認
        const tooltip = page.locator('[role="tooltip"]');
        await expect(tooltip).toBeVisible({ timeout: 1000 });
        
        const tooltipText = await tooltip.textContent();
        expect(tooltipText).toContain('配信に一時的な遅延が発生しています。数分以内に再試行します');
      }
    }

    // 最終確認：受領履歴テーブルが表示されていることを確認
    await expect(receiptHistoryTable).toBeVisible();
  });
});