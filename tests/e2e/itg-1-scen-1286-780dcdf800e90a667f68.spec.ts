import { test, expect } from '@playwright/test';

test.describe('リスク分析結果確認', () => {
  test('平均生産性が0以下のとき、生産性データ不足の警告メッセージが表示されるが処理は継続される', async ({ page }) => {
    // ログイン画面へ遷移
    await page.goto('/');
    
    // テストユーザーでログイン
    await page.fill('input[placeholder*="ユーザーID"]', 'testuser');
    await page.fill('input[placeholder*="パスワード"]', 'testpassword');
    await page.click('button:has-text("ログイン")');
    
    // ダッシュボード画面の読み込み完了を待機
    await page.waitForURL('**/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');
    
    // Step 2: WMSから作業進捗データを取得し、ダッシュボード表示を確認
    const siteVarianceTable = page.locator('[data-testid="site-variance-table"]');
    await expect(siteVarianceTable).toBeVisible();
    
    // Step 3: リスク分析実行ボタンを押下
    const analyzeButton = page.locator('button:has-text("人員配置を最適化")');
    await expect(analyzeButton).toBeVisible();
    await analyzeButton.click();
    
    // Step 4: 処理実行中のローディング表示を確認
    const loadingIndicator = page.locator('text=読込中');
    await expect(loadingIndicator).toBeVisible({ timeout: 5000 });
    
    // Step 5: リスク分析完了を待機（最大30秒）
    await expect(loadingIndicator).not.toBeVisible({ timeout: 30000 });
    
    // Step 6: 警告メッセージがトースト通知またはバナー形式で表示されたことを確認
    const warningText = page.locator('text=生産性データ不足の警告：平均生産性が0以下のため、データの見直しをお願いします。ただし分析は続行します。');
    await expect(warningText).toBeVisible({ timeout: 10000 });
    
    // Step 7: 詳細確認ボタンの存在を確認
    const detailsButton = page.locator('button:has-text("詳細を確認")');
    await expect(detailsButton).toBeVisible();
    
    // 警告表示後、リスク分析結果が表示されていることを確認
    const riskAssessmentTable = page.locator('[data-testid="risk-assessment-table"]');
    await expect(riskAssessmentTable).toBeVisible();
    
    // 配置案実行ボタンが有効状態で表示されていることを確認
    const executeButton = page.locator('button:has-text("人員配置を最適化")');
    await expect(executeButton).toBeEnabled();
    
    // Step 8: 詳細確認ボタンを押下して警告詳細画面に遷移
    await detailsButton.click();
    
    // 詳細画面への遷移を確認
    await page.waitForURL('**/detail**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // 詳細確認画面の内容を確認
    // 該当拠点・チーム、当該期間の生産性値の一覧が表示されていることを確認
    const detailsContainer = page.locator('[class*="detail"], [id*="detail"], main').first();
    await expect(detailsContainer).toBeVisible();
    
    // 拠点情報の表示を確認
    const siteInfo = detailsContainer.locator('text=/拠点|拠点名/', { exact: false });
    await expect(siteInfo).toBeVisible();
    
    // チーム情報の表示を確認
    const teamInfo = detailsContainer.locator('text=/チーム|チーム名/', { exact: false });
    await expect(teamInfo).toBeVisible();
    
    // 当該期間情報の表示を確認
    const periodInfo = detailsContainer.locator('text=/期間|対象期間/', { exact: false });
    await expect(periodInfo).toBeVisible();
    
    // 生産性値の一覧表示を確認
    const productivityInfo = detailsContainer.locator('text=/生産性|平均生産性/', { exact: false });
    await expect(productivityInfo).toBeVisible();
    
    // 『分析継続』と『手動調整』のアクション選択肢が同じ詳細画面に表示されていることを確認
    const continueAnalysisButton = detailsContainer.locator('button:has-text("分析継続")');
    const manualAdjustButton = detailsContainer.locator('button:has-text("手動調整")');
    
    await expect(continueAnalysisButton).toBeVisible();
    await expect(manualAdjustButton).toBeVisible();
  });
});