import { test, expect } from '@playwright/test';

test.describe('SCEN-1481: ハンディターミナル連携ログが取得できないとき、画面は引き続き表示されるが対象データが欠落する', () => {
  test('ハンディターミナル連携ログ取得失敗時の画面表示確認', async ({ page, context }) => {
    // ログイン画面へアクセス
    await page.goto('/');
    await page.waitForURL('**/login**', { timeout: 5000 }).catch(() => {});

    // ログイン認証情報が必要な場合の処理
    const loginCard = page.locator('.login-card');
    if (await loginCard.isVisible()) {
      const userInput = page.locator('input[name="userId"]').first();
      const passwordInput = page.locator('input[name="password"]').first();
      
      if (await userInput.isVisible()) {
        await userInput.fill('testuser');
      }
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('testpassword');
      }
      
      const loginButton = page.locator('button:has-text("ログイン"), button:text-is("ログイン")');
      if (await loginButton.isVisible()) {
        await loginButton.click();
        await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
      }
    }

    // ハンディターミナル連携を遮断するルートを事前に設定
    await test.step('ハンディターミナル連携を遮断する準備', async () => {
      await page.route('**/api/**', route => {
        const url = route.request().url();
        if (url.includes('handy') || url.includes('terminal')) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
    });

    // Step 1: 作業指示・実績管理画面を開く
    await test.step('作業指示・実績管理画面を開く', async () => {
      const workManagementNav = page.locator('text=作業指示・実績管理');
      if (await workManagementNav.isVisible()) {
        await workManagementNav.click();
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      } else {
        await page.goto('/panels/scr-1789461813941.html');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      }
    });

    // Step 2: 画面が正常に読み込まれ、作業指示一覧・ハンディターミナル連携ログ・WMS連携ログが表示されていることを確認
    await test.step('画面初期状態の確認', async () => {
      // 作業指示一覧の存在確認
      const workInstructionTable = page.locator('[id="work-instruction-tbody"], [testid="work-instruction-list"]');
      await expect(workInstructionTable).toBeVisible({ timeout: 5000 });

      // ハンディターミナル連携ログタブをクリック
      const handyTerminalTab = page.locator('[testid="tab-handy-terminal"]');
      await expect(handyTerminalTab).toBeVisible({ timeout: 5000 });
      await handyTerminalTab.click();
      await page.waitForTimeout(500);

      // ハンディターミナル連携ログが表示されていることを確認
      const handyTerminalContent = page.locator('[id="tab-handy-terminal-content"]');
      await expect(handyTerminalContent).toBeVisible({ timeout: 5000 });
      const handyTable = page.locator('[id="handy-terminal-log-tbody"]');
      await expect(handyTable).toBeVisible({ timeout: 5000 });

      // WMS連携ログタブの確認
      const wmsTab = page.locator('[testid="tab-wms"]');
      await expect(wmsTab).toBeVisible({ timeout: 5000 });
      await wmsTab.click();
      await page.waitForTimeout(500);

      // WMS連携ログが表示されていることを確認
      const wmsContent = page.locator('[id="tab-wms-content"]');
      await expect(wmsContent).toBeVisible({ timeout: 5000 });
      const wmsTable = page.locator('[id="wms-log-tbody"]');
      await expect(wmsTable).toBeVisible({ timeout: 5000 });
    });

    // Step 4: 画面をF5キーで再読み込みする
    await test.step('画面をF5キーで再読み込み', async () => {
      await page.reload();
      // ページの読み込み完了を待つ（ハンディターミナルログの失敗は容認）
      await page.waitForTimeout(2000);
    });

    // Step 5: 画面が引き続き表示されることを確認
    await test.step('画面が表示されていることを確認', async () => {
      // ページ全体がまだ表示されている
      const contentArea = page.locator('.content-area, [class*="content"]');
      await expect(contentArea).toBeVisible({ timeout: 5000 });

      // 作業指示一覧は表示されている
      const workInstructionTable = page.locator('[id="work-instruction-tbody"], [testid="work-instruction-list"]');
      await expect(workInstructionTable).toBeVisible({ timeout: 5000 });
    });

    // Step 5-6: ハンディターミナル連携ログセクションの確認
    await test.step('ハンディターミナル連携ログセクションが空白またはプレースホルダー表示されていることを確認', async () => {
      // ハンディターミナルタブをクリック
      const handyTerminalTab = page.locator('[testid="tab-handy-terminal"]');
      await handyTerminalTab.click({ timeout: 5000 });
      
      await page.waitForTimeout(1000);

      // ハンディターミナル連携ログのコンテンツを確認
      const handyTable = page.locator('[id="handy-terminal-log-tbody"]');
      const handyContent = page.locator('[id="tab-handy-terminal-content"]');
      
      // テーブルが空であるか、プレースホルダーが表示されているか確認
      const isEmpty = await handyTable.locator('tr').count().then(count => count === 0).catch(() => true);
      const placeholders = [
        'データ取得中',
        '最後の更新',
        'データ取得に遅延が発生しています',
        '該当するデータ',
        '表示するデータはありません'
      ];
      
      let hasPlaceholder = false;
      for (const placeholder of placeholders) {
        const found = await page.locator(`text=${placeholder}`).first().isVisible().catch(() => false);
        if (found) {
          hasPlaceholder = true;
          break;
        }
      }
      
      // セクションが表示されている状態で、テーブルが空またはプレースホルダーが表示されている
      await expect(handyContent).toBeVisible({ timeout: 5000 });
      expect(isEmpty || hasPlaceholder).toBeTruthy();
    });

    // Step 5-6: WMS連携ログは表示されることを確認
    await test.step('WMS連携ログが表示されていることを確認', async () => {
      const wmsTab = page.locator('[testid="tab-wms"]');
      await wmsTab.click({ timeout: 5000 });
      
      await page.waitForTimeout(500);

      // WMS連携ログのコンテンツが表示されている
      const wmsContent = page.locator('[id="tab-wms-content"]');
      await expect(wmsContent).toBeVisible({ timeout: 5000 });
      
      // WMS連携ログのテーブルが表示されている
      const wmsTable = page.locator('[id="wms-log-tbody"]');
      await expect(wmsTable).toBeVisible({ timeout: 5000 });
    });

    // Step 5: エラーダイアログがポップアップしていないことを確認
    await test.step('エラーダイアログが表示されていないことを確認', async () => {
      const errorDialog = page.locator('.modal-overlay');
      const errorVisible = await errorDialog.first().isVisible().catch(() => false);
      expect(errorVisible).toBeFalsy();
    });

    // Step 5: 画面全体の操作が継続可能であることを確認
    await test.step('画面操作が継続可能であることを確認', async () => {
      // ページヘッダーが操作可能
      const header = page.locator('.shell-header');
      await expect(header).toBeVisible({ timeout: 5000 });

      // フィルター検索ボタンが操作可能
      const searchButton = page.locator('button:has-text("検索")');
      const searchVisible = await searchButton.isVisible().catch(() => false);
      if (searchVisible) {
        await expect(searchButton).toBeEnabled();
      }

      // タブ切り替えが操作可能
      const tabButtons = page.locator('[testid="tab-handy-terminal"], [testid="tab-wms"], [testid="tab-receipt-history"]');
      const tabCount = await tabButtons.count();
      expect(tabCount).toBeGreaterThan(0);
      
      // 最初のタブをクリックして操作可能性を検証
      const firstTab = tabButtons.first();
      await expect(firstTab).toBeEnabled();
    });
  });
});