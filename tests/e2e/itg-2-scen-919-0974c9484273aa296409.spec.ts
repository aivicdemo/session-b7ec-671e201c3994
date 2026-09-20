import { test, expect } from '@playwright/test';

test.describe('配置案却下', () => {
  test('配置案却下の実行後、管理者への通知が送信され、却下理由と対象作業者情報が伝達される', async ({ page }) => {
    // ログイン画面へアクセス
    await page.goto('/');
    
    // ログイン処理
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("ログイン")');
    
    // ログイン後の自動遷移を待つ
    await page.waitForNavigation();
    
    // 最適人員配置案提案・実行画面へアクセス
    await page.goto('/panels/scr-1789461978707.html');
    await page.waitForLoadState('networkidle');
    
    // 承認待ちの配置案を表示
    const proposalElement = await page.locator('[data-status="pending"]').first();
    await expect(proposalElement).toBeVisible();
    
    // 配置案の詳細を確認
    await proposalElement.click();
    await page.waitForLoadState('networkidle');
    
    // 対象作業者情報が表示されていることを確認
    const workerInfo = page.locator('[data-test-id="worker-info"]');
    await expect(workerInfo).toBeVisible();
    
    const workerId = await page.locator('[data-test-id="worker-id"]').textContent();
    const workerName = await page.locator('[data-test-id="worker-name"]').textContent();
    const currentPlacement = await page.locator('[data-test-id="current-placement"]').textContent();
    
    // 却下ボタンをクリック
    await page.click('button:has-text("却下")');
    
    // 却下理由入力フィールドに入力
    await page.fill('textarea[data-test-id="rejection-reason"]', '現場の人員配置制約と整合しない');
    
    // 却下確認ダイアログの確定ボタンをクリック
    await page.click('button:has-text("確定")');
    
    // 配置案ステータスが「却下」に更新されたことを確認
    const statusElement = page.locator('[data-test-id="proposal-status"]');
    await expect(statusElement).toContainText('却下');
    
    // 画面上に管理者への通知送信完了メッセージが表示されることを確認
    const notificationMessage = page.locator('[data-test-id="notification-message"]');
    await expect(notificationMessage).toBeVisible();
    await expect(notificationMessage).toContainText('管理者へ通知を送信しました');
  });
});