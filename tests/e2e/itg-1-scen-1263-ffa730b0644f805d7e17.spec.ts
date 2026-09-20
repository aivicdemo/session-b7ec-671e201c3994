import { test, expect } from '@playwright/test';

test('SCEN-1263: 進捗遅延リスク分析実行中のSageMaker連携失敗時にキャッシュ結果が表示される', async ({ page }) => {
  // ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');

  // API応答をインターセプトしてSageMaker連携を失敗させるようにスタブを設定
  await page.route('**/api/**/predictDelayRisk*', route => {
    route.abort('timedout');
  });

  // 進捗遅延リスク分析の実行ボタンをクリック
  const optimizeButton = page.getByTestId('optimize-button');
  await optimizeButton.click();
  
  // エラーメッセージが表示されるまで待つ
  const errorMessage = page.locator('text=リスク判定エンジンが一時的に利用できません。前回の判定結果を表示しています');
  await expect(errorMessage).toBeVisible({ timeout: 10000 });

  // ダッシュボード上の進捗遅延リスク数値がキャッシュ結果で表示されていることを確認
  const kpiRiskCount = page.getByTestId('kpi-risk-count');
  await expect(kpiRiskCount).toBeVisible();
  
  const riskValue = await kpiRiskCount.textContent();
  expect(riskValue).toBeTruthy();

  // 配置案リストがキャッシュ結果で表示されていることを確認
  const activePlansTable = page.getByTestId('active-plans-table');
  await expect(activePlansTable).toBeVisible();

  // テーブル内容を確認
  const tableRows = page.locator('[id="active-plans-tbody"] tr');
  await expect(tableRows.first()).toBeVisible();
  const rowCount = await tableRows.count();
  expect(rowCount).toBeGreaterThan(0);

  // 古い配置案に対して「更新待機中」の注記が付与されていることを確認
  const updateWaitingNotes = page.locator('text=更新待機中');
  await expect(updateWaitingNotes).toBeVisible();
  const notesCount = await updateWaitingNotes.count();
  expect(notesCount).toBeGreaterThan(0);

  // リスク評価テーブル（優先度ランキング）が表示されていることを確認
  const riskAssessmentTable = page.getByTestId('risk-assessment-table');
  await expect(riskAssessmentTable).toBeVisible();

  // 推奨アクションが表示されていることを確認
  const recommendedActions = page.locator('#recommended-actions');
  await expect(recommendedActions).toBeVisible();
  
  const actionItems = recommendedActions.locator('li, div[role="listitem"]');
  const actionCount = await actionItems.count();
  expect(actionCount).toBeGreaterThan(0);

  // キャッシュ結果に付与されたタイムスタンプが確認できることを検証
  // エラーメッセージまたはダッシュボード内にタイムスタンプが表示されている
  const dashboardCard = page.locator('.card');
  const cardContent = await dashboardCard.first().textContent();
  const timestampPattern = /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/;
  expect(timestampPattern.test(cardContent || '')).toBeTruthy();
});