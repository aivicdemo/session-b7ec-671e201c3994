import { test, expect } from '@playwright/test';

test('SCEN-1530: フィルター条件に合致するレコードが存在しない場合、画面に件数なしの状態が表示される', async ({ page }) => {
  // 1. ログイン
  await page.goto('/');
  
  // ログイン画面で認証情報を入力
  const usernameField = page.locator('input[type="text"]').first();
  const passwordField = page.locator('input[type="password"]');
  const loginButton = page.locator('button:has-text("ログイン"), button:has-text("LOGIN"), button:has-text("ログイン")');
  
  // テスト用の認証情報を入力（テスト環境の認証情報を使用）
  await usernameField.fill('test_user');
  await passwordField.fill('test_password');
  await loginButton.click();
  
  // ログイン後の遷移を待機
  await page.waitForURL(/\/panels\//, { timeout: 10000 });
  
  // 2. 作業指示・実績管理画面にアクセス
  await page.goto('/panels/scr-1789461813941.html');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  
  // 3. 作業指示受領履歴の表示機能にアクセス
  // 受領履歴タブをクリック
  await page.click('[data-testid="tab-receipt-history"]');
  await page.waitForSelector('[data-testid="receipt-history-list"]', { timeout: 5000 });
  
  // 4. フィルター条件として、実績に存在しないチームID（「TEAM-9999」）を指定
  const workerIdFilter = page.locator('[data-testid="filter-worker-id"]');
  if (await workerIdFilter.isVisible()) {
    await workerIdFilter.fill('TEAM-9999');
  }
  
  // 5. フィルター条件として、実績に存在しない日付範囲を指定
  // 受領履歴画面内の日付フィルター要素を特定
  const receiptHistorySection = page.locator('#tab-receipt-history-content');
  const dateFilterElements = receiptHistorySection.locator('input[type="date"]');
  const dateFilterCount = await dateFilterElements.count();
  
  if (dateFilterCount >= 2) {
    // 開始日を設定
    await dateFilterElements.nth(0).fill('2099-01-01');
    // 終了日を設定
    await dateFilterElements.nth(1).fill('2099-12-31');
  } else if (dateFilterCount === 1) {
    // 日付フィルターが1つの場合
    await dateFilterElements.nth(0).fill('2099-01-01');
  }
  
  // 6. 「検索」ボタンをクリック
  await page.click('[data-testid="filter-search-button"]');
  
  // フィルター適用後の読み込みを待つ
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  
  // 7. 画面のレコード一覧領域を確認
  const receiptHistoryTableBody = page.locator('#receipt-history-tbody');
  
  // テーブルの行データが表示されていないことを確認
  const rows = receiptHistoryTableBody.locator('tr');
  const rowCount = await rows.count();
  expect(rowCount).toBe(0);
  
  // 「検索条件に合致するレコードがありません」または「件数：0件」メッセージを確認
  const tableArea = page.locator('[data-testid="receipt-history-list"]');
  const tableText = await tableArea.textContent();
  
  const hasNoRecordsMessage = 
    tableText?.includes('検索条件に合致するレコードがありません') ||
    tableText?.includes('件数：0件') ||
    tableText?.includes('0件') ||
    tableText?.includes('1～0件目を表示');
  
  expect(hasNoRecordsMessage).toBeTruthy();
  
  // ページング情報を確認（存在する場合）
  const pagingInfo = page.locator('text=/\\d+～\\d+件目を表示|全\\d+件/');
  const pagingVisible = await pagingInfo.isVisible().catch(() => false);
  
  if (pagingVisible) {
    const pagingText = await pagingInfo.textContent();
    // 合計件数が0で表示されていることを確認
    expect(pagingText).toMatch(/0件|全0件|1～0件目/);
  }
  
  // フィルター条件の入力値が画面に残っていることを確認
  const workerFilterValue = await workerIdFilter.inputValue().catch(() => '');
  if (workerFilterValue) {
    expect(workerFilterValue).toBe('TEAM-9999');
  }
  
  // 日付フィルターの値も確認（設定した場合）
  if (dateFilterCount >= 1) {
    const startDateValue = await dateFilterElements.nth(0).inputValue().catch(() => '');
    if (startDateValue) {
      expect(startDateValue).toBe('2099-01-01');
    }
  }
  if (dateFilterCount >= 2) {
    const endDateValue = await dateFilterElements.nth(1).inputValue().catch(() => '');
    if (endDateValue) {
      expect(endDateValue).toBe('2099-12-31');
    }
  }
});