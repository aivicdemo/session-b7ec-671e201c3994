import { test, expect } from '@playwright/test';

test('認証済みユーザーが人員配置最適化提案画面への遷移を要求すると、ユーザーのセッション有効性が検証される', async ({ page }) => {
  // Step 1: 作業指示・実績管理画面にアクセス
  await page.goto('/panels/scr-1789461813941.html');

  // Step 2: 作業指示・実績管理画面に到達したことを確認
  // 認証済みユーザーであることを確認（ログアウトボタンの存在）
  const logoutButton = page.locator('text=/ログアウト/');
  await expect(logoutButton).toBeVisible();

  // 作業指示・実績管理画面の主要要素が表示されていることを確認
  const workInstructionList = page.locator('[data-testid="work-instruction-list"]');
  await expect(workInstructionList).toBeVisible();

  // Step 3: 作業指示・実績管理画面から人員配置最適化提案画面への遷移ボタンをクリック
  const optimizationNavButton = page.locator('nav [data-testid="scr-1789461798629"], a:has-text("人員配置最適化提案")').first();
  await optimizationNavButton.click();

  // Step 4 & 5: ブラウザの遷移リクエストが発生し、遷移がブロックされずに進行することを確認
  await page.waitForURL(/scr-1789461798629/);

  // 期待結果: 人員配置最適化提案・実行画面へ正常に遷移
  await expect(page).toHaveURL(/scr-1789461798629/);

  // 画面のタイトルが表示されていることを確認
  const pageTitle = page.locator('text=/人員配置最適化提案/');
  await expect(pageTitle).toBeVisible();

  // 拠点選択ドロップダウンが表示されていることを確認
  const siteFilter = page.locator('[data-testid="site-filter"]');
  await expect(siteFilter).toBeVisible();

  // チーム選択ドロップダウンが表示されていることを確認
  // 人員配置最適化提案画面のチーム選択要素を確認
  const teamFilter = page.locator('text=/チーム/')
    .or(page.locator('select'))
    .first();
  await expect(teamFilter).toBeVisible();

  // 配置提案テーブルが表示されていることを確認
  const assignmentDetailTable = page.locator('[data-testid="assignment-detail-table"]');
  await expect(assignmentDetailTable).toBeVisible();

  // テーブル内に配置対象者（作業者名）が表示されていることを確認
  const assignmentDetailTbody = page.locator('#assignment-detail-tbody');
  await expect(assignmentDetailTbody).toBeVisible();

  // テーブル行が存在することを確認
  const tableRows = assignmentDetailTbody.locator('tr');
  await expect(tableRows.first()).toBeVisible();

  // テーブル内に推奨配置先が表示されていることを確認
  const assignmentCells = assignmentDetailTbody.locator('td').filter({ hasText: /東京|大阪|名古屋/ });
  await expect(assignmentCells.first()).toBeVisible();

  // テーブル内に推奨理由が表示されていることを確認
  const reasonCells = assignmentDetailTbody.locator('td').filter({ hasText: /理由|推奨|スキル|経験/ });
  await expect(reasonCells.first()).toBeVisible();

  // 認証エラーメッセージが表示されていないことを確認
  const errorBanner = page.locator('#error-banner');
  await expect(errorBanner).not.toBeVisible();

  // セッション切断警告が表示されていないことを確認
  const sessionWarning = page.locator('text=/セッション|切断|認証エラー/');
  await expect(sessionWarning).not.toBeVisible();

  // ログアウトボタン（ユーザーが認証状態であることの証）が存在することを確認
  await expect(logoutButton).toBeVisible();
});