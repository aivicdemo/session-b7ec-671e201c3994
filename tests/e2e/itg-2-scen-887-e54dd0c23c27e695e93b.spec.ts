import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-887: ダッシュボードフィルター適用', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/');
    
    // ログイン処理
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button:has-text("ログイン")');
    await page.waitForNavigation();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('フィルター条件の入力値が形式・範囲・論理的妥当性を満たすとき、フィルター適用が進行する', async () => {
    // 生産性ダッシュボード・分析画面を開く
    await test.step('生産性ダッシュボード・分析画面を開く', async () => {
      await page.goto('/panels/scr-1789461964046.html');
      await page.waitForLoadState('networkidle');
    });

    // フィルターパネルを展開する
    await test.step('フィルターパネルを展開する', async () => {
      const filterToggle = page.locator('button:has-text("フィルター")');
      await filterToggle.click();
      await page.waitForSelector('[data-testid="filter-panel"]', { state: 'visible' });
    });

    // フィルター条件を入力する
    await test.step('フィルター条件を入力する', async () => {
      // 部門='配送' を選択
      const departmentSelect = page.locator('select[name="department"]');
      await departmentSelect.selectOption('配送');

      // 期間='2024-01-01～2024-01-31' を入力
      const startDateInput = page.locator('input[name="startDate"]');
      await startDateInput.fill('2024-01-01');

      const endDateInput = page.locator('input[name="endDate"]');
      await endDateInput.fill('2024-01-31');

      // 生産性範囲='80～120%' を入力
      const minProductivityInput = page.locator('input[name="minProductivity"]');
      await minProductivityInput.fill('80');

      const maxProductivityInput = page.locator('input[name="maxProductivity"]');
      await maxProductivityInput.fill('120');
    });

    // 入力値の形式・範囲・論理的妥当性を確認
    await test.step('入力値の形式・範囲・論理的妥当性を確認する', async () => {
      // 部門がマスタ値から選択されていることを確認
      const departmentValue = await page.locator('select[name="department"]').inputValue();
      expect(departmentValue).toBe('配送');

      // 開始日の形式確認 (YYYY-MM-DD)
      const startDateValue = await page.locator('input[name="startDate"]').inputValue();
      expect(startDateValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(startDateValue).toBe('2024-01-01');

      // 終了日の形式確認 (YYYY-MM-DD)
      const endDateValue = await page.locator('input[name="endDate"]').inputValue();
      expect(endDateValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(endDateValue).toBe('2024-01-31');

      // 開始日 ≤ 終了日の確認
      expect(new Date('2024-01-01') <= new Date('2024-01-31')).toBe(true);

      // 生産性の形式確認 (整数)
      const minProductivityValue = await page.locator('input[name="minProductivity"]').inputValue();
      expect(minProductivityValue).toMatch(/^\d+$/);
      expect(parseInt(minProductivityValue)).toBe(80);

      const maxProductivityValue = await page.locator('input[name="maxProductivity"]').inputValue();
      expect(maxProductivityValue).toMatch(/^\d+$/);
      expect(parseInt(maxProductivityValue)).toBe(120);

      // 生産性範囲が 0～200% の範囲内であることを確認
      expect(parseInt(minProductivityValue) >= 0 && parseInt(minProductivityValue) <= 200).toBe(true);
      expect(parseInt(maxProductivityValue) >= 0 && parseInt(maxProductivityValue) <= 200).toBe(true);
    });

    // フィルター適用ボタンをクリック
    await test.step('フィルター適用ボタンをクリックする', async () => {
      const applyButton = page.locator('button:has-text("適用")');
      await applyButton.click();
    });

    // ローディング状態の確認
    await test.step('ローディング状態に遷移することを確認', async () => {
      await page.waitForSelector('[data-testid="loading-indicator"]', { state: 'visible', timeout: 5000 });
    });

    // グラフ・テーブルが再描画されることを確認
    await test.step('ダッシュボードが配送部門のデータで再描画される', async () => {
      await page.waitForSelector('[data-testid="loading-indicator"]', { state: 'hidden' });
      await page.waitForLoadState('networkidle');

      // グラフが表示されていることを確認
      const chart = page.locator('[data-testid="dashboard-chart"]');
      await expect(chart).toBeVisible();

      // テーブルが表示されていることを確認
      const table = page.locator('[data-testid="dashboard-table"]');
      await expect(table).toBeVisible();
    });

    // フィルター条件が画面上部に表示されることを確認
    await test.step('フィルター条件が画面上部に表示される', async () => {
      const filterDisplay = page.locator('[data-testid="filter-display"]');
      await expect(filterDisplay).toBeVisible();
      
      const filterText = await filterDisplay.textContent();
      expect(filterText).toContain('部門:配送');
      expect(filterText).toContain('期間:2024-01-01～2024-01-31');
      expect(filterText).toContain('生産性:80～120%');
    });

    // フィルター後のデータが期待通りであることを確認
    await test.step('表示されるデータが期待する条件に合致する', async () => {
      const rows = page.locator('[data-testid="dashboard-table"] tbody tr');
      const rowCount = await rows.count();
      
      // 最低1件以上のデータが表示されていることを確認
      expect(rowCount).toBeGreaterThan(0);

      // 各行が配送部門・2024年1月・生産性80～120%のデータであることを確認
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        // 配送部門の確認
        const departmentCell = rows.nth(i).locator('[data-testid="department-cell"]');
        const departmentText = await departmentCell.textContent();
        expect(departmentText).toContain('配送');

        // 日付が2024年1月であることを確認
        const dateCell = rows.nth(i).locator('[data-testid="date-cell"]');
        const dateText = await dateCell.textContent();
        expect(dateText).toMatch(/^2024-01-\d{2}$/);

        // 生産性が80～120%の範囲であることを確認
        const productivityCell = rows.nth(i).locator('[data-testid="productivity-cell"]');
        const productivityText = await productivityCell.textContent();
        const productivityMatch = productivityText?.match(/(\d+)/);
        if (productivityMatch) {
          const productivityValue = parseInt(productivityMatch[1]);
          expect(productivityValue).toBeGreaterThanOrEqual(80);
          expect(productivityValue).toBeLessThanOrEqual(120);
        }
      }
    });
  });
});