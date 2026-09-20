import { test, expect } from '@playwright/test';

test('ハンディターミナル連携ログ表示時に、画面で指定されたすべてのフィルター条件が次の検索処理に引き継がれる', async ({ page }) => {
  // 作業指示・実績管理画面を開く
  await page.goto('/panels/scr-1789461813941.html');
  await page.waitForLoadState('networkidle');

  // ハンディターミナルタブをクリック
  await page.getByTestId('tab-handy-terminal').click();
  await page.waitForTimeout(500);

  // ハンディターミナルタブ内のコンテンツを取得
  const handiTerminalContent = page.locator('#tab-handy-terminal-content');

  // ハンディターミナルログ表示セクション内のフィルター要素を取得
  // 作業者ID='W001'
  const workerIdFilter = handiTerminalContent.locator('input[placeholder*="作業者"], input[name*="worker"]').first();
  if (await workerIdFilter.isVisible()) {
    await workerIdFilter.fill('W001');
  }

  // 拠点ID='BASE-05'
  const siteIdFilter = handiTerminalContent.locator('input[placeholder*="拠点"], select[name*="site"]').first();
  if (await siteIdFilter.isVisible()) {
    const tagName = await siteIdFilter.evaluate(el => el.tagName);
    if (tagName === 'SELECT') {
      await siteIdFilter.selectOption('BASE-05');
    } else {
      await siteIdFilter.fill('BASE-05');
    }
  }

  // 連携ステータス='完了'
  const statusFilter = handiTerminalContent.locator('select[name*="status"], input[placeholder*="ステータス"]').first();
  if (await statusFilter.isVisible()) {
    const tagName = await statusFilter.evaluate(el => el.tagName);
    if (tagName === 'SELECT') {
      await statusFilter.selectOption('完了');
    } else {
      await statusFilter.fill('完了');
    }
  }

  // 日時範囲開始='2024-01-15 09:00'
  const dateStartFilter = handiTerminalContent.locator('input[type="datetime-local"], input[placeholder*="開始"], input[placeholder*="から"]').first();
  if (await dateStartFilter.isVisible()) {
    await dateStartFilter.fill('2024-01-15T09:00');
  }

  // 日時範囲終了='2024-01-15 17:00'
  const dateEndFilter = handiTerminalContent.locator('input[type="datetime-local"], input[placeholder*="終了"], input[placeholder*="まで"]').last();
  if (await dateEndFilter.isVisible()) {
    await dateEndFilter.fill('2024-01-15T17:00');
  }

  // ハンディターミナルタブ内の検索ボタンをクリック
  const searchButton = handiTerminalContent.locator('button:has-text("検索"), button:has-text("表示更新")').first();
  if (await searchButton.isVisible()) {
    await searchButton.click();
  } else {
    await page.getByTestId('filter-search-button').click();
  }

  await page.waitForLoadState('networkidle');

  // ハンディターミナル連携ログ一覧が表示されることを確認
  const logTable = page.locator('#handy-terminal-log-tbody');
  await expect(logTable).toBeVisible();

  // 表示されたログレコードを取得
  const logRows = await logTable.locator('tr').all();

  // フィルター条件を満たすレコードが表示されていることを確認
  expect(logRows.length).toBeGreaterThan(0);

  // 各ログレコードがすべてのフィルター条件を満たしていることを確認
  for (const row of logRows) {
    const cells = await row.locator('td').all();

    if (cells.length >= 4) {
      // 作業者IDが'W001'であることを確認
      const workerIdText = await cells[0].textContent();
      expect(workerIdText?.trim()).toContain('W001');

      // 拠点IDが'BASE-05'であることを確認
      const siteIdText = await cells[1].textContent();
      expect(siteIdText?.trim()).toContain('BASE-05');

      // 連携ステータスが'完了'であることを確認
      const statusText = await cells[2].textContent();
      expect(statusText?.trim()).toContain('完了');

      // タイムスタンプが指定範囲内であることを確認
      const timestampText = await cells[3].textContent();
      const timestamp = new Date(timestampText?.trim() || '');
      const rangeStart = new Date('2024-01-15T09:00');
      const rangeEnd = new Date('2024-01-15T17:00');

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(rangeStart.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(rangeEnd.getTime());
    }
  }
});