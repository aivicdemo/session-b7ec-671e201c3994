import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-891: ダッシュボードフィルター適用', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('権限のないユーザーがフィルター操作を実行しようとすると、権限エラーで拒否される', async () => {
    // Step 1: テストユーザーとしてシステムにログインする（権限レベル：閲覧のみユーザー）
    await page.goto('/');
    
    // ログインフォームに入力
    await page.fill('input[name="username"]', 'viewer_user');
    await page.fill('input[name="password"]', 'password123');
    
    // ログインボタンをクリック
    await page.click('button[type="submit"]');
    
    // ログイン後の自動遷移を待つ
    await page.waitForNavigation();

    // Step 2: 生産性ダッシュボード・分析画面を開く
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');

    // ダッシュボード表示内容を操作前に保存
    const dashboardContent = page.locator('[data-testid="dashboard-content"]');
    const contentBeforeFilter = await dashboardContent.innerHTML();

    // Step 3: フィルター要素をクリックして操作しようとする
    // 部門フィルターをクリック
    const departmentFilter = page.locator('[data-testid="filter-department"]');
    await departmentFilter.click();
    
    // フィルター選択肢を変更
    const filterOption = page.locator('[data-testid="filter-option"]').first();
    await filterOption.click();

    // Step 4: フィルター適用ボタン（確定ボタン）を押下する
    // HTTP 403 エラーのレスポンスをインターセプト
    let forbiddenErrorCaught = false;
    page.on('response', (response) => {
      if (response.status() === 403) {
        forbiddenErrorCaught = true;
      }
    });

    const applyButton = page.locator('[data-testid="filter-apply-button"]');
    await applyButton.click();

    // Expected Result: エラーメッセージが表示される
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('この操作を実行する権限がありません。管理者に連絡してください。');

    // ダッシュボードの表示内容が操作前のまま保持されることを確認
    // （フィルター変更が反映されていないことを確認）
    const contentAfterFilter = await dashboardContent.innerHTML();
    expect(contentAfterFilter).toBe(contentBeforeFilter);

    // HTTP 403 Forbidden エラーが記録されたことを確認
    expect(forbiddenErrorCaught).toBe(true);
  });
});