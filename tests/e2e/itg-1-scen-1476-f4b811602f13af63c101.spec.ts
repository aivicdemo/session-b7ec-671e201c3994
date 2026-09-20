import { test, expect } from '@playwright/test';

test('SCEN-1476: 作業実績データから生産性指標が計算され、作業者別実績サマリーが画面に表示される', async ({ page }) => {
  // 作業指示・実績管理画面を開く
  await page.goto('/panels/scr-1789461813941.html');

  // 画面の読み込みが完了するまで待機する
  await page.waitForLoadState('networkidle');

  // 画面に『作業者別実績サマリー』セクションが表示されていることを確認する
  const workerSummaryList = page.locator('#worker-summary-list');
  await expect(workerSummaryList).toBeVisible();

  // 表示されている実績サマリーテーブルの内容を確認する
  // WK001行に『150』（実績数）、『75』（時間当たり処理数）、『98%』（品質スコア）、『0.92』（習熟度）が表示されていることを視認する
  const wk001Row = workerSummaryList.locator('text=/WK001/');
  await expect(wk001Row).toBeVisible();
  await expect(wk001Row.locator('text=/150/')).toBeVisible();
  await expect(wk001Row.locator('text=/75/')).toBeVisible();
  await expect(wk001Row.locator('text=/98%/')).toBeVisible();
  await expect(wk001Row.locator('text=/0.92/')).toBeVisible();

  // 表示されている実績サマリーテーブルのWK002行に『120』（実績数）、『60』（時間当たり処理数）、『95%』（品質スコア）、『0.85』（習熟度）が表示されていることを視認する
  const wk002Row = workerSummaryList.locator('text=/WK002/');
  await expect(wk002Row).toBeVisible();
  await expect(wk002Row.locator('text=/120/')).toBeVisible();
  await expect(wk002Row.locator('text=/60/')).toBeVisible();
  await expect(wk002Row.locator('text=/95%/')).toBeVisible();
  await expect(wk002Row.locator('text=/0.85/')).toBeVisible();

  // 『生産性指標』セクションが画面に存在することを確認する
  const productivitySection = page.locator('#productivity-list');
  await expect(productivitySection).toBeVisible();

  // 生産性指標として、チーム全体の平均生産性（時間当たり処理数の平均値）が数値で表示されていることを確認する（表示値：67.5 以上の精度で表示）
  const avgProductivity = productivitySection.locator('text=/67.5/');
  await expect(avgProductivity).toBeVisible();

  // 生産性指標として、チーム全体の平均品質スコアが数値で表示されていることを確認する（表示値：96.5% 以上の精度で表示）
  const avgQualityScore = productivitySection.locator('text=/96.5%/');
  await expect(avgQualityScore).toBeVisible();
});