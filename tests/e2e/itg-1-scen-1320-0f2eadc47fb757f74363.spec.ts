import { test, expect } from '@playwright/test';

test.describe('SCEN-1320: ダッシュボード表示（配置提案画面から）', () => {
  test('集約データに改善指示配信履歴が含まれて表示される', async ({ page }) => {
    // ステップ1: テスト環境にログインし、人員配置最適化提案・実行画面を開く
    await page.goto('/');
    await page.waitForURL(/panels\/scr-1789461783315\.html/);
    
    // ログイン画面が表示されている場合はログイン
    const loginButton = page.locator('button:has-text("ログイン")').first();
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.fill('input[name="userId"]', 'testuser');
      await page.fill('input[name="password"]', 'testpassword');
      await loginButton.click();
      await page.waitForNavigation();
    }

    // 人員配置最適化提案・実行画面へナビゲート
    await page.click('a:has-text("人員配置最適化提案")');
    await page.waitForURL(/panels\/scr-1789461798629\.html/);

    // ステップ2: 「ダッシュボードへ移動」または「ダッシュボード表示」ボタンをクリック
    const dashboardButton = page.locator('button:has-text("ダッシュボードに戻る")');
    await dashboardButton.click();
    await page.waitForURL(/panels\/scr-1789461783315\.html/);

    // ステップ3: ダッシュボード画面の集約データ表示領域をスクロール・展開して確認
    const deliveryHistoryTbody = page.locator('[id="delivery-history-tbody"]');
    await expect(deliveryHistoryTbody).toBeVisible();

    // スクロールして履歴データが見えるように
    await deliveryHistoryTbody.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // ステップ4: 改善指示配信履歴データが表示されていることを確認
    // 履歴テーブルに行データが存在することを確認
    const historyRows = page.locator('[id="delivery-history-tbody"] tr');
    const rowCount = await historyRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 最初の行から5項目すべてを検証
    const firstRow = historyRows.first();
    const cells = firstRow.locator('td');
    const cellCount = await cells.count();
    expect(cellCount).toBeGreaterThanOrEqual(5);

    // ①配信日時（過去の配信タイムスタンプ）
    const deliverySentCell = cells.nth(0);
    await expect(deliverySentCell).toBeVisible();
    const deliveryDate = await deliverySentCell.textContent();
    expect(deliveryDate).toBeTruthy();
    expect(deliveryDate?.trim().length).toBeGreaterThan(0);
    // 日時形式のデータが含まれていることを確認
    expect(deliveryDate).toMatch(/\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}/);

    // ②配信対象（拠点名・チーム名）
    const deliverySiteCell = cells.nth(1);
    await expect(deliverySiteCell).toBeVisible();
    const siteContent = await deliverySiteCell.textContent();
    expect(siteContent).toBeTruthy();
    expect(siteContent?.trim().length).toBeGreaterThan(0);

    // ③配信種別（作業指示・配置案・遅延警告の別）
    const deliveryTypeCell = cells.nth(2);
    await expect(deliveryTypeCell).toBeVisible();
    const deliveryType = await deliveryTypeCell.textContent();
    expect(deliveryType).toBeTruthy();
    expect(deliveryType?.trim().length).toBeGreaterThan(0);
    // 配信種別が適切な値（作業指示、配置案、遅延警告など）であることを確認
    expect(deliveryType).toMatch(/作業指示|配置案|遅延警告/);

    // ④配信ステータス（配信成功・受領確認済み・未受領など）
    const deliveryStatusCell = cells.nth(3);
    await expect(deliveryStatusCell).toBeVisible();
    const statusContent = await deliveryStatusCell.textContent();
    expect(statusContent).toBeTruthy();
    expect(statusContent?.trim().length).toBeGreaterThan(0);
    // ステータスが適切な値であることを確認
    expect(statusContent).toMatch(/配信成功|受領確認済み|未受領|実行中|完了/);

    // ⑤受領タイムスタンプ（配信受領時刻）
    const receiptTimestampCell = cells.nth(4);
    await expect(receiptTimestampCell).toBeVisible();
    const receiptTimestamp = await receiptTimestampCell.textContent();
    expect(receiptTimestamp).toBeTruthy();
    expect(receiptTimestamp?.trim().length).toBeGreaterThan(0);
    // 受領時刻が日時形式のデータであることを確認
    expect(receiptTimestamp).toMatch(/\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}/);

    // 複数行のデータが存在し、各行に5項目すべてが表示されていることを確認
    for (let i = 0; i < Math.min(rowCount, 3); i++) {
      const row = historyRows.nth(i);
      const rowCells = row.locator('td');
      const rowCellCount = await rowCells.count();
      expect(rowCellCount).toBeGreaterThanOrEqual(5);

      // 各項目が空でないことを確認
      for (let j = 0; j < 5; j++) {
        const cellContent = await rowCells.nth(j).textContent();
        expect(cellContent?.trim().length).toBeGreaterThan(0);
      }
    }
  });
});