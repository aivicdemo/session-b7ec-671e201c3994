import { test, expect } from '@playwright/test';

test.describe('SCEN-1522: ハンディターミナル連携ログ表示', () => {
  test('ハンディターミナル連携ログを検索しても条件に合致するログが存在しない場合、空の結果が表示される', async ({ page }) => {
    // 作業指示・実績管理画面へ遷移する
    await page.goto('/panels/scr-1789461813941.html');
    await page.waitForLoadState('networkidle');

    // ハンディターミナル連携ログ表示領域を確認する
    const handyTerminalTab = page.getByTestId('tab-handy-terminal');
    await handyTerminalTab.click();
    await page.waitForLoadState('networkidle');

    // ハンディターミナル連携ログ表示領域が存在することを確認
    const handyTerminalContent = page.locator('#tab-handy-terminal-content');
    await expect(handyTerminalContent).toBeVisible();

    // ログ検索フォームにおいて、存在しない条件を入力する
    // 作業者ID: 99999999
    const filterWorkerIdInput = page.getByTestId('filter-worker-id');
    await filterWorkerIdInput.fill('99999999');

    // 日付: 2099-01-01
    // ハンディターミナルコンテンツ内の日付入力フィールドを特定
    const filterDateInput = handyTerminalContent.locator('input[type="date"]').first();
    await filterDateInput.fill('2099-01-01');

    // 検索ボタンをクリックする
    const searchButton = page.getByTestId('filter-search-button');
    await searchButton.click();

    // 検索実行後、ページの再読み込みを待つ
    await page.waitForLoadState('networkidle');

    // ハンディターミナル連携ログ表示領域に「該当するログがありません」または「検索結果なし」というメッセージが表示されることを確認
    const noResultsMessage = handyTerminalContent.locator('text=/該当するログがありません|検索結果なし/');
    await expect(noResultsMessage).toBeVisible();

    // ログ一覧テーブルが空の状態（ヘッダー行のみ）で表示されることを確認
    const handyTerminalLogTable = page.locator('#handy-terminal-log-tbody');
    const dataRows = handyTerminalLogTable.locator('tr');
    await expect(dataRows).toHaveCount(0);
    
    // テーブルヘッダーが存在することを確認
    const tableHeader = handyTerminalContent.locator('thead');
    await expect(tableHeader).toBeVisible();

    // 検索条件の入力値が保持されていることを確認
    await expect(filterWorkerIdInput).toHaveValue('99999999');
    await expect(filterDateInput).toHaveValue('2099-01-01');

    // フォーム上部にクリアボタンが活性状態で存在することを確認
    const clearButton = page.locator('button').filter({ hasText: /クリア|リセット/ }).first();
    
    await expect(clearButton).toBeVisible();
    await expect(clearButton).toBeEnabled();
  });
});