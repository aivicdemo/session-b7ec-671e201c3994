import { test, expect } from '@playwright/test';

test.describe('配置案承認', () => {
  test('配置案承認が完了すると、管理者・現場リーダーに通知が送信される', async ({ page }) => {
    // ログイン
    await page.goto('/');
    await page.waitForURL(/.*panels.*/, { waitUntil: 'domcontentloaded' });
    
    // 最適人員配置案提案・実行画面へ遷移
    await page.goto('/panels/scr-1789461978707.html');
    await page.waitForLoadState('domcontentloaded');

    // 承認待ちの配置案を確認
    const pendingCases = await page.locator('[data-status="pending"]').count();
    expect(pendingCases).toBeGreaterThanOrEqual(1);

    // 承認待ちの配置案から1件を選択
    const firstPendingCase = page.locator('[data-status="pending"]').first();
    await firstPendingCase.click();

    // 詳細画面が表示されることを確認
    await page.waitForSelector('[data-testid="detail-panel"]', { timeout: 5000 });

    // 「承認」ボタンをクリック
    const approveButton = page.locator('button:has-text("承認")').first();
    await approveButton.click();

    // 承認確認ダイアログが表示されることを確認
    const confirmDialog = page.locator('[role="dialog"]');
    await expect(confirmDialog).toBeVisible();

    // ダイアログの「確定」ボタンをクリック
    const confirmButton = page.locator('[role="dialog"] button:has-text("確定")');
    await confirmButton.click();

    // 承認処理の完了メッセージが表示されることを確認
    const successMessage = page.locator('text=配置案承認が完了しました');
    await expect(successMessage).toBeVisible({ timeout: 10000 });

    // メッセージが表示されている間に、通知が送信されるまで待つ
    await page.waitForTimeout(2000);

    // 管理者の通知受信トレイを確認
    const adminNotifications = await page.evaluate(async () => {
      const response = await fetch(`${window.AIVIC_API_URL}/notifications?app=${window.AIVIC_APP_ID}&recipient=admin`);
      return response.json();
    });
    
    const adminNotification = adminNotifications.find((notification: any) => 
      (notification.proposalId || notification.配置案ID) && 
      (notification.approverName || notification.承認者名) && 
      (notification.approvalDateTime || notification.承認日時)
    );
    expect(adminNotification).toBeDefined();

    // 現場リーダーの通知受信トレイを確認
    const leaderNotifications = await page.evaluate(async () => {
      const response = await fetch(`${window.AIVIC_API_URL}/notifications?app=${window.AIVIC_APP_ID}&recipient=leader`);
      return response.json();
    });
    
    const leaderNotification = leaderNotifications.find((notification: any) => 
      (notification.proposalId || notification.配置案ID) && 
      (notification.approverName || notification.承認者名) && 
      (notification.approvalDateTime || notification.承認日時)
    );
    expect(leaderNotification).toBeDefined();
  });
});