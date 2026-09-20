import { test, expect } from '@playwright/test';

test.describe('SCEN-905: 配置案詳細表示', () => {
  test('配置案詳細表示で、対象作業者の現在の配置計画情報が参照され、変更前後の比較データが表示される', async ({ page }) => {
    // ログイン画面へ遷移
    await page.goto('/');
    
    // ログイン処理
    await page.fill('input[name="userId"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    
    // ログイン後の自動遷移を待機
    await page.waitForNavigation();

    test.step('最適人員配置案提案・実行画面へ遷移する', async () => {
      // 最適人員配置案提案・実行画面へ移動
      await page.goto('/panels/scr-1789461978707.html');
      await page.waitForLoadState('networkidle');
    });

    test.step('配置案一覧から対象作業者の配置案を選択し、詳細表示ボタンをクリックする', async () => {
      // 配置案一覧が表示されるまで待機
      await page.waitForSelector('[data-testid="allocation-list"]', { timeout: 10000 });
      
      // 配置案一覧から最初の項目を選択
      const allocationItem = await page.locator('[data-testid="allocation-item"]').first();
      await allocationItem.click();
      
      // 詳細表示ボタンをクリック
      const detailButton = await page.locator('button:has-text("詳細表示")');
      await detailButton.click();
    });

    test.step('配置案詳細画面が表示されるまで待機する', async () => {
      // 配置案詳細画面が表示されるまで待機
      await page.waitForSelector('[data-testid="allocation-detail"]', { timeout: 10000 });
    });

    // 期待結果の検証
    // (1) 対象作業者の現在の配置計画情報が表示されている
    const currentAllocationInfo = await page.locator('[data-testid="current-allocation-info"]');
    await expect(currentAllocationInfo).toBeVisible();
    
    // 配置部門の情報が表示されている
    const departmentInfo = await page.locator('[data-testid="current-department"]');
    await expect(departmentInfo).toBeVisible();
    
    // 配置日時の情報が表示されている
    const allocationDateTime = await page.locator('[data-testid="current-allocation-datetime"]');
    await expect(allocationDateTime).toBeVisible();
    
    // 割当作業タイプの情報が表示されている
    const taskTypeInfo = await page.locator('[data-testid="current-task-type"]');
    await expect(taskTypeInfo).toBeVisible();

    // (2) 変更前の配置データが表示されている
    const beforeAllocationData = await page.locator('[data-testid="before-allocation-data"]');
    await expect(beforeAllocationData).toBeVisible();
    
    const beforeDepartment = await page.locator('[data-testid="before-department"]');
    await expect(beforeDepartment).toBeVisible();
    
    const beforeTaskType = await page.locator('[data-testid="before-task-type"]');
    await expect(beforeTaskType).toBeVisible();

    // (3) 変更後の配置データが表示されている
    const afterAllocationData = await page.locator('[data-testid="after-allocation-data"]');
    await expect(afterAllocationData).toBeVisible();
    
    const afterDepartment = await page.locator('[data-testid="after-department"]');
    await expect(afterDepartment).toBeVisible();
    
    const afterTaskType = await page.locator('[data-testid="after-task-type"]');
    await expect(afterTaskType).toBeVisible();

    // (4) 変更前後を並べて比較できるレイアウトまたは比較表示領域が存在する
    const comparisonArea = await page.locator('[data-testid="comparison-area"]');
    await expect(comparisonArea).toBeVisible();
    
    // 変更前後の要素が並べて表示されていることを確認
    const beforeSection = await page.locator('[data-testid="before-section"]');
    const afterSection = await page.locator('[data-testid="after-section"]');
    
    await expect(beforeSection).toBeVisible();
    await expect(afterSection).toBeVisible();
  });
});