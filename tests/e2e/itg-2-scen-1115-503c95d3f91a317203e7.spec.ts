import { test, expect } from '@playwright/test';

test.describe('配置案承認処理', () => {
  test('工程7の配置計画更新後、工程8で配置変更履歴テーブルに承認イベントが記録される', async ({ page }) => {
    // ログイン
    await page.goto('/');
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    await page.waitForNavigation();

    // 最適人員配置案提案・実行画面にアクセス
    await page.goto('/panels/scr-1789461978707.html');
    await page.waitForLoadState('networkidle');

    // 工程7の配置計画が表示されていることを確認
    const process7Section = await page.locator('text=工程7');
    await expect(process7Section).toBeVisible();

    // 工程7の配置計画で作業者を別の工程へ変更
    const changeButton = await page.locator('[data-action="change-allocation"]').first();
    await changeButton.click();

    // 変更対象の工程を選択
    await page.selectOption('[data-field="target-process"]', 'process-8');
    
    // 承認ボタンをクリック
    const approveButton = await page.locator('button:has-text("承認")');
    await approveButton.click();

    // 承認者情報と承認日時が自動入力されるダイアログを確認
    const approvalDialog = await page.locator('[role="dialog"]');
    await expect(approvalDialog).toBeVisible();

    const approverField = await page.locator('[data-field="approver"]');
    await expect(approverField).toHaveValue(/\w+/); // 承認者ユーザー名が入力されている

    const approvalDateField = await page.locator('[data-field="approval-date"]');
    const approvalDateValue = await approvalDateField.inputValue();
    expect(approvalDateValue).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);

    // 承認者ユーザー名を取得
    const approverUserName = await approverField.inputValue();

    // 承認確定ボタンをクリック
    const confirmButton = await page.locator('button:has-text("承認確定")');
    await confirmButton.click();

    // 画面が工程8の履歴表示に遷移、または履歴セクションが更新されることを確認
    await page.waitForLoadState('networkidle');
    const historySection = await page.locator('text=工程8').or(page.locator('text=配置変更履歴'));
    await expect(historySection).toBeVisible();

    // 配置変更履歴テーブルで新規レコードを確認
    const historyTable = await page.locator('[data-table="allocation-history"]');
    await expect(historyTable).toBeVisible();

    const tableRows = await historyTable.locator('tbody tr');
    const rowCount = await tableRows.count();
    const lastRow = tableRows.nth(rowCount - 1);

    // 変更前工程が工程7として記録されていることを確認
    const previousProcessCell = lastRow.locator('td').nth(0);
    await expect(previousProcessCell).toContainText('工程7');
    const previousProcessValue = await previousProcessCell.textContent();

    // 変更後工程が工程8として記録されていることを確認
    const nextProcessCell = lastRow.locator('td').nth(1);
    await expect(nextProcessCell).toContainText('工程8');
    const nextProcessValue = await nextProcessCell.textContent();

    // 対象作業者IDが記録されていることを確認
    const workerIdCell = lastRow.locator('td').nth(2);
    const workerIdValue = await workerIdCell.textContent();
    expect(workerIdValue).toBeTruthy();
    expect(workerIdValue).toMatch(/\w+/);

    // 承認者ユーザー名が記録されていることを確認
    const approverNameCell = lastRow.locator('td').nth(3);
    const approverNameValue = await approverNameCell.textContent();
    expect(approverNameValue).toEqual(approverUserName);

    // 承認日時がYYYY-MM-DD HH:MM:SS形式で記録されていることを確認
    const approvalTimeCell = lastRow.locator('td').nth(4);
    const approvalTimeValueInTable = await approvalTimeCell.textContent();
    expect(approvalTimeValueInTable).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);

    // 全ての必須情報が正確に記録されていることを検証
    expect(previousProcessValue).toBeTruthy();
    expect(nextProcessValue).toBeTruthy();
    expect(workerIdValue).toBeTruthy();
    expect(approverNameValue).toBeTruthy();
    expect(approvalTimeValueInTable).toBeTruthy();
  });
});