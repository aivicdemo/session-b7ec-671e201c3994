import { test, expect } from '@playwright/test';

test('SCEN-898: 配置計画に基づく実績記録が取得され、初期割当との乖離が分析される', async ({ page }) => {
  // ログイン画面に遷移
  await page.goto('/');
  
  // ログイン処理
  await page.fill('input[type="email"]', 'testuser@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // ログイン後の自動遷移を待機
  await page.waitForLoadState('networkidle');

  // Step 1: 最適人員配置案提案・実行画面を開く
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');

  // Step 2: 配置計画が確定した状態を確認する（配置案の承認済み状態）
  const deploymentStatus = page.locator('[data-testid="deployment-status"]');
  await expect(deploymentStatus).toContainText('承認済み');

  // Step 3: 作業実績データ記録・入力画面から、配置計画期間に対応する実績データが画面に読み込まれるまで待機する
  await page.goto('/panels/scr-1789461993203.html');
  await page.waitForLoadState('networkidle');
  
  // 実績データの読み込み完了を待機
  const performanceDataTable = page.locator('[data-testid="performance-data-table"]');
  await expect(performanceDataTable).toBeVisible();
  await page.waitForFunction(() => {
    const rows = document.querySelectorAll('[data-testid="performance-data-table"] tbody tr');
    return rows.length > 0;
  });

  // 配置案確認画面に遷移
  await page.goto('/panels/scr-1789461964046.html');
  await page.waitForLoadState('networkidle');

  // 配置案確認画面のデータ読み込み完了を待機
  await page.waitForFunction(() => {
    const initialAssignment = document.querySelector('[data-testid="initial-assignment-section"]');
    const performanceData = document.querySelector('[data-testid="performance-data-section"]');
    const deviationAnalysis = document.querySelector('[data-testid="deviation-analysis-section"]');
    
    if (!initialAssignment || !performanceData || !deviationAnalysis) {
      return false;
    }
    
    const initialWorkers = initialAssignment.querySelectorAll('[data-testid="worker-item"]');
    const performanceItems = performanceData.querySelectorAll('[data-testid="performance-item"]');
    const deviationItems = deviationAnalysis.querySelectorAll('[data-testid="deviation-analysis-item"]');
    
    return initialWorkers.length > 0 && performanceItems.length > 0 && deviationItems.length > 0;
  });

  // Step 4: 配置案確認画面表示領域に、初期割当作業者リストが表示されていることを確認する
  const initialAssignmentSection = page.locator('[data-testid="initial-assignment-section"]');
  await expect(initialAssignmentSection).toBeVisible();
  
  const assignedWorkersList = initialAssignmentSection.locator('[data-testid="assigned-workers-list"]');
  await expect(assignedWorkersList).toBeVisible();
  
  const workerItems = assignedWorkersList.locator('[data-testid="worker-item"]');
  const workerCount = await workerItems.count();
  expect(workerCount).toBeGreaterThan(0);

  // Step 5: 同じ領域に、実績記録データ（実際に担当した作業タイプ・時間・完了数等）が並行表示されていることを確認する
  const performanceDataSection = page.locator('[data-testid="performance-data-section"]');
  await expect(performanceDataSection).toBeVisible();
  
  const performanceItems = performanceDataSection.locator('[data-testid="performance-item"]');
  const performanceCount = await performanceItems.count();
  expect(performanceCount).toBeGreaterThan(0);
  
  // 実績データに作業タイプ、時間、完了数が含まれていることを確認
  for (let i = 0; i < performanceCount; i++) {
    const item = performanceItems.nth(i);
    await expect(item.locator('[data-testid="work-type"]')).toBeVisible();
    await expect(item.locator('[data-testid="work-hours"]')).toBeVisible();
    await expect(item.locator('[data-testid="completion-count"]')).toBeVisible();
  }

  // Step 6: 初期割当と実績の差異を示す分析結果が乖離分析セクションに表示されることを確認する
  const deviationAnalysisSection = page.locator('[data-testid="deviation-analysis-section"]');
  await expect(deviationAnalysisSection).toBeVisible();
  
  // 予定作業時間 vs 実績作業時間の比較表示
  const plannedTimeComparison = deviationAnalysisSection.locator('[data-testid="planned-vs-actual-time"]');
  await expect(plannedTimeComparison).toBeVisible();
  
  // 予定生産数 vs 実績生産数の比較表示
  const plannedProductionComparison = deviationAnalysisSection.locator('[data-testid="planned-vs-actual-production"]');
  await expect(plannedProductionComparison).toBeVisible();

  // Step 7: 乖離分析セクションのデータ更新が完了し、すべての作業者の実績比較情報が画面に反映されたことを確認する
  await page.waitForFunction(() => {
    const items = document.querySelectorAll('[data-testid="deviation-analysis-section"] [data-testid="deviation-analysis-item"]');
    if (items.length === 0) {
      return false;
    }
    
    for (let i = 0; i < items.length; i++) {
      const difference = items[i].querySelector('[data-testid="deviation-difference"]');
      const rate = items[i].querySelector('[data-testid="deviation-rate"]');
      if (!difference || !rate) {
        return false;
      }
    }
    return true;
  });

  const deviationAnalysisItems = deviationAnalysisSection.locator('[data-testid="deviation-analysis-item"]');
  const deviationItemCount = await deviationAnalysisItems.count();
  expect(deviationItemCount).toBeGreaterThan(0);
  
  // すべての分析アイテムが差分値と乖離率を含むことを確認
  for (let i = 0; i < deviationItemCount; i++) {
    const item = deviationAnalysisItems.nth(i);
    await expect(item.locator('[data-testid="deviation-difference"]')).toBeVisible();
    await expect(item.locator('[data-testid="deviation-rate"]')).toBeVisible();
  }

  // 最終確認：画面が静止状態（読み込み完了）であることを確認
  await page.waitForLoadState('networkidle');
  
  // 配置案確認画面全体が表示されていることを確認
  const confirmationScreen = page.locator('[data-testid="deployment-confirmation-screen"]');
  await expect(confirmationScreen).toBeVisible();
  
  // 初期割当リストと実績データと乖離分析が並行表示されていることを確認
  await expect(initialAssignmentSection).toBeVisible();
  await expect(performanceDataSection).toBeVisible();
  await expect(deviationAnalysisSection).toBeVisible();
});