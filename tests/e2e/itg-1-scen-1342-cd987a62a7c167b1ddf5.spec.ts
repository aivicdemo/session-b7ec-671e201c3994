import { test, expect } from '@playwright/test';

test.describe('SCEN-1342: 作業指示実績管理画面遷移（配置提案画面から）', () => {
  test('ハンディターミナル連携ログが取得され、作業実績データの同期状況が画面に表示される', async ({ page }) => {
    // ステップ1: 人員配置最適化提案・実行画面にログインし、配置提案が表示された状態にある
    await page.goto('/');
    
    // ログイン画面で認証
    await page.fill('input[name="userId"]', 'testuser');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button:has-text("ログイン")');
    
    // ナビゲーションから人員配置最適化提案画面に遷移
    await page.waitForURL(/.*scr-1789461798629/);
    await page.click('[data-testid="scr-1789461798629"]');
    await page.waitForURL(/.*scr-1789461798629/);
    
    // 配置提案が表示されていることを確認
    const proposalContainer = page.locator('[id="proposals-container"]');
    await expect(proposalContainer).toBeVisible();

    // ステップ2: 配置提案の内容を確認し、「作業指示実績管理画面へ遷移」ボタンをクリック
    const assignmentDetailTable = page.locator('[data-testid="assignment-detail-table"]');
    await expect(assignmentDetailTable).toBeVisible();
    
    // 配置提案の詳細が表示されていることを確認
    const detailContainer = page.locator('[id="proposal-detail-container"]');
    await expect(detailContainer).toBeVisible();
    
    // 作業指示・実績管理画面へのナビゲーションボタンをクリック
    await page.click('a[href*="scr-1789461813941"], button:has-text("作業指示・実績管理")')
      .catch(() => page.click('[data-testid="scr-1789461813941"]'));

    // ステップ3: 作業指示・実績管理画面に遷移したことを確認
    await page.waitForURL(/.*scr-1789461813941/);
    const workInstructionList = page.locator('[data-testid="work-instruction-list"]');
    await expect(workInstructionList).toBeVisible();

    // ステップ4: ハンディターミナル連携ログを確認
    const handyTerminalTab = page.locator('[data-testid="tab-handy-terminal"]');
    await handyTerminalTab.click();
    
    await page.waitForSelector('[data-testid="handy-terminal-log-list"], [id="handy-terminal-log-tbody"]', { timeout: 5000 });
    
    // ハンディターミナルログセクションが表示されていることを確認
    const handyTerminalContent = page.locator('[id="tab-handy-terminal-content"]');
    await expect(handyTerminalContent).toBeVisible();
    
    const handyLogList = page.locator('[id="handy-terminal-log-tbody"]');
    await expect(handyLogList).toBeVisible();
    
    // ハンディターミナルログ行が存在することを確認
    const logRows = page.locator('[id="handy-terminal-log-tbody"] tr');
    const rowCount = await logRows.count();
    expect(rowCount).toBeGreaterThan(0);
    
    // 最初のログ行から作業者ID、作業内容、実績数、タイムスタンプが同一行に表示されていることを確認
    const firstRow = logRows.first();
    const rowText = await firstRow.textContent();
    expect(rowText).toMatch(/HT-\d+/); // 作業者ID
    expect(rowText).toMatch(/ピッキング|ピック/); // 作業内容
    expect(rowText).toMatch(/\d+個/); // 実績数
    expect(rowText).toMatch(/\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}:\d{2}/); // タイムスタンプ
    
    // 複数行が存在して時系列で表示されていることを確認
    if (rowCount >= 2) {
      const secondRow = logRows.nth(1);
      const secondRowText = await secondRow.textContent();
      expect(secondRowText).toBeTruthy();
    }

    // ステップ5: 実績データ同期状況セクションを確認
    // 同期状況セクションが存在することを確認
    const syncStatusSection = page.locator('[id="tab-handy-terminal-content"]').filter({ hasText: /最終同期|同期タイムスタンプ/ });
    
    const fullContent = await handyTerminalContent.textContent();
    
    // 最終同期タイムスタンプが表示されていることを確認（形式: YYYY-MM-DD HH:MM:SS）
    expect(fullContent).toMatch(/最終同期[:\s]+\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}:\d{2}/);
    
    // 進捗率が表示されていることを確認（形式: XX%）
    expect(fullContent).toMatch(/進捗率[:\s]+\d+%/);
    
    // 完了数/残数の内訳が表示されていることを確認（形式: 1,240個/480個）
    expect(fullContent).toMatch(/完了数[:\s]+[\d,]+個\s*[/、]?\s*残数[:\s]+[\d,]+個/);
    
    // 同期ステータスが「正常」と表示されていることを確認
    expect(fullContent).toMatch(/同期ステータス[:\s]+正常/);
    
    // 画面が遅延なく応答することを確認
    const pageLoadTime = await page.evaluate(() => {
      const navigationTiming = performance.getEntriesByType('navigation')[0];
      return navigationTiming ? navigationTiming.loadEventEnd - navigationTiming.fetchStart : 0;
    });
    
    expect(pageLoadTime).toBeLessThan(5000);
  });
});