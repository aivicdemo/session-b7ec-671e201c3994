import { test, expect } from '@playwright/test';

test.describe('SCEN-859: 最適人員配置案表示', () => {
  test('生成された配置案が画面に整形され、最適人員配置案提案画面に正常に遷移する', async ({ page }) => {
    // ログイン画面にアクセス
    await page.goto('/');
    
    // ログイン処理
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // ログイン後、自動遷移が完了するまで待機
    await page.waitForNavigation();
    
    // 生産性ダッシュボード・分析画面に到達していることを確認
    await expect(page).toHaveURL(/\/panels\/scr-1789461964046/);
    
    // 配置最適化の対象となる作業部門を選択
    const departmentSelector = page.locator('[data-testid="department-selector"]');
    await departmentSelector.click();
    await page.click('text=部門A');
    
    // 期間を選択
    const periodSelector = page.locator('[data-testid="period-selector"]');
    await periodSelector.click();
    await page.click('text=2024年1月');
    
    // 『最適配置案を生成』ボタンをクリック
    await page.click('button:has-text("最適配置案を生成")');
    
    // バックエンド処理の完了を待機
    // APIレスポンスが返ってくるまで待機
    await page.waitForResponse(
      response => response.url().includes('/api/') && response.status() === 200,
      { timeout: 30000 }
    );
    
    // 画面が最適人員配置案提案・実行画面へ自動遷移するまで待機
    await page.waitForNavigation();
    await expect(page).toHaveURL(/\/panels\/scr-1789461978707/);
    
    // ページタイトルが遷移先のものに変更されていることを確認
    await expect(page).toHaveTitle(/最適人員配置案提案・実行画面/);
    
    // ヘッダーが遷移先のものに変更されていることを確認
    const header = page.locator('header, [role="banner"]');
    await expect(header).toContainText(/最適人員配置案/);
    
    // 生成された配置案が表示されていることを確認
    // ①配置対象者の名前と現在配置部門
    const assigneeInfo = page.locator('[data-testid="assignee-info"]');
    await expect(assigneeInfo).toBeVisible();
    const assigneeName = assigneeInfo.locator('[data-testid="assignee-name"]');
    await expect(assigneeName).toHaveText(/.+/);
    const currentDepartment = assigneeInfo.locator('[data-testid="current-department"]');
    await expect(currentDepartment).toHaveText(/.+/);
    
    // ②推奨配置先部門
    const recommendedDepartment = page.locator('[data-testid="recommended-department"]');
    await expect(recommendedDepartment).toBeVisible();
    await expect(recommendedDepartment).toHaveText(/.+/);
    
    // ③配置理由（生産性指標による根拠）
    const placementReason = page.locator('[data-testid="placement-reason"]');
    await expect(placementReason).toBeVisible();
    await expect(placementReason).toHaveText(/.+/);
    
    // ④実行ボタンと承認欄
    const executeButton = page.locator('button:has-text("実行")');
    await expect(executeButton).toBeVisible();
    const approvalField = page.locator('[data-testid="approval-field"]');
    await expect(approvalField).toBeVisible();
    
    // ブラウザの戻るボタンで元の分析画面に戻ることが可能な状態であることを確認
    await page.goBack();
    await expect(page).toHaveURL(/\/panels\/scr-1789461964046/);
  });
});