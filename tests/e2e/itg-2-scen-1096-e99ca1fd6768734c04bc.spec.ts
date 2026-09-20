import { test, expect } from '@playwright/test';

test.describe('配置案却下処理', () => {
  test('配置計画の却下ステータスが記録され、割当変更履歴に却下理由が保存された後、関連する管理者・現場リーダーに通知が配信される', async ({ page, context }) => {
    // ログイン画面にアクセス
    await page.goto('/');
    
    // ログイン処理
    await page.fill('input[placeholder*="ユーザー"]', 'testuser');
    await page.fill('input[placeholder*="パスワード"]', 'password');
    await page.click('button:has-text("ログイン")');
    
    // ログイン後の自動遷移を待つ
    await page.waitForLoadState('networkidle');

    // 最適人員配置案提案・実行画面にアクセス
    await page.goto('/panels/scr-1789461978707.html');
    await page.waitForLoadState('networkidle');

    // Step 1: 承認待ち状態の配置案が表示されていることを確認
    const pendingProposal = page.locator('text=承認待ち');
    await expect(pendingProposal).toBeVisible();

    // Step 2: ネットワークリスナーを却下処理前に設定
    const notificationResponses: any[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/api/notifications')) {
        notificationResponses.push(response);
      }
    });

    // 配置案の詳細を表示し、却下ボタンをクリック
    await page.click('[data-testid="proposal-detail-btn"]');
    await page.waitForLoadState('networkidle');
    
    const rejectButton = page.locator('button:has-text("却下")');
    await expect(rejectButton).toBeVisible();
    await rejectButton.click();

    // Step 3: 却下理由入力フォームが表示されることを確認
    const reasonForm = page.locator('[data-testid="rejection-reason-form"]');
    await expect(reasonForm).toBeVisible();

    // Step 4: 却下理由欄に理由を入力
    const reasonInput = page.locator('textarea[name="rejection_reason"]');
    await expect(reasonInput).toBeVisible();
    await reasonInput.fill('現場の機械トラブルにより作業工程が変更された');

    // Step 5: 確定ボタンをクリック
    const confirmButton = page.locator('button:has-text("確定")');
    await confirmButton.click();
    
    // 通知配信リクエストの完了を待つ
    await page.waitForResponse(
      (response) => response.url().includes('/api/notifications') && response.request().method() === 'POST',
      { timeout: 10000 }
    );
    
    await page.waitForLoadState('networkidle');

    // Step 6: 配置案のステータスが「却下」に更新されたことを確認
    const rejectedStatus = page.locator('text=却下');
    await expect(rejectedStatus).toBeVisible();

    // Step 7: 割当変更履歴タブを開き、記録を確認
    await page.click('[data-testid="allocation-history-tab"]');
    await page.waitForLoadState('networkidle');

    // 割当変更履歴に「ステータス: 却下」「却下理由: 現場の機械トラブルにより作業工程が変更された」「更新日時」を含むレコードが記録されていることを確認
    const historyContainer = page.locator('[data-testid="allocation-history-record"]').first();
    
    // 同一レコード内に3つの要素が全て含まれていることを確認
    const statusInRecord = historyContainer.locator('text=却下');
    const reasonInRecord = historyContainer.locator('text=現場の機械トラブルにより作業工程が変更された');
    const timestampInRecord = historyContainer.locator('[data-testid="history-timestamp"]');
    
    await expect(statusInRecord).toBeVisible();
    await expect(reasonInRecord).toBeVisible();
    await expect(timestampInRecord).toBeVisible();

    // Step 8: ネットワークタブで通知配信要求の送信を確認
    // 通知配信要求が送信されたことを確認（POSTリクエスト）
    const notificationResponse = notificationResponses.find(r => r.request().method() === 'POST');
    expect(notificationResponse).toBeDefined();

    // Step 9: 通知履歴または通知パネルに却下通知が配信対象として表示されていることを確認
    const notificationPanel = page.locator('[data-testid="notification-panel"]');
    await expect(notificationPanel).toBeVisible();

    // 管理者と現場リーダーが配信対象として含まれていることを確認
    const notificationLog = page.locator('[data-testid="notification-log"]');
    await expect(notificationLog).toBeVisible();

    // 管理者が配信対象に含まれていることを確認
    const adminRecipient = notificationLog.locator('text=管理者');
    await expect(adminRecipient).toBeVisible();

    // 現場リーダーが配信対象に含まれていることを確認
    const leaderRecipient = notificationLog.locator('text=現場リーダー');
    await expect(leaderRecipient).toBeVisible();
  });
});