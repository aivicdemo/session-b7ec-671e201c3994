import { test, expect } from '@playwright/test';

test.describe('作業指示検索フィルター実行', () => {
  test('フィルター条件の日時範囲が不正な場合、操作が拒否される', async ({ page }) => {
    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // 作業指示検索フィルターパネルを表示する
    // 「作業指示・実績管理」タブをクリックしてフィルターパネルを表示
    const workInstructionTab = page.getByRole('link', { name: '作業指示・実績管理' });
    await workInstructionTab.click();
    await page.waitForLoadState('networkidle');

    // フィルターパネルが表示されるまで待機
    const filterPanel = page.locator('form, [class*="filter"]').first();
    await filterPanel.waitFor({ state: 'visible', timeout: 5000 });

    // 検索実行前のテーブル内容を記録
    const initialRows = await page.locator('[id="work-instruction-tbody"] tr').all();
    const initialRowCount = initialRows.length;
    const initialRowTexts = await Promise.all(
      initialRows.map(row => row.textContent())
    );

    // リクエスト監視
    let searchRequestSent = false;
    let searchRequestStatusCode: number | null = null;

    page.on('response', (response) => {
      const url = response.url();
      const method = response.request().method();
      // 作業指示検索に該当するリクエストを監視
      if ((url.includes('/api/') && (url.includes('work-instruction') || url.includes('filter'))) ||
          url.includes('/search')) {
        if (method === 'GET' || method === 'POST') {
          searchRequestSent = true;
          searchRequestStatusCode = response.status();
        }
      }
    });

    // フィルター条件の「開始日時」に「2024-01-15 14:30」を入力する
    const startDateInputs = page.locator('input[type="datetime-local"], input[type="text"][placeholder*="開始"]');
    const startDateInput = startDateInputs.first();
    await startDateInput.fill('2024-01-15T14:30');

    // フィルター条件の「終了日時」に「2024-01-10 09:00」を入力する（開始日時より前の日時を指定）
    const endDateInputs = page.locator('input[type="datetime-local"], input[type="text"][placeholder*="終了"]');
    const endDateInput = endDateInputs.nth(1) || page.locator('input[type="datetime-local"]').nth(1);
    await endDateInput.fill('2024-01-10T09:00');

    // 検索実行ボタン
    const searchButton = page.getByTestId('filter-search-button');

    // バリデーション結果を待つ
    await page.waitForTimeout(500);

    // 期待結果を検証：画面上にいずれかの検証エラーが表示されているか確認

    // (1) エラーメッセージ「終了日時は開始日時以降に設定してください」が表示されているか
    const errorMessageLocator = page.locator('text=/終了日時は開始日時以降に設定してください|終了日時が開始日時より前です|日時範囲が不正です/');
    const isErrorMessageVisible = await errorMessageLocator.isVisible().catch(() => false);

    // (2) 検索実行ボタンが無効化（グレーアウト）されているか
    const isSearchButtonDisabled = await searchButton.isDisabled();

    // (3) エラーバナー（error-banner）が表示されているか
    const errorBanner = page.locator('[id="error-banner"], [class*="error-banner"]');
    const isErrorBannerVisible = await errorBanner.isVisible().catch(() => false);

    // (4) フィルターパネルに赤枠またはエラー状態のクラスが表示されているか
    const invalidInputs = page.locator('input[class*="error"], input[class*="invalid"], [class*="has-error"] input');
    const isFilterPanelErrorVisible = await invalidInputs.first().isVisible().catch(() => false);

    // UIレベルのバリデーションエラーが表示されたか（いずれか1つ以上）
    const hasUIValidationError = isErrorMessageVisible || isSearchButtonDisabled || isErrorBannerVisible || isFilterPanelErrorVisible;

    // 期待結果：画面上に検証エラーが表示されていることを確認
    expect(hasUIValidationError).toBeTruthy();

    // 検索実行ボタンをクリック
    await searchButton.click();

    // ボタンクリック後の待機
    await page.waitForTimeout(800);

    // 期待結果：検索リクエストが送信されていないか、サーバーが400番台エラーを返しているか
    if (searchRequestSent) {
      // リクエストが送信された場合、サーバーが400番台を返していることを確認
      expect(searchRequestStatusCode).toBeGreaterThanOrEqual(400);
      expect(searchRequestStatusCode).toBeLessThan(500);
    }

    // 検索結果テーブルが更新されていないことを確認
    const afterClickRows = await page.locator('[id="work-instruction-tbody"] tr').all();
    const afterClickRowCount = afterClickRows.length;
    const afterClickRowTexts = await Promise.all(
      afterClickRows.map(row => row.textContent())
    );

    // テーブルの行数が変わらないことを確認
    expect(afterClickRowCount).toBe(initialRowCount);

    // テーブルの内容が変わっていないことを確認
    expect(afterClickRowTexts).toEqual(initialRowTexts);

    // グラフが表示されている場合、更新されないことを確認
    const trendChart = page.locator('[id="trend-chart"], [class*="chart"]').first();
    const isChartPresent = await trendChart.isVisible().catch(() => false);

    if (isChartPresent) {
      // グラフが存在する場合、その内容を記録
      const initialChartContent = await trendChart.innerHTML().catch(() => '');
      await page.waitForTimeout(500);
      const afterChartContent = await trendChart.innerHTML().catch(() => '');

      // グラフ内容が更新されていないことを確認
      expect(afterChartContent).toBe(initialChartContent);
    }
  });
});