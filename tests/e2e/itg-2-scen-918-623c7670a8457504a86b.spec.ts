import { test, expect } from '@playwright/test';

test.describe('配置案却下', () => {
  test('配置計画を却下実行するとき、配置計画ステータスが却下状態に更新され、割当変更履歴に却下理由が記録される', async ({ page }) => {
    // ログイン
    await page.goto('/');
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // 最適人員配置案提案・実行画面へ遷移
    await page.goto('/panels/scr-1789461978707.html');
    await page.waitForLoadState('networkidle');

    // 却下対象の配置計画を特定し、詳細を表示
    const planRow = page.locator('table tbody tr').first();
    await expect(planRow).toBeVisible();
    
    // 配置計画の詳細を表示（行をクリック）
    await planRow.click();
    await page.waitForLoadState('networkidle');

    // 『却下』ボタンをクリック
    const rejectButton = page.locator('button:has-text("却下")');
    await expect(rejectButton).toBeVisible();
    await rejectButton.click();

    // 却下理由入力フォームが表示されることを確認
    const reasonForm = page.locator('input[placeholder*="理由"], textarea[placeholder*="理由"]').first();
    await expect(reasonForm).toBeVisible();

    // 却下理由を「適用不可」と入力
    await reasonForm.fill('適用不可');

    // 『却下を確定』ボタンをクリック
    const confirmButton = page.locator('button:has-text("却下を確定")');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // 画面がリロードされ、対象配置計画が一覧に表示されていることを確認
    await page.waitForLoadState('networkidle');

    // 配置計画ステータスが『却下』状態に更新されていることを確認
    const statusCell = page.locator('table tbody tr').first().locator('td').filter({ hasText: '却下' });
    await expect(statusCell).toBeVisible();

    // 割当変更履歴に却下理由が記録されていることを確認
    const historyTable = page.locator('table:has-text("割当変更履歴")');
    await expect(historyTable).toBeVisible();
    
    const historyRow = historyTable.locator('tbody tr').first();
    const reasonCell = historyRow.locator('td').filter({ hasText: '適用不可' });
    await expect(reasonCell).toBeVisible();
  });
});