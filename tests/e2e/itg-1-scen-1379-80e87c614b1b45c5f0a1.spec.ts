import { test, expect } from '@playwright/test';

test.describe('人員配置案承認 - 権限なしユーザーの場合', () => {
  test('権限なしユーザーが承認ボタンをクリックすると権限エラーが表示される', async ({ page }) => {
    // ログイン画面に移動
    await page.goto('/');
    
    // ログインフォームが表示されるまで待機
    await page.waitForSelector('input[placeholder*="ユーザーID"]', { timeout: 5000 });
    
    // 権限なしユーザーでログイン
    await page.fill('input[placeholder*="ユーザーID"]', 'test_no_approval_auth');
    await page.fill('input[placeholder*="パスワード"]', 'password');
    
    // ログインボタンをクリック
    const loginButton = page.locator('button:has-text("ログイン")');
    await loginButton.click();
    
    // ダッシュボード画面への自動遷移を待機
    await page.waitForURL(/scr-1789461783315/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // ダッシュボード画面が読み込まれたことを確認
    await expect(page.locator('text=進捗・人員配置ダッシュボード')).toBeVisible();
    
    // ダッシュボード上の人員配置案テーブルが読み込まれるのを待機
    await page.waitForSelector('[id="active-plans-tbody"]', { timeout: 5000 });
    
    // ダッシュボード上に表示された人員配置案テーブルを確認
    const activePlansTable = page.locator('[id="active-plans-tbody"]');
    await expect(activePlansTable).toBeVisible();
    
    // 人員配置案の行を取得
    const planRow = page.locator('[id="active-plans-tbody"] tr').first();
    
    // ネットワークインターセプターを設定してAPIリクエストを監視
    const approvalApiRequests: Array<{ url: string; status: number }> = [];
    const notificationApiRequests: Array<{ url: string; status: number }> = [];
    
    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      
      // 人員配置案承認関連のAPIエンドポイントを監視
      if (url.includes('staffing') || url.includes('plan') || url.includes('approve') || url.includes('assignment')) {
        approvalApiRequests.push({
          url: url,
          status: status
        });
      }
      
      // 外部通知サービス関連のAPIエンドポイントを監視
      if (url.includes('notification') || url.includes('notify') || url.includes('mail') || url.includes('message') || url.includes('delivery')) {
        notificationApiRequests.push({
          url: url,
          status: status
        });
      }
    });
    
    // 人員配置案行内の承認ボタンを取得
    const approveButtonInTable = planRow.locator('button:has-text("配置案を承認"), [data-testid*="approve"], button[aria-label*="承認"]').first();
    
    // 承認ボタンをクリック（権限確認処理が実行される）
    await approveButtonInTable.click();
    
    // 権限確認段階で処理が中断され、エラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=このアクションを実行する権限がありません');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // 承認ボタンはグレーアウト状態のままとなり、クリック不可となることを確認
    await expect(approveButtonInTable).toBeDisabled();
    
    // 人員配置案の状態が未承認のままであることを確認
    const proposalStatus = planRow.locator('text=未承認');
    await expect(proposalStatus).toBeVisible();
    
    // 承認APIへのリクエストが送信されていないか、送信された場合は403 Forbiddenレスポンスであることを確認
    if (approvalApiRequests.length > 0) {
      approvalApiRequests.forEach(request => {
        expect(request.status).toBe(403);
      });
    }
    
    // 外部通知サービスへのリクエストが呼び出されていないことを確認
    // または、呼び出された場合は403レスポンスであることを確認
    if (notificationApiRequests.length > 0) {
      notificationApiRequests.forEach(request => {
        expect(request.status).toBe(403);
      });
    }
  });
});