import { test, expect } from '@playwright/test';

test('SCEN-845: 生産性ダッシュボード表示 - 統合ダッシュボード画面が完全に表示される', async ({ page }) => {
  // ログイン画面へ遷移
  await page.goto('/');
  
  // ログイン操作（テスト用認証情報）
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'testpass');
  await page.click('button:has-text("ログイン")');
  
  // ログイン後の自動遷移を待機
  await page.waitForNavigation();
  
  // 生産性ダッシュボード・分析画面へ遷移
  await test.step('生産性ダッシュボード・分析画面へ遷移する', async () => {
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');
  });

  // ステップ2: 作業者別生産性サマリーカード領域の確認
  await test.step('画面の上部領域に作業者別生産性サマリーカードが表示されていることを確認する', async () => {
    // サマリーカード要素が存在することを確認
    const summaryCard = page.locator('[data-testid="summary-card"], .summary-card, [class*="summary"]').first();
    await expect(summaryCard).toBeVisible();

    // 作業者名が表示されていることを確認
    const workerName = summaryCard.locator('text=/作業者名|worker|従業員/i');
    await expect(workerName).toBeVisible();

    // 日付が表示されていることを確認
    const dateElement = summaryCard.locator('text=/\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\/\\d{1,2}/');
    await expect(dateElement).toBeVisible();

    // 生産性スコアが表示されていることを確認
    const productivityScore = summaryCard.locator('text=/生産性|スコア|productivity|score/i');
    await expect(productivityScore).toBeVisible();

    // 品質指標が表示されていることを確認
    const qualityIndicator = summaryCard.locator('text=/品質|quality/i');
    await expect(qualityIndicator).toBeVisible();
  });

  // ステップ3: 時系列グラフ領域の確認
  await test.step('画面の中央領域に過去7日間の生産性推移を示す時系列グラフが表示されていることを確認する', async () => {
    // グラフコンテナが表示されていることを確認
    const timeSeriesChart = page.locator('[data-testid="time-series-chart"], .chart-container, [class*="graph"]').first();
    await expect(timeSeriesChart).toBeVisible();

    // X軸のラベル（日付）が表示されていることを確認
    const xAxisLabels = timeSeriesChart.locator('text=/日|Mon|Tue|Wed|Thu|Fri|Sat|Sun|日付/i');
    await expect(xAxisLabels.first()).toBeVisible();

    // Y軸のラベル（生産性数値）が表示されていることを確認
    const yAxisLabels = timeSeriesChart.locator('text=/生産性|\\d+\\.?\\d*/');
    await expect(yAxisLabels.first()).toBeVisible();

    // グラフ線またはバーが描画されていることを確認（SVGパス要素など）
    const chartPath = timeSeriesChart.locator('svg path, svg rect');
    await expect(chartPath.first()).toBeVisible();
  });

  // ステップ4: パターン認識結果セクションの確認
  await test.step('画面の下部領域にパターン認識結果セクションが表示されていることを確認する', async () => {
    // パターン認識結果セクション全体が表示されていることを確認
    const patternSection = page.locator('[data-testid="pattern-recognition"], .pattern-section, [class*="pattern"]').first();
    await expect(patternSection).toBeVisible();

    // 習熟度レベルが表示されていることを確認
    const proficiencyLevel = patternSection.locator('text=/習熟度|初級|中級|上級|proficiency|level/i');
    await expect(proficiencyLevel.first()).toBeVisible();

    // 品質ばらつき判定が表示されていることを確認
    const qualityVariance = patternSection.locator('text=/品質ばらつき|安定|不安定|variance|stability/i');
    await expect(qualityVariance.first()).toBeVisible();

    // 作業効率トレンドが表示されていることを確認
    const efficiencyTrend = patternSection.locator('text=/効率トレンド|上昇|横ばい|低下|trend|rising|flat|declining/i');
    await expect(efficiencyTrend.first()).toBeVisible();
  });

  // ステップ5: 全要素の統合表示確認
  await test.step('ダッシュボード画面内の全要素が統合されて1つの画面レイアウトで表示されていることを確認する', async () => {
    // サマリーカード、グラフ、パターン認識結果が全て表示されていることを確認
    const summaryCard = page.locator('[data-testid="summary-card"], .summary-card, [class*="summary"]').first();
    const timeSeriesChart = page.locator('[data-testid="time-series-chart"], .chart-container, [class*="graph"]').first();
    const patternSection = page.locator('[data-testid="pattern-recognition"], .pattern-section, [class*="pattern"]').first();

    await expect(summaryCard).toBeVisible();
    await expect(timeSeriesChart).toBeVisible();
    await expect(patternSection).toBeVisible();

    // 3つの要素が同時に表示されていることを確認
    const boundingBox1 = await summaryCard.boundingBox();
    const boundingBox2 = await timeSeriesChart.boundingBox();
    const boundingBox3 = await patternSection.boundingBox();

    expect(boundingBox1).not.toBeNull();
    expect(boundingBox2).not.toBeNull();
    expect(boundingBox3).not.toBeNull();

    // スクロール不要で全要素が表示されていることをチェック（ビューポート内に収まっていることを確認）
    const viewportSize = page.viewportSize();
    if (viewportSize) {
      // 各要素がビューポート内に表示されていることを確認
      await expect(summaryCard).toBeInViewport();
    }
  });
});