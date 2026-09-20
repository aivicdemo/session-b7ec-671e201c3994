import { test, expect } from '@playwright/test';

test('SCEN-897: 配置案確認画面表示 - 各作業者の初期割当情報が取得され、割当結果と実績の比較基準が準備される', async ({ page }) => {
  // 生産性ダッシュボード・分析画面にアクセスする
  await page.goto('/panels/scr-1789461964046.html');
  await page.waitForLoadState('networkidle');

  // 作業者一覧が表示されるまで待つ
  await expect(page.locator('[data-testid="worker-list"], .worker-list, [class*="worker"]')).toBeVisible({ timeout: 10000 }).catch(() => null);

  // 作業者一覧から対象作業者を選択する
  const workerItems = page.locator('[data-testid="worker-item"], .worker-item, tr[data-worker-id]');
  const workerCount = await workerItems.count();
  
  if (workerCount === 0) {
    // フォールバック: 最初に見つかる選択可能な要素を選択
    const selectableWorker = page.locator('button, a, [role="button"]').filter({ has: page.locator('text=/作業者|worker/i') }).first();
    await selectableWorker.click();
  } else {
    // 最初の作業者を選択
    await workerItems.first().click();
  }

  // 詳細情報が読み込まれるまで待つ
  await page.waitForLoadState('networkidle');

  // 選択した作業者の詳細情報表示エリアで、初期割当情報が画面に表示されていることを確認する
  const initialAllocationSection = page.locator('[data-testid="initial-allocation"], [class*="initial-allocation"], [class*="割当情報"]').first();
  
  // 初期割当情報の各項目を確認
  const assignmentStartTime = page.locator('text=/割当開始日時|Assignment Start|割当開始/i').first();
  const assignmentTaskType = page.locator('text=/割当作業タイプ|Task Type|作業タイプ/i').first();
  const assignmentDepartment = page.locator('text=/割当部門|Department|部門/i').first();
  const assignmentLocation = page.locator('text=/割当先拠点|Location|拠点/i').first();

  await expect(assignmentStartTime).toBeVisible({ timeout: 10000 });
  await expect(assignmentTaskType).toBeVisible({ timeout: 10000 });
  await expect(assignmentDepartment).toBeVisible({ timeout: 10000 });
  await expect(assignmentLocation).toBeVisible({ timeout: 10000 });

  // 「割当結果と実績の比較」セクションに遷移する、または該当セクションまでスクロールする
  const comparisonSection = page.locator('[data-testid="comparison"], [class*="comparison"], text=/割当結果と実績の比較|Comparison|比較/i').first();
  
  if (comparisonSection) {
    await comparisonSection.scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle');
  }

  // 比較基準として以下の項目が画面上に表示されていることを確認する
  const targetProductivity = page.locator('text=/初期割当時の目標生産性|Target Productivity|目標生産性|個数\/時間/i').first();
  const targetQualityScore = page.locator('text=/初期割当時の目標品質スコア|Target Quality|品質スコア|%/i').first();
  const performanceStartDate = page.locator('text=/実績データの開始日時|Performance Start|実績開始/i').first();
  const performanceEndDate = page.locator('text=/実績データの終了日時|Performance End|実績終了/i').first();
  const comparisonPeriod = page.locator('text=/比較対象期間|Comparison Period|対象期間/i').first();

  await expect(targetProductivity).toBeVisible({ timeout: 10000 });
  await expect(targetQualityScore).toBeVisible({ timeout: 10000 });
  await expect(performanceStartDate).toBeVisible({ timeout: 10000 });
  await expect(performanceEndDate).toBeVisible({ timeout: 10000 });
  await expect(comparisonPeriod).toBeVisible({ timeout: 10000 });

  // 全ての情報要素がHTMLDOMに存在し、視覚的に確認可能な配置で表示されている
  await expect(assignmentStartTime).toBeInViewport();
  await expect(assignmentTaskType).toBeInViewport();
  await expect(assignmentDepartment).toBeInViewport();
  await expect(assignmentLocation).toBeInViewport();
  await expect(targetProductivity).toBeInViewport();
  await expect(targetQualityScore).toBeInViewport();
  await expect(performanceStartDate).toBeInViewport();
  await expect(performanceEndDate).toBeInViewport();
  await expect(comparisonPeriod).toBeInViewport();
});