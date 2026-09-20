import { test, expect } from '@playwright/test';

test('生産性指標が統合された後、集約された進捗データから遅延リスクが判定される', async ({ page }) => {
  // 進捗・人員配置ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  
  // 複数拠点の作業進捗データと作業者ごとの生産性指標がWMSおよびハンディターミナルから自動取得されるまで待機
  await page.waitForLoadState('networkidle');
  
  // ダッシュボード画面で、各拠点・チーム・作業指示単位の進捗データが集約状態で表示されていることを確認
  const siteVarianceTable = page.locator('[id="site-variance-tbody"]');
  await expect(siteVarianceTable).toBeVisible();
  const siteVarianceRows = page.locator('[id="site-variance-tbody"] tr');
  await expect(siteVarianceRows.first()).toBeVisible();
  
  const teamVarianceTable = page.locator('[id="team-variance-tbody"]');
  await expect(teamVarianceTable).toBeVisible();
  const teamVarianceRows = page.locator('[id="team-variance-tbody"] tr');
  await expect(teamVarianceRows.first()).toBeVisible();
  
  const riskAssessmentTable = page.locator('[id="risk-assessment-tbody"]');
  await expect(riskAssessmentTable).toBeVisible();
  
  // リロード前の更新タイムスタンプを取得
  let timestampBefore: string | null = null;
  const timestampElementBefore = page.locator('[id="update-timestamp"]');
  if (await timestampElementBefore.isVisible().catch(() => false)) {
    timestampBefore = await timestampElementBefore.textContent();
  }
  
  // ダッシュボード画面を自動更新またはリロード
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  // リスク判定結果が画面に反映されるまで待機
  await page.waitForTimeout(1000);
  
  // リロード後の更新タイムスタンプを取得
  const timestampElement = page.locator('[id="update-timestamp"]');
  const timestampAfter = await timestampElement.textContent();
  
  // 画面上の『進捗遅延リスク』セクションを確認
  const kpiRiskCount = page.locator('[data-testid="kpi-risk-count"]');
  await expect(kpiRiskCount).toBeVisible();
  
  // 集約された進捗データと生産性指標に基づいて計算された遅延確率が数値（パーセンテージ）で表示されることを確認
  const riskCountText = await kpiRiskCount.textContent();
  expect(riskCountText).toBeTruthy();
  // リスクカウントがパーセンテージ形式で表示されていることを確認（例：「遅延リスク：72%」）
  expect(riskCountText).toMatch(/\d+%/);
  
  // 『対応が必要な拠点』と『推奨調整内容』が表示されていることを確認
  const recommendedActions = page.locator('[id="recommended-actions"]');
  await expect(recommendedActions).toBeVisible();
  const recommendedActionsText = await recommendedActions.textContent();
  expect(recommendedActionsText).toBeTruthy();
  expect(recommendedActionsText?.length).toBeGreaterThan(0);
  
  // 『対応が必要な拠点』と『推奨調整内容』が文字列で表示されていることを確認
  expect(recommendedActionsText).toMatch(/拠点|調整/);
  
  // リスク評価テーブルに遅延リスク関連データが表示されていることを確認
  const riskAssessmentTableRows = page.locator('[id="risk-assessment-tbody"] tr');
  const rowCount = await riskAssessmentTableRows.count();
  expect(rowCount).toBeGreaterThan(0);
  
  // 画面の更新タイムスタンプが最新の時刻を示していることを確認
  expect(timestampAfter).toBeTruthy();
  // リロード前後でタイムスタンプが異なることを確認（古いキャッシュデータではなく最新データであることを検証）
  if (timestampBefore) {
    expect(timestampAfter).not.toEqual(timestampBefore);
  }
  
  // リロード後の最新データが反映されていることを確認
  const riskCountTextAfter = await kpiRiskCount.textContent();
  expect(riskCountTextAfter).toBeTruthy();
  expect(riskCountTextAfter).toMatch(/\d+%/);
  
  // リスク関連情報が表示されていることを最終確認
  await expect(kpiRiskCount).toContainText(/\d+%/);
  await expect(recommendedActions).not.toBeEmpty();
});