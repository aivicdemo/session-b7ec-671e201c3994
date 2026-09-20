import { test, expect } from '@playwright/test';

test.describe('SCEN-892: ダッシュボードフィルター適用', () => {
  test('フィルター条件の入力値が形式・範囲・論理的妥当性に違反するとき、入力検証エラーで拒否される', async ({ page }) => {
    // ログインして生産性ダッシュボード・分析画面を開く
    await page.goto('/');
    
    // ログイン処理
    await page.fill('input[type="email"], input[name="email"], input[name="username"]', 'testuser@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // ページの遷移を待つ
    await page.waitForLoadState('networkidle');
    
    // ダッシュボード画面へナビゲート
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');

    // フィルター領域が表示されるまで待機
    const filterSection = page.locator('[data-testid="filter-section"], .filter-section, [class*="filter"]').first();
    await filterSection.waitFor({ state: 'visible', timeout: 5000 });

    // フィルター条件の入力フィールド（日付範囲、生産性値範囲など）を特定
    const dateInputs = page.locator('input[type="date"], input[name*="date"], input[placeholder*="日付"]');
    const numberInputs = page.locator('input[type="number"], input[name*="value"], input[name*="productivity"]');
    const startDateInput = page.locator('input[name*="start"], input[name*="from"], input[id*="start"]');
    const endDateInput = page.locator('input[name*="end"], input[name*="to"], input[id*="end"]');
    const minInput = page.locator('input[name*="min"], input[id*="min"]');
    const maxInput = page.locator('input[name*="max"], input[id*="max"]');
    
    const dateInputCount = await dateInputs.count();
    const numberInputCount = await numberInputs.count();
    const rangeInputCount = await startDateInput.count();
    
    expect(dateInputCount + numberInputCount + rangeInputCount).toBeGreaterThan(0);

    // ダッシュボードの初期状態を確認
    const initialCharts = page.locator('[role="img"], canvas, .chart, [class*="chart"]');
    const initialChartCount = await initialCharts.count();

    // テスト1: 形式違反の入力値を入力
    await test.step('形式違反の入力値を入力してエラーを確認', async () => {
      // 日付フィールドに不正なフォーマットを入力（複数フィールドへの同時入力を避ける）
      const dateField = dateInputs.first();
      await dateField.fill('2024-13-45');

      // フィルター適用ボタンを押下
      const applyButton = page.locator('button:has-text("適用"), button:has-text("フィルター"), button[type="submit"]').first();
      await applyButton.click();

      // エラーメッセージが表示されることを確認
      const errorMessage = page.locator('[role="alert"], .error-message, [class*="error"]').first();
      await errorMessage.waitFor({ state: 'visible', timeout: 5000 });
      const errorText = await errorMessage.textContent();
      expect(errorText).toBeTruthy();
      
      // エラーメッセージが空でないことを確認
      const trimmedError = (errorText || '').trim();
      expect(trimmedError.length).toBeGreaterThan(0);

      // エラーメッセージが日本語を含むことを確認
      expect(trimmedError).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/);

      // ダッシュボードの表示内容が変更されていないことを確認（入力前の状態と同じ）
      const currentCharts = page.locator('[role="img"], canvas, .chart, [class*="chart"]');
      const currentChartCount = await currentCharts.count();
      expect(currentChartCount).toBe(initialChartCount);
    });

    // テスト2: 論理的に矛盾した入力値を入力
    await test.step('論理的矛盾のある入力値を入力してエラーを確認', async () => {
      // フィルターをリセット
      const filterSection = page.locator('[data-testid="filter-section"], .filter-section, [class*="filter"]').first();
      await filterSection.waitFor({ state: 'visible', timeout: 5000 });

      // 再度初期状態のチャート数を確認（形式違反テスト後も変わっていないはず）
      const chartsBeforeLogicalTest = page.locator('[role="img"], canvas, .chart, [class*="chart"]');
      const chartCountBeforeLogicalTest = await chartsBeforeLogicalTest.count();

      // 開始日が終了日より後の日付範囲を入力
      const startInput = startDateInput.first();
      const endInput = endDateInput.first();
      
      await startInput.fill('2024-12-31');
      await endInput.fill('2024-01-01');

      // フィルター適用ボタンを押下
      const applyButton = page.locator('button:has-text("適用"), button:has-text("フィルター"), button[type="submit"]').first();
      await applyButton.click();

      // 論理的矛盾を指摘する日本語のエラーメッセージが表示されることを確認
      const errorMessage = page.locator('[role="alert"], .error-message, [class*="error"]').first();
      await errorMessage.waitFor({ state: 'visible', timeout: 5000 });
      const errorText = await errorMessage.textContent();
      expect(errorText).toBeTruthy();
      
      // エラーメッセージが空でないことを確認
      const trimmedError = (errorText || '').trim();
      expect(trimmedError.length).toBeGreaterThan(0);

      // エラーメッセージが日本語を含むことを確認
      expect(trimmedError).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/);

      // ダッシュボードの表示内容が変更されていないことを確認（入力前の状態と同じ）
      const currentCharts = page.locator('[role="img"], canvas, .chart, [class*="chart"]');
      const currentChartCount = await currentCharts.count();
      expect(currentChartCount).toBe(chartCountBeforeLogicalTest);
    });
  });
});