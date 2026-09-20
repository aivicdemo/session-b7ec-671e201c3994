import { test, expect } from '@playwright/test';

test.describe('SCEN-1527: 作業指示受領履歴表示', () => {
  test('作業指示受領履歴表示タブを開き、セッションユーザーが認証され、フィルター条件を指定して検索すると、条件に合致する履歴レコードが画面に表示される', async ({ page }) => {
    // ステップ1: ブラウザを起動し、ダッシュボードにアクセス
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // ステップ2: ログイン
    await test.step('ユーザーが認証情報を入力してログインする', async () => {
      const userIdInput = page.locator('input[placeholder*="ID"], input[name*="user"], input[name*="id"]').first();
      const passwordInput = page.locator('input[type="password"]');
      const loginButton = page.locator('button:has-text("ログイン"), button:has-text("Log In"), button[type="submit"]');

      await userIdInput.fill('testuser');
      await passwordInput.fill('testpassword');
      await loginButton.click();

      await page.waitForNavigation();
      await page.waitForLoadState('networkidle');
    });

    // ステップ3: 作業指示・実績管理画面へナビゲーション
    await test.step('ダッシュボードから作業指示・実績管理画面へ遷移する', async () => {
      const navLink = page.locator('a, button').filter({ hasText: /作業指示.*実績管理/ });
      await navLink.click();
      await page.waitForLoadState('networkidle');
    });

    // ステップ4: 受領履歴タブをクリック
    await test.step('受領履歴タブを開く', async () => {
      const receiptHistoryTab = page.locator('[data-testid="tab-receipt-history"], button:has-text("受領履歴")');
      await receiptHistoryTab.click();
      await page.waitForLoadState('domcontentloaded');
    });

    // ステップ5: フィルター条件を指定
    await test.step('フィルター条件を指定する', async () => {
      const today = new Date();
      const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);

      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };

      // 受領日時範囲フィルター（直近3日間）
      const dateFromInput = page.locator('input[type="date"], input[placeholder*="開始"]').first();
      const dateToInput = page.locator('input[type="date"], input[placeholder*="終了"]').first();

      await dateFromInput.fill(formatDate(threeDaysAgo));
      await dateToInput.fill(formatDate(today));

      // 作業者IDフィルター
      const workerIdInput = page.locator('[data-testid="filter-worker-id"], input[placeholder*="作業者"]');
      await workerIdInput.fill('testworker');

      // ステータスフィルター（受領済み）
      const statusSelect = page.locator('[data-testid="filter-receipt-status"], select, [role="combobox"]').filter({ hasText: /ステータス|状態/ }).first();
      await statusSelect.click();
      const statusOption = page.locator('option:has-text("受領済み"), [role="option"]:has-text("受領済み")');
      await statusOption.click();
    });

    // ステップ6: 検索実行ボタンをクリック
    await test.step('検索実行ボタンをクリックしてフィルター条件を送信する', async () => {
      const searchButton = page.locator('[data-testid="filter-search-button"], button:has-text("検索")');
      await searchButton.click();
      await page.waitForLoadState('networkidle');
    });

    // ステップ7: ローディング状態が完了することを待機
    await test.step('データの処理完了を待つ', async () => {
      const loadingIndicator = page.locator('text=読込中');
      await loadingIndicator.waitFor({ state: 'hidden' }).catch(() => {
        // ローディングがない場合も正常
      });
    });

    // 期待結果: 受領履歴テーブルにレコードが表示されることを確認
    await test.step('受領履歴一覧領域にレコードが表示される', async () => {
      const receiptHistoryTable = page.locator('[data-testid="receipt-history-list"], [id="receipt-history-tbody"]');
      await expect(receiptHistoryTable).toBeVisible();

      const rows = page.locator('[id="receipt-history-tbody"] tr, [data-testid="receipt-history-list"] tr');
      const rowCount = await rows.count();

      expect(rowCount).toBeGreaterThan(0);
    });

    // 期待結果: 表示されるレコードに必要な5つの列が含まれていることを確認
    await test.step('レコードに必要な5つの列（作業指示ID、受領タイムスタンプ、作業者ID、ステータス、受領確認者）が行ごとに表示される', async () => {
      const rows = page.locator('[id="receipt-history-tbody"] tr');
      const rowCount = await rows.count();

      expect(rowCount).toBeGreaterThan(0);

      // 各行について、5つ以上の列にデータが存在することを確認
      for (let rowIdx = 0; rowIdx < Math.min(rowCount, 3); rowIdx++) {
        const row = rows.nth(rowIdx);
        const rowCells = row.locator('td');
        const cellCount = await rowCells.count();

        expect(cellCount).toBeGreaterThanOrEqual(5);

        // 作業指示ID（1番目の列）
        const instructionIdText = await rowCells.nth(0).textContent();
        expect(instructionIdText?.trim()).toBeTruthy();

        // 受領タイムスタンプ（2番目の列）
        const receiptTimestampText = await rowCells.nth(1).textContent();
        expect(receiptTimestampText?.trim()).toBeTruthy();

        // 作業者ID（3番目の列）
        const workerIdText = await rowCells.nth(2).textContent();
        expect(workerIdText?.trim()).toBeTruthy();

        // ステータス（4番目の列）
        const statusText = await rowCells.nth(3).textContent();
        expect(statusText?.trim()).toBeTruthy();

        // 受領確認者（5番目の列）
        const confirmerText = await rowCells.nth(4).textContent();
        expect(confirmerText?.trim()).toBeTruthy();
      }
    });

    // 期待結果: 表示されたレコードが条件に合致していることを確認
    await test.step('表示されるレコードすべてが指定したフィルター条件（受領日時が直近3日以内かつステータスが受領済み）に合致する', async () => {
      const rows = page.locator('[id="receipt-history-tbody"] tr');
      const rowCount = await rows.count();

      const today = new Date();
      const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);

      // 表示されているすべての行に対して検証
      for (let i = 0; i < Math.min(rowCount, 10); i++) {
        const row = rows.nth(i);
        const rowCells = row.locator('td');
        const cellCount = await rowCells.count();

        expect(cellCount).toBeGreaterThanOrEqual(5);

        // 受領タイムスタンプセル（2番目の列）から日付を抽出して範囲を確認
        const receiptTimestampCell = rowCells.nth(1);
        const timestampText = await receiptTimestampCell.textContent();
        expect(timestampText?.trim()).toBeTruthy();

        // タイムスタンプから日付と時刻を抽出して比較
        const dateTimeMatch = timestampText?.match(/([\d\-T:\.Z]+)/);
        if (dateTimeMatch) {
          const recordDateTime = new Date(dateTimeMatch[1]);
          expect(recordDateTime.getTime()).toBeGreaterThanOrEqual(threeDaysAgo.getTime());
          expect(recordDateTime.getTime()).toBeLessThanOrEqual(today.getTime() + 24 * 60 * 60 * 1000);
        }

        // ステータスセル（4番目の列）が「受領済み」であることを確認
        const statusCell = rowCells.nth(3);
        const statusText = await statusCell.textContent();
        expect(statusText?.trim()).toContain('受領済み');
      }
    });

    // 期待結果: 条件に合致しないレコードが除外されていることを確認
    await test.step('条件に合致しないレコードは一覧から除外される', async () => {
      const rows = page.locator('[id="receipt-history-tbody"] tr');
      const rowCount = await rows.count();

      const today = new Date();
      const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);

      // 表示されているすべてのレコードが範囲内であることを確認
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const rowCells = row.locator('td');

        // ステータス確認
        const statusCell = rowCells.nth(3);
        const statusText = await statusCell.textContent();
        expect(statusText?.trim()).toContain('受領済み');

        // 日付範囲確認
        const receiptTimestampCell = rowCells.nth(1);
        const timestampText = await receiptTimestampCell.textContent();
        const dateTimeMatch = timestampText?.match(/([\d\-T:\.Z]+)/);
        if (dateTimeMatch) {
          const recordDateTime = new Date(dateTimeMatch[1]);
          expect(recordDateTime.getTime()).toBeGreaterThanOrEqual(threeDaysAgo.getTime());
          expect(recordDateTime.getTime()).toBeLessThanOrEqual(today.getTime() + 24 * 60 * 60 * 1000);
        }
      }
    });

    // 期待結果: フィルター条件が検索成立として表示されていることを確認
    await test.step('フィルター条件が検索成立を示す形式で画面に表示される', async () => {
      const today = new Date();
      const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };

      // フィルター条件入力フィールドの値確認
      const dateFromInput = page.locator('input[type="date"], input[placeholder*="開始"]').first();
      const dateToInput = page.locator('input[type="date"], input[placeholder*="終了"]').first();
      const workerIdInput = page.locator('[data-testid="filter-worker-id"], input[placeholder*="作業者"]');
      const statusDisplay = page.locator('select, [role="combobox"]').filter({ hasText: /受領済み/ });

      await expect(dateFromInput).toHaveValue(formatDate(threeDaysAgo));
      await expect(dateToInput).toHaveValue(formatDate(today));
      await expect(workerIdInput).toHaveValue('testworker');
      await expect(statusDisplay).toBeVisible();

      // 受領履歴テーブルが表示されている（検索成立の証拠）
      const receiptHistoryTable = page.locator('[id="receipt-history-tbody"], [data-testid="receipt-history-list"]');
      await expect(receiptHistoryTable).toBeVisible();

      // テーブルにレコードが表示されている（検索が実行されたことの証拠）
      const rows = page.locator('[id="receipt-history-tbody"] tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);

      // ページ上でフィルター条件を示すテキストが表示されていることを確認
      const pageText = await page.textContent();
      const hasFilterDisplay = 
        pageText?.includes('受領日時') || 
        pageText?.includes('直近3日') || 
        pageText?.includes('受領済み') ||
        pageText?.includes(formatDate(threeDaysAgo)) ||
        pageText?.includes(formatDate(today));
      expect(hasFilterDisplay).toBeTruthy();
    });
  });
});