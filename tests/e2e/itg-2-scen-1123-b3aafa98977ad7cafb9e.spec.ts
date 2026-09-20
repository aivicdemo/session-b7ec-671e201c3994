import { test, expect } from '@playwright/test';

test.describe('配置案実行処理', () => {
  test('配置案が承認者判断に基づいて実行され、配置計画が有効化される', async ({ page }) => {
    // ログイン
    await page.goto('/');
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button:has-text("ログイン")');
    await page.waitForNavigation();

    // 最適人員配置案提案・実行画面に遷移
    await page.goto('/panels/scr-1789461978707.html');
    await page.waitForLoadState('networkidle');

    // 承認待ち状態の配置案が表示されていることを確認
    const pendingProposalElement = page.locator('[data-status="pending_approval"]').first();
    await expect(pendingProposalElement).toBeVisible();

    // 配置案の詳細情報を確認
    const detailsSection = page.locator('[data-test-id="proposal-details"]');
    await expect(detailsSection).toBeVisible();
    const targetWorker = page.locator('[data-test-id="target-worker"]');
    await expect(targetWorker).toHaveText(/\S+/);
    const targetDepartment = page.locator('[data-test-id="target-department"]');
    await expect(targetDepartment).toHaveText(/\S+/);
    const changeReason = page.locator('[data-test-id="change-reason"]');
    await expect(changeReason).toHaveText(/\S+/);

    // 配置案に対して「承認」ボタンをクリック
    const approveButton = page.locator('button:has-text("承認")').first();
    await approveButton.click();

    // 承認確認ダイアログが表示されることを確認
    const confirmDialog = page.locator('[data-test-id="approval-confirm-dialog"]');
    await expect(confirmDialog).toBeVisible();

    // ダイアログ内の「実行」ボタンをクリック
    const executeButton = confirmDialog.locator('button:has-text("実行")');
    await executeButton.click();

    // 配置実行処理が開始され、処理中インジケーターが表示されることを確認
    const processingIndicator = page.locator('[data-test-id="processing-indicator"]');
    await expect(processingIndicator).toBeVisible();

    // 処理完了を待機
    await expect(processingIndicator).toBeHidden({ timeout: 30000 });

    // 配置案の状態が「実行完了」に遷移したことを確認
    const executedProposal = page.locator('[data-status="executed"]').first();
    await expect(executedProposal).toBeVisible();
    const statusDisplay = page.locator('[data-test-id="proposal-status"]');
    await expect(statusDisplay).toContainText('実行完了');

    // 配置計画の有効化を示す表示を確認
    const planValidStatus = page.locator('[data-test-id="plan-valid-status"]');
    await expect(planValidStatus).toContainText('有効');
    const effectiveStartDateTime = page.locator('[data-test-id="effective-start-datetime"]');
    await expect(effectiveStartDateTime).toHaveText(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);

    // 配置案の実行履歴が表示されることを確認
    const executionHistory = page.locator('[data-test-id="execution-history"]');
    await expect(executionHistory).toBeVisible();
    const approverName = page.locator('[data-test-id="approver-name"]');
    await expect(approverName).toHaveText(/\S+/);
    const approvalDateTime = page.locator('[data-test-id="approval-datetime"]');
    await expect(approvalDateTime).toHaveText(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);
    const executionDateTime = page.locator('[data-test-id="execution-datetime"]');
    await expect(executionDateTime).toHaveText(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);
  });
});