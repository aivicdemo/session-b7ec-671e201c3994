import { test, expect } from '@playwright/test';

test('SCEN-1517: ハンディターミナル連携ログ表示 - フィルター検索', async ({ page }) => {
  // ステップ 1: 認証済みユーザーでシステムにログインする
  await page.goto('/');
  
  // ログイン画面でユーザー名とパスワードを入力
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpassword');
  await page.click('button:has-text("ログイン")');
  
  // ログイン後、ダッシュボード画面へ遷移するまで待機
  await page.waitForURL(/.*panels\/scr-.*\.html/);
  await page.waitForLoadState('networkidle');

  // ステップ 2: 進捗・人員配置ダッシュボード画面から「作業指示・実績管理画面」へ遷移する
  const workManagementNav = page.locator('[data-testid="nav-link"], a').filter({ hasText: /作業指示|実績管理/ }).first();
  await workManagementNav.click();
  
  // ステップ 3: 作業指示・実績管理画面が表示され、ハンディターミナル連携ログ表示セクションが確認できることを待つ
  await page.waitForSelector('[data-testid="tab-handy-terminal"]');
  const handyTerminalTab = page.locator('[data-testid="tab-handy-terminal"]');
  await expect(handyTerminalTab).toBeVisible();

  // ステップ 4: ハンディターミナル連携ログ表示セクション内のフィルター入力欄を開く
  await handyTerminalTab.click();
  await page.waitForSelector('#tab-handy-terminal-content');
  await page.waitForLoadState('networkidle');

  // ステップ 5: フィルター条件として以下を指定する
  // 拠点ID='DEPOT-001'、ログ記録日付='2024-01-15'、ハンディターミナルID='HT-0042'
  const tabContent = page.locator('#tab-handy-terminal-content');
  
  // 拠点IDフィルター入力
  const inputs = tabContent.locator('input');
  const inputCount = await inputs.count();
  
  if (inputCount >= 3) {
    // 1番目の入力フィールドに拠点ID='DEPOT-001'を入力
    await inputs.nth(0).fill('DEPOT-001');
    
    // 2番目の入力フィールドにログ記録日付='2024-01-15'を入力
    await inputs.nth(1).fill('2024-01-15');
    
    // 3番目の入力フィールドにハンディターミナルID='HT-0042'を入力
    await inputs.nth(2).fill('HT-0042');
  }

  // ステップ 6: 「検索」ボタンをクリックして検索リクエストを送信する
  await page.click('[data-testid="filter-search-button"]');
  
  // ステップ 7: 画面がローディング状態から完了状態へ遷移するまで待つ
  await page.waitForLoadState('networkidle');

  // 期待結果の検証
  const logTable = page.locator('#handy-terminal-log-tbody');
  await expect(logTable).toBeVisible();

  const logRows = logTable.locator('tr');
  const rowCount = await logRows.count();

  if (rowCount > 0) {
    // マッチしたログが存在する場合、各ログレコードを検証
    for (let i = 0; i < rowCount; i++) {
      const row = logRows.nth(i);
      const cells = row.locator('td');
      const cellCount = await cells.count();

      // タイムスタンプ・作業者ID・作業内容・実績数・ステータスの5項目が必須
      expect(cellCount).toBeGreaterThanOrEqual(5);

      // 各セルのテキストを取得
      const rowData: string[] = [];
      for (let j = 0; j < cellCount; j++) {
        const cellText = await cells.nth(j).textContent();
        rowData.push(cellText?.trim() || '');
        expect(cellText?.trim()).toBeTruthy();
      }

      // タイムスタンプ（最初のセル）が存在することを確認
      const timestamp = rowData[0];
      expect(timestamp).toBeTruthy();
      expect(timestamp).toMatch(/\d{4}-\d{2}-\d{2}|\/|:/);

      // 作業者ID（2番目のセル）が存在することを確認
      const workerId = rowData[1];
      expect(workerId).toBeTruthy();

      // 作業内容（3番目のセル）が存在することを確認
      const workContent = rowData[2];
      expect(workContent).toBeTruthy();

      // 実績数（4番目のセル）が存在することを確認
      const performanceCount = rowData[3];
      expect(performanceCount).toBeTruthy();
      expect(performanceCount).toMatch(/^\d+$/);

      // ステータス列（最後の列）が「成功」または「失敗」のいずれかであることを確認
      const statusCell = rowData[cellCount - 1];
      expect(statusCell).toMatch(/成功|失敗/);
    }
  } else {
    // マッチしたログが存在しない場合、「該当するログがありません」メッセージが表示されることを確認
    const noResultsMessage = page.locator('text=該当するログがありません');
    await expect(noResultsMessage).toBeVisible();
  }
});