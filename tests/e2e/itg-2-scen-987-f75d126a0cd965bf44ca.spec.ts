import { test, expect } from '@playwright/test';

test.describe('SCEN-987: 実績データ保存', () => {
  test('正常系：生産性率や習熟度レベルが計算されて生産性データテーブルに保存される', async ({ page }) => {
    // ログイン画面にアクセス
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // ログイン
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("ログイン")');
    await page.waitForLoadState('networkidle');

    // 作業実績データ記録・入力画面にアクセス
    await page.goto('/panels/scr-1789461993203.html');
    await page.waitForLoadState('networkidle');

    // 作業者「作業者A」を選択
    await page.click('select[name="worker"], [role="combobox"]:near(:text("作業者"))');
    await page.click('text=作業者A');

    // 作業タイプを「ピッキング」に設定
    await page.click('select[name="taskType"], [role="combobox"]:near(:text("作業タイプ"))');
    await page.click('text=ピッキング');

    // 部門を「入荷」に設定
    await page.click('select[name="department"], [role="combobox"]:near(:text("部門"))');
    await page.click('text=入荷');

    // 処理件数を入力
    await page.fill('input[name="processCount"], input[placeholder*="処理件数"]', '100');

    // 作業時間を入力
    await page.fill('input[name="workTime"], input[placeholder*="作業時間"]', '120');

    // 不良件数を入力
    await page.fill('input[name="defectCount"], input[placeholder*="不良件数"]', '2');

    // 保存ボタンをクリック
    await page.click('button:has-text("保存")');

    // 保存完了メッセージが表示されることを確認
    await expect(page.locator('text=/保存|完了/')).toBeVisible();
    await page.waitForLoadState('networkidle');

    // APIを通じて生産性データテーブルを問い合わせ、新規レコードが追加されたことを確認
    const apiUrl = page.evaluate(() => window.AIVIC_API_URL);
    const appId = page.evaluate(() => window.AIVIC_APP_ID);
    const tables = page.evaluate(() => window.AIVIC_TABLES);

    const baseUrl = await apiUrl;
    const appIdValue = await appId;
    const tablesValue = await tables;

    // 生産性データテーブルのテーブル番号を取得
    const productivityTableId = tablesValue?.find((t: any) => t.tableName?.includes('生産性') || t.tableName?.includes('productivity'))?.tableNumber;

    if (baseUrl && appIdValue && productivityTableId) {
      const response = await page.request.get(
        `${baseUrl}/api/${productivityTableId}?app=${appIdValue}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      const records = Array.isArray(data) ? data : data.records || [];

      // 作業者A、ピッキング、入荷の組み合わせで新規レコードが存在することを確認
      const newRecord = records.find((record: any) => 
        record['作業者名'] === '作業者A' &&
        record['作業タイプ'] === 'ピッキング' &&
        record['部門'] === '入荷' &&
        record['処理件数'] === 100 &&
        record['作業時間'] === 120
      );

      expect(newRecord).toBeTruthy();
      expect(newRecord['生産性率']).toBeDefined();
      expect(newRecord['習熟度レベル']).toBeDefined();
      expect(newRecord['レコード作成日時']).toBeDefined();

      // レコード作成日時が現在時刻付近であることを確認
      const createdAt = new Date(newRecord['レコード作成日時']);
      const now = new Date();
      const timeDiffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      expect(timeDiffMinutes).toBeGreaterThanOrEqual(0);
      expect(timeDiffMinutes).toBeLessThanOrEqual(5);
    }

    // 生産性ダッシュボード・分析画面に遷移
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');

    // 作業者「作業者A」を検索
    await page.fill('input[placeholder*="検索"], input[placeholder*="作業者"]', '作業者A');
    await page.click('button:has-text("検索"):first');
    await page.waitForLoadState('networkidle');

    // テーブルグリッドで作業者Aのレコードを確認
    const tableRow = page.locator('table tbody tr, [role="row"]', {
      hasText: '作業者A'
    }).first();

    // レコードが表示されていることを確認
    await expect(tableRow).toBeVisible();

    // 作業者名「作業者A」が表示されていることを確認
    await expect(tableRow.locator(':text("作業者A")')).toBeVisible();

    // 作業タイプ「ピッキング」が表示されていることを確認
    await expect(tableRow.locator(':text("ピッキング")')).toBeVisible();

    // 部門「入荷」が表示されていることを確認
    await expect(tableRow.locator(':text("入荷")')).toBeVisible();

    // 処理件数「100」が表示されていることを確認
    const processCountCell = tableRow.locator('td, [role="cell"]').filter({ hasText: '100' });
    await expect(processCountCell).toBeVisible();

    // 作業時間「120」が表示されていることを確認
    const workTimeCell = tableRow.locator('td, [role="cell"]').filter({ hasText: '120' });
    await expect(workTimeCell).toBeVisible();

    // 生産性率カラムが存在し、値が格納されていることを確認
    const cells = await tableRow.locator('td, [role="cell"]').all();
    let productivityRateFound = false;
    for (const cell of cells) {
      const text = await cell.textContent();
      const trimmedText = text?.trim() || '';
      // 生産性率は数値またはパーセンテージ形式（計算済み）
      if (/^\d+(\.\d+)?%?$/.test(trimmedText) && trimmedText !== '100' && trimmedText !== '120' && trimmedText !== '2') {
        const numValue = parseFloat(trimmedText);
        if (numValue > 0 && numValue <= 100) {
          productivityRateFound = true;
          break;
        }
      }
    }
    expect(productivityRateFound).toBeTruthy();

    // 習熟度レベルカラムが存在し、値が格納されていることを確認
    let proficiencyLevelFound = false;
    for (const cell of cells) {
      const text = await cell.textContent();
      const trimmedText = text?.trim() || '';
      // 習熟度レベルは特定のテキスト値または数値（計算済み）
      if (['初級', '中級', '上級', 'レベル1', 'レベル2', 'レベル3'].some(level => trimmedText.includes(level)) || /^(レベル\s*\d+|\d+)$/.test(trimmedText)) {
        proficiencyLevelFound = true;
        break;
      }
    }
    expect(proficiencyLevelFound).toBeTruthy();

    // レコード作成日時が表示されていることを確認
    let createdAtFound = false;
    for (const cell of cells) {
      const text = await cell.textContent();
      const trimmedText = text?.trim() || '';
      // 日付形式を検測（YYYY-MM-DD、YYYY/MM/DD、HH:MMなど）
      const datePattern = /\d{4}[-\/]\d{2}[-\/]\d{2}|\d{1,2}[:\d{2}/;
      if (datePattern.test(trimmedText)) {
        // 日付として解析可能か確認
        const dateObj = new Date(trimmedText);
        if (!isNaN(dateObj.getTime())) {
          const now = new Date();
          const timeDiffMinutes = (now.getTime() - dateObj.getTime()) / (1000 * 60);
          // 5分以内に作成されたことを確認
          if (timeDiffMinutes >= 0 && timeDiffMinutes <= 5) {
            createdAtFound = true;
            break;
          }
        }
      }
    }
    expect(createdAtFound).toBeTruthy();
  });
});