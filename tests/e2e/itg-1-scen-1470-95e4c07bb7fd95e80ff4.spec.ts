import { test, expect } from '@playwright/test';

test('認可済みユーザーが作業指示・実績管理画面にアクセスすると、認証・認可を経て作業指示一覧が表示される', async ({ page }) => {
  // ログイン画面にアクセス
  await page.goto('/');
  await page.waitForURL(/login|panels/);

  // ログイン画面が表示されている場合はログイン認証を実施
  const loginForm = page.locator('.login-form');
  if (await loginForm.isVisible()) {
    // テストユーザーでログイン
    await page.fill('input[placeholder*="ユーザー"]', 'testuser');
    await page.fill('input[placeholder*="パスワード"]', 'testpassword');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL(/panels/);
  }

  // 作業指示・実績管理画面にナビゲート
  await page.click('text=作業指示・実績管理');
  await page.waitForURL(/scr-1789461813941/);

  // 画面遷移完了を待機
  await page.waitForLoadState('networkidle');

  // (1) 画面タイトルが表示されていることを確認
  const pageTitle = page.locator('text=作業指示・実績管理').first();
  await expect(pageTitle).toBeVisible();

  // (2) 作業指示一覧テーブルが表示されていることを確認
  const workInstructionTable = page.locator('[id="work-instruction-tbody"]');
  await expect(workInstructionTable).toBeVisible();

  // テーブルのカラムヘッダーを確認（指示ID、拠点、チーム、受領状況、進捗率、ハンディターミナル連携ログ）
  const tableContainer = page.locator('[id="work-instruction-tbody"]').locator('..');
  await expect(tableContainer).toContainText('指示ID');
  await expect(tableContainer).toContainText('拠点');
  await expect(tableContainer).toContainText('チーム');
  await expect(tableContainer).toContainText('受領確認状態');
  await expect(tableContainer).toContainText('進捗率');
  await expect(tableContainer).toContainText('ハンディターミナル連携ログ');

  // (3) データが表示される場合、対象拠点またはチームの作業指示が表示されていることを確認
  const tableRows = page.locator('[id="work-instruction-tbody"] tr');
  const rowCount = await tableRows.count();
  // データが存在する場合は行が表示されていることを確認
  if (rowCount > 0) {
    await expect(tableRows.first()).toBeVisible();
  }

  // (4) 画面上にエラーメッセージまたは認可拒否メッセージが表示されていないことを確認
  const errorBanner = page.locator('[id="error-banner"]');
  await expect(errorBanner).not.toBeVisible();

  const errorMessage = page.locator('[id="error-message"]');
  await expect(errorMessage).not.toBeVisible();

  // 認可拒否メッセージが含まれないことを確認
  await expect(page).not.toContainText('認可されていません');
  await expect(page).not.toContainText('アクセス権限がありません');
});