import { test, expect } from '@playwright/test';

test.describe('SCEN-1479: 認可権限を持たないユーザーが画面表示をリクエストすると、操作が拒否される', () => {
  test('作業指示・実績管理画面へのアクセスが拒否される', async ({ page }) => {
    // テストユーザーのセッションを準備する（アクセス認可を持たないロール）
    const testUsername = 'test-user-no-permission';
    const testPassword = 'test-password';

    // ログイン画面にアクセス
    await page.goto('/');
    
    // ログイン画面が表示されることを確認
    await expect(page.locator('text=ログイン')).toBeVisible();

    // テストユーザーでログイン
    await page.fill('input[type="text"]', testUsername);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("ログイン")');

    // ログイン後の画面遷移を待つ
    await page.waitForNavigation();
    await page.waitForLoadState('networkidle');

    // ログイン後の初期画面のURLを記録
    const initialUrl = page.url();

    // 『作業指示・実績管理画面』のURLに直接アクセス
    const response = await page.goto('/panels/scr-1789461813941.html');

    // HTTPレスポンスが403または401であることを確認
    if (response) {
      expect([403, 401]).toContain(response.status());
    }

    // 作業指示・実績管理画面のコンテンツが表示されていないことを確認
    const workInstructionTable = page.locator('[id="work-instruction-tbody"]');
    const workerSummaryList = page.locator('[id="worker-summary-list"]');
    const performanceFormSection = page.locator('[id="performance-form-section"]');
    const handiTerminalLog = page.locator('[id="handy-terminal-log-tbody"]');
    const wmsLog = page.locator('[id="wms-log-tbody"]');
    const receiptHistoryList = page.locator('[id="receipt-history-tbody"]');

    // 画面コンテンツの要素がいずれも表示されていないことを確認
    const isTableVisible = await workInstructionTable.isVisible().catch(() => false);
    const isSummaryVisible = await workerSummaryList.isVisible().catch(() => false);
    const isPerformanceFormVisible = await performanceFormSection.isVisible().catch(() => false);
    const isHandiTerminalVisible = await handiTerminalLog.isVisible().catch(() => false);
    const isWmsLogVisible = await wmsLog.isVisible().catch(() => false);
    const isReceiptHistoryVisible = await receiptHistoryList.isVisible().catch(() => false);

    expect(isTableVisible || isSummaryVisible || isPerformanceFormVisible || isHandiTerminalVisible || isWmsLogVisible || isReceiptHistoryVisible).toBe(false);

    // エラーメッセージまたは認可エラー画面が表示されていることを確認
    const errorMessage = page.locator('text=/403|Forbidden|認可|権限|アクセスが拒否/');
    const hasErrorMessage = await errorMessage.isVisible().catch(() => false);

    // エラーページまたはエラーメッセージが表示されていることを必須として検証
    expect(hasErrorMessage).toBe(true);
  });
});