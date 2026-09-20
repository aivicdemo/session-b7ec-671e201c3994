import { test, expect } from '@playwright/test';

test('SCEN-934: 認証済みユーザーが配置案承認アクションの実行権限を持たない場合、権限エラーが発生し処理が中断される', async ({ page }) => {
  // テストユーザーで認証済みの状態でシステムにログインする
  await page.goto('/');
  
  // ログインページが表示されることを確認
  await expect(page).toHaveTitle(/作業管理システム.*ログイン画面/);
  
  // ユーザー認証情報を入力してログイン
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpass');
  await page.click('button[type="submit"]');
  
  // ログイン後の自動遷移を待つ
  await page.waitForLoadState('networkidle');
  
  // 最適人員配置案提案・実行画面に遷移する
  await page.goto('/panels/scr-1789461978707.html');
  
  // 配置案一覧が表示されるまで待つ
  await page.waitForSelector('[data-testid="allocation-list"]', { timeout: 10000 });
  
  // 配置案一覧から承認待ちステータスの配置案を1件選択する
  const pendingAllocation = await page.locator('[data-testid="allocation-item"][data-status="pending"]').first();
  await expect(pendingAllocation).toBeVisible();
  
  await pendingAllocation.click();
  
  // 配置案の詳細を確認し、承認ボタンが表示されていることを確認する
  const approveButton = page.locator('button[data-testid="approve-button"]');
  await expect(approveButton).toBeVisible();
  
  // 承認ボタンをクリックして配置案承認アクションを実行しようとする
  await approveButton.click();
  
  // 承認ボタンのクリック後、画面上にエラーメッセージ「配置案承認の実行権限がありません」が表示される
  const errorMessage = page.locator('text=配置案承認の実行権限がありません');
  await expect(errorMessage).toBeVisible();
  
  // 配置案のステータスは承認待ちのまま変更されず、処理が中断される
  const statusDisplay = page.locator('[data-testid="allocation-status"]');
  await expect(statusDisplay).toContainText('承認待ち');
  
  // 再度配置案一覧を確認して、選択した配置案がまだ承認待ちステータスのままであることを検証
  const updatedAllocationStatus = await page.locator('[data-testid="allocation-item"][data-status="pending"]').first();
  await expect(updatedAllocationStatus).toBeVisible();
});