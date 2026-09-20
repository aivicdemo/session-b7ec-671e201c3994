import { test, expect } from '@playwright/test';

test('SCEN-1539: 作業指示受領確認完了後、画面に受領状態が「受領済」に更新されて表示されること', async ({ page }) => {
  // ログイン
  await page.goto('/');
  await page.fill('input[placeholder*="ユーザーID"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'testpass');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 作業指示・実績管理画面を開く
  await page.click('a[href*="scr-1789461813941"]');
  await page.waitForLoadState('networkidle');

  // 未受領状態の作業指示を1件以上含むリストが表示されていることを確認
  const workInstructionList = page.locator('[data-testid="work-instruction-list"]');
  await expect(workInstructionList).toBeVisible();

  const unreceivedRows = page.locator('tbody#work-instruction-tbody tr');
  const rowCount = await unreceivedRows.count();
  expect(rowCount).toBeGreaterThan(0);

  // 未受領状態の行を探す
  let targetRowIndex = -1;
  let targetRowData: { instructionId: string; initialStatus: string } = { instructionId: '', initialStatus: '' };
  
  for (let i = 0; i < rowCount; i++) {
    const row = unreceivedRows.nth(i);
    const cells = row.locator('td');
    const cellCount = await cells.count();
    
    // 受領状態列を探す（テーブル構造から受領確認状態が含まれている行を特定）
    for (let j = 0; j < cellCount; j++) {
      const cellText = await cells.nth(j).textContent();
      if (cellText?.includes('未受領') || cellText?.includes('未確認')) {
        targetRowIndex = i;
        targetRowData.instructionId = (await cells.nth(0).textContent()) || '';
        targetRowData.initialStatus = cellText || '';
        break;
      }
    }
    
    if (targetRowIndex >= 0) break;
  }

  expect(targetRowIndex).toBeGreaterThanOrEqual(0);

  // 対象行をクリックして詳細を開く
  const targetRow = unreceivedRows.nth(targetRowIndex);
  await targetRow.click();
  await page.waitForSelector('[data-testid="receipt-confirm-ok"]');

  // 詳細画面内の「受領確認」ボタンをクリック
  await page.click('[data-testid="receipt-confirm-ok"]');

  // ローディング状態を確認
  const modal = page.locator('[id="receipt-confirmation-overlay"]');
  await expect(modal).toBeVisible();

  // ローディングが解除されるまで待機
  await page.waitForSelector('[id="receipt-confirmation-overlay"]', { state: 'hidden' });

  // 詳細画面が閉じるか一覧に戻る
  await expect(modal).not.toBeVisible();

  // 一覧画面に戻った時点で、対象行の受領状態が「受領済」に更新されていることを確認
  await page.waitForLoadState('networkidle');

  const updatedRows = page.locator('tbody#work-instruction-tbody tr');
  const updatedRowCount = await updatedRows.count();
  expect(updatedRowCount).toBeGreaterThan(0);

  // 対象の作業指示行を再度確認
  const updatedTargetRow = updatedRows.nth(targetRowIndex);
  const updatedCells = updatedTargetRow.locator('td');
  
  // 受領状態が「受領済」に更新されていることを確認
  let statusUpdated = false;
  let timestampFound = false;
  const cellCountUpdated = await updatedCells.count();
  
  for (let j = 0; j < cellCountUpdated; j++) {
    const cellText = await updatedCells.nth(j).textContent();
    if (cellText?.includes('受領済')) {
      statusUpdated = true;
    }
    // 受領タイムスタンプが表示されていることを確認（日時形式を検出）
    if (cellText && /\d{4}-\d{2}-\d{2}|(\d{1,2}:\d{2})/.test(cellText)) {
      timestampFound = true;
    }
  }

  expect(statusUpdated).toBe(true);
  expect(timestampFound).toBe(true);
});