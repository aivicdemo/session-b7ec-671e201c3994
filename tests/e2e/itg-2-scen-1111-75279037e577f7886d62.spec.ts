import { test, expect } from '@playwright/test';

test('SCEN-1111: 認証済みだが配置案承認権限を持たないユーザーが承認ボタンを操作すると、工程2の権限確認で拒否されて処理が中断される', async ({ page }) => {
  // テストユーザー（配置案承認権限なし）でシステムにログインする
  await page.goto('/');
  await page.waitForURL(/.*panels.*/, { waitUntil: 'networkidle' });
  
  // ログイン画面に遷移することを確認
  const loginTitle = await page.locator('.login-title');
  await expect(loginTitle).toBeVisible();
  
  // ログイン情報を入力（権限なしのテストユーザー）
  await page.fill('input[type="email"], input[placeholder*="メール"], input[placeholder*="ユーザー"]', 'testuser-no-approval@example.com');
  await page.fill('input[type="password"]', 'testpassword123');
  await page.click('button:has-text("ログイン"), button[type="submit"]');
  
  // ログイン後の遷移を待つ
  await page.waitForURL(/.*panels.*/, { waitUntil: 'networkidle' });
  
  // 最適人員配置案提案・実行画面を開く
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');
  
  // 画面が読み込まれたことを確認
  await expect(page).toHaveURL(/.*scr-1789461978707/);
  
  // 配置案の一覧から未承認状態の配置案を1件選択
  // 未承認状態の配置案を探してクリック
  const unapprovedProposal = page.locator('[data-status="unapproved"], [data-status="pending"], text=/未承認/').first();
  await expect(unapprovedProposal).toBeVisible();
  await unapprovedProposal.click();
  
  // 選択した配置案の詳細情報が画面に表示されることを確認
  const detailPanel = page.locator('[data-testid="proposal-detail"], .proposal-detail, [role="region"]:has-text("詳細")').first();
  await expect(detailPanel).toBeVisible();
  
  // 承認ボタンをクリック
  const approveButton = page.locator('button:has-text("承認"), button[data-action="approve"]').first();
  await expect(approveButton).toBeVisible();
  await approveButton.click();
  
  // 権限確認処理が実行され、エラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=/配置案承認権限がありません/', '[role="alert"]', '.error-message').first();
  await expect(errorMessage).toBeVisible();
  
  // 配置案の状態が未承認のままであることを確認
  const statusElement = page.locator('[data-status], .status, text=/未承認/').first();
  await expect(statusElement).toContainText(/未承認/);
  
  // 画面が最適人員配置案提案・実行画面に留まっていることを確認
  await expect(page).toHaveURL(/.*scr-1789461978707/);
});