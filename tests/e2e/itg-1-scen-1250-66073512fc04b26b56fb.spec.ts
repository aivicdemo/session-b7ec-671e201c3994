import { test, expect } from '@playwright/test';

test('SCEN-1250: 進捗遅延リスク分析実行', async ({ page }) => {
  // ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');

  // 「進捗遅延リスク分析実行」ボタンが表示されていることを確認
  const analyzeButton = page.getByTestId('optimize-button');
  await expect(analyzeButton).toBeVisible();

  // ボタンがクリック可能な状態であることを確認
  await expect(analyzeButton).toBeEnabled();

  // 「進捗遅延リスク分析実行」ボタンをクリック
  await analyzeButton.click();

  // ボタンがクリック受け付けられ、入力フォーカスが遮断される（ローディング状態）ことを確認
  await expect(analyzeButton).toBeDisabled();

  // ダッシュボード上に「リスク判定中...」の進行インジケータが表示されることを確認
  const loadingIndicator = page.locator('text=リスク判定中');
  await expect(loadingIndicator).toBeVisible({ timeout: 5000 });

  // リスク判定が完了し、ローディング表示が消える
  await expect(loadingIndicator).toBeHidden({ timeout: 30000 });

  // ダッシュボード内に拠点別のリスク判定結果が表示される行を確認
  const riskAssessmentTable = page.locator('#risk-assessment-tbody');
  await expect(riskAssessmentTable).toBeVisible();

  // テーブルの行を取得
  const rows = riskAssessmentTable.locator('tr');
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);

  // 最後の行（新しく追加された行）のセル内容を検証
  const lastRow = rows.nth(rowCount - 1);

  // 拠点名「A」を確認
  const siteNameCell = lastRow.locator('td').nth(0);
  await expect(siteNameCell).toContainText('A');

  // チーム名「X」を確認
  const teamNameCell = lastRow.locator('td').nth(1);
  await expect(teamNameCell).toContainText('X');

  // 納期遅延確率「35%」を確認
  const delayProbabilityCell = lastRow.locator('td').nth(2);
  await expect(delayProbabilityCell).toContainText('35%');

  // 進捗率「62.5%」を確認
  const progressRateCell = lastRow.locator('td').nth(3);
  await expect(progressRateCell).toContainText('62.5%');

  // リスク評価「中」を確認
  const riskLevelCell = lastRow.locator('td').nth(4);
  await expect(riskLevelCell).toContainText('中');

  // ボタンが再度クリック可能な状態に戻っていることを確認
  await expect(analyzeButton).toBeEnabled();
});