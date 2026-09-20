import { test, expect } from '@playwright/test';

test.describe('ダッシュボード表示（実績管理画面から）', () => {
  test('複数チームの進捗集約時に、チーム進捗データが空の場合、エラーメッセージが表示される', async ({ page }) => {
    // 作業指示・実績管理画面を開く
    await page.goto('/panels/scr-1789461813941.html');
    await page.waitForLoadState('networkidle');

    // 複数チーム（例：チームA、チームB、チームC）の実績データが登録されている状態を確認する
    const workInstructionList = page.getByTestId('work-instruction-list');
    await expect(workInstructionList).toBeVisible();

    // 作業指示一覧テーブルに複数行のデータが存在することを確認
    const workInstructionRows = page.locator('#work-instruction-tbody tr');
    const rowCount = await workInstructionRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // ダッシュボード表示ボタンまたはダッシュボードへの遷移リンクをクリックする
    const dashboardNavLink = page.locator('a[href*="scr-1789461783315"]').first();
    await dashboardNavLink.click();

    // 進捗・人員配置ダッシュボード画面の読み込みが完了するまで待機する
    await page.waitForLoadState('networkidle');

    // ダッシュボード画面上に、エラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=チーム進捗情報が取得できません。WMS接続を確認してください');
    await expect(errorMessage).toBeVisible();

    // エラーメッセージが赤色またはエラー表示形式であることを確認
    const computedStyle = await errorMessage.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    
    // RGB値を抽出して赤色系であることを確認
    const rgbMatch = computedStyle.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      // 赤色系：赤成分が緑・青成分より大きい
      expect(r).toBeGreaterThan(Math.max(g, b));
    }

    // ダッシュボード内のチーム進捗集約領域には進捗グラフやデータテーブルが表示されず、代わりにエラーメッセージが案内される
    const teamVarianceTable = page.locator('#team-variance-tbody');
    const teamVarianceTableRows = teamVarianceTable.locator('tr');
    await expect(teamVarianceTableRows).toHaveCount(0);

    // 他のダッシュボード要素（リスク判定結果や人員配置提案など、WMS進捗データに依存しない機能）は引き続き利用可能な状態を維持する
    const riskCountKpi = page.getByTestId('kpi-risk-count');
    await expect(riskCountKpi).toBeVisible();

    const activePlansKpi = page.getByTestId('kpi-active-plans');
    await expect(activePlansKpi).toBeVisible();

    const riskAssessmentTable = page.locator('#risk-assessment-tbody');
    await expect(riskAssessmentTable).toBeVisible();

    const activePlansTable = page.locator('#active-plans-tbody');
    await expect(activePlansTable).toBeVisible();
  });
});