import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-906: 配置案詳細表示', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/');
    
    // ログイン処理
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    await page.waitForNavigation();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('配置案詳細表示で、対象作業者の過去生産性データが参照され、配置案の根拠と現在の実績が詳細に表示される', async () => {
    // 最適人員配置案提案・実行画面を開く
    await test.step('最適人員配置案提案・実行画面を開く', async () => {
      await page.goto('/panels/scr-1789461978707.html');
      await page.waitForLoadState('networkidle');
    });

    // システムに生成済みの配置案一覧が表示されていることを確認する
    await test.step('配置案一覧が表示されていることを確認する', async () => {
      const placementList = page.locator('[data-testid="placement-list"], .placement-list, table');
      await expect(placementList).toBeVisible();
      const rows = page.locator('tbody tr, [data-testid="placement-item"]');
      await expect(rows.first()).toBeVisible();
    });

    // 配置案一覧から1件の配置案を選択し、詳細表示ボタンをクリックする
    await test.step('配置案を選択して詳細表示ボタンをクリックする', async () => {
      const firstPlacementRow = page.locator('tbody tr, [data-testid="placement-item"]').first();
      await firstPlacementRow.click();
      
      const detailButton = page.locator('button:has-text("詳細表示"), button:has-text("詳細"), [data-testid="detail-button"]').first();
      await detailButton.click();
      await page.waitForLoadState('networkidle');
    });

    // 配置案詳細画面が開き、対象作業者名、割当作業タイプ、推奨ポジション、配置開始日時が表示されていることを確認する
    await test.step('詳細画面の基本情報が表示されていることを確認する', async () => {
      const detailScreen = page.locator('[data-testid="placement-detail"], .placement-detail');
      await expect(detailScreen).toBeVisible();
      
      const workerName = page.locator('[data-testid="worker-name"], .worker-name');
      await expect(workerName).toBeVisible();
      
      const taskType = page.locator('[data-testid="task-type"], .task-type');
      await expect(taskType).toBeVisible();
      
      const position = page.locator('[data-testid="recommended-position"], .recommended-position');
      await expect(position).toBeVisible();
      
      const startDateTime = page.locator('[data-testid="start-datetime"], .start-datetime');
      await expect(startDateTime).toBeVisible();
    });

    // 詳細画面内の『過去生産性データ』セクションを視認する
    await test.step('過去生産性データセクションが表示されていることを確認する', async () => {
      const pastDataSection = page.locator('[data-testid="past-productivity-section"], .past-productivity-section, text="過去生産性データ"').first();
      await expect(pastDataSection).toBeVisible();
    });

    // 過去生産性データセクションに、対象作業者の過去30日間の日別生産性実績が表示されていることを確認する
    await test.step('過去30日間の日別生産性データが表形式で表示されていることを確認する', async () => {
      const productivityTable = page.locator('[data-testid="past-productivity-table"], .past-productivity-table tbody, [data-testid="past-productivity-section"] table');
      await expect(productivityTable).toBeVisible();
      
      const rows = page.locator('[data-testid="past-productivity-section"] tbody tr, [data-testid="past-productivity-table"] tbody tr');
      await expect(rows.first()).toBeVisible();
      
      const dateColumn = page.locator('[data-testid="past-productivity-section"] th:has-text("日付"), [data-testid="past-productivity-table"] th:has-text("日付")');
      await expect(dateColumn).toBeVisible();
      
      const processCountColumn = page.locator('[data-testid="past-productivity-section"] th:has-text("処理件数"), [data-testid="past-productivity-table"] th:has-text("処理件数")');
      await expect(processCountColumn).toBeVisible();
      
      const timeColumn = page.locator('[data-testid="past-productivity-section"] th:has-text("処理時間"), [data-testid="past-productivity-table"] th:has-text("処理時間")');
      await expect(timeColumn).toBeVisible();
      
      const qualityColumn = page.locator('[data-testid="past-productivity-section"] th:has-text("品質スコア"), [data-testid="past-productivity-table"] th:has-text("品質スコア")');
      await expect(qualityColumn).toBeVisible();
    });

    // 詳細画面内の『配置根拠』セクションを視認する
    await test.step('配置根拠セクションが表示されていることを確認する', async () => {
      const reasonSection = page.locator('[data-testid="placement-reason-section"], .placement-reason-section, text="配置根拠"').first();
      await expect(reasonSection).toBeVisible();
    });

    // 配置根拠セクションに、習熟度スコア、推定生産性値、品質ばらつき指標値が数値で表示されていることを確認する
    await test.step('配置根拠の数値が表示されていることを確認する', async () => {
      const proficiencyScore = page.locator('[data-testid="proficiency-score"], .proficiency-score, [data-testid="placement-reason-section"] text="習熟度スコア"').first();
      await expect(proficiencyScore).toBeVisible();
      const proficiencyValue = page.locator('[data-testid="proficiency-score-value"], .proficiency-score-value');
      await expect(proficiencyValue).toBeVisible();
      
      const productivityValue = page.locator('[data-testid="estimated-productivity"], .estimated-productivity, [data-testid="placement-reason-section"] text="推定生産性値"').first();
      await expect(productivityValue).toBeVisible();
      const productivityValueNum = page.locator('[data-testid="estimated-productivity-value"], .estimated-productivity-value');
      await expect(productivityValueNum).toBeVisible();
      
      const qualityVariance = page.locator('[data-testid="quality-variance"], .quality-variance, [data-testid="placement-reason-section"] text="品質ばらつき指標値"').first();
      await expect(qualityVariance).toBeVisible();
      const qualityVarianceValue = page.locator('[data-testid="quality-variance-value"], .quality-variance-value');
      await expect(qualityVarianceValue).toBeVisible();
    });

    // 詳細画面内の『現在の実績』セクションを視認する
    await test.step('現在の実績セクションが表示されていることを確認する', async () => {
      const currentPerformanceSection = page.locator('[data-testid="current-performance-section"], .current-performance-section, text="現在の実績"').first();
      await expect(currentPerformanceSection).toBeVisible();
    });

    // 現在の実績セクションに、配置後の当日実績と推定値との差分グラフが表示されていることを確認する
    await test.step('当日実績と推定値との差分グラフが表示されていることを確認する', async () => {
      const performanceMetrics = page.locator('[data-testid="current-performance-section"] [data-testid="performance-metric"], [data-testid="current-performance-section"] .performance-metric');
      await expect(performanceMetrics.first()).toBeVisible();
      
      const processCountMetric = page.locator('[data-testid="current-performance-section"] text="処理件数"').first();
      await expect(processCountMetric).toBeVisible();
      
      const timeMetric = page.locator('[data-testid="current-performance-section"] text="処理時間"').first();
      await expect(timeMetric).toBeVisible();
      
      const qualityMetric = page.locator('[data-testid="current-performance-section"] text="品質スコア"').first();
      await expect(qualityMetric).toBeVisible();
      
      const differenceGraph = page.locator('[data-testid="difference-graph"], .difference-graph, [data-testid="current-performance-section"] svg, [data-testid="current-performance-section"] canvas');
      await expect(differenceGraph.first()).toBeVisible();
    });

    // 全体的な配置案詳細画面の検証
    await test.step('配置案詳細画面が完全に表示されていることを確認する', async () => {
      const detailPage = page.locator('[data-testid="placement-detail"], .placement-detail');
      await expect(detailPage).toBeVisible();
      
      const pastSection = page.locator('[data-testid="past-productivity-section"], .past-productivity-section');
      await expect(pastSection).toBeVisible();
      
      const reasonSection = page.locator('[data-testid="placement-reason-section"], .placement-reason-section');
      await expect(reasonSection).toBeVisible();
      
      const performanceSection = page.locator('[data-testid="current-performance-section"], .current-performance-section');
      await expect(performanceSection).toBeVisible();
    });
  });
});