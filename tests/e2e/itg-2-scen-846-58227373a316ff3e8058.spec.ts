import { test, expect } from '@playwright/test';

test('SCEN-846: 指定期間内に該当する生産性データが存在しない場合、ダッシュボード画面が空の状態で表示される', async ({ page }) => {
  // テストユーザーで生産性ダッシュボード・分析画面にログインする
  await test.step('ログイン画面へ移動', async () => {
    await page.goto('/');
  });

  await test.step('テストユーザーでログイン', async () => {
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });

  // 生産性ダッシュボード・分析画面へ遷移
  await test.step('ダッシュボード画面へ移動', async () => {
    await page.goto('/panels/scr-1789461964046.html');
  });

  // 期間指定フィルターで、過去の生産性データが存在しない期間を選択する
  await test.step('期間指定フィルターで データなし期間を選択', async () => {
    const startDateInput = page.locator('input[aria-label*="開始日"]').first();
    const endDateInput = page.locator('input[aria-label*="終了日"]').first();

    await startDateInput.click();
    await startDateInput.fill('2025-01-01');

    await endDateInput.click();
    await endDateInput.fill('2025-01-31');
  });

  // フィルター条件を適用ボタンをクリックする
  await test.step('フィルター条件を適用', async () => {
    const applyButton = page.locator('button:has-text("適用")').first();
    await applyButton.click();
  });

  // ダッシュボード画面の読み込みが完了するまで待機する
  await test.step('ダッシュボード読み込み完了を待機', async () => {
    await page.waitForLoadState('networkidle');
  });

  // 期待結果の検証
  await test.step('ページレイアウト・ヘッダーが正常に表示されていることを確認', async () => {
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  await test.step('フィルターコンポーネントが正常に表示されていることを確認', async () => {
    const filterComponent = page.locator('[class*="filter"], [aria-label*="フィルター"]').first();
    await expect(filterComponent).toBeVisible();
  });

  await test.step('サイドメニューが正常に表示されていることを確認', async () => {
    const sideMenu = page.locator('nav, [class*="sidebar"], [class*="menu"]').first();
    await expect(sideMenu).toBeVisible();
  });

  await test.step('コンテンツ領域が空の状態で視認可能に描画されていることを確認', async () => {
    // コンテンツ領域全体が存在し、表示されていることを確認
    const contentArea = page.locator('main, [class*="content"], [class*="container"]').first();
    await expect(contentArea).toBeVisible();

    // グラフ・チャート領域が存在する場合、データが空であることを確認
    const graphAreas = page.locator('[class*="chart"], [class*="graph"]');
    const graphCount = await graphAreas.count();

    let graphsAreEmpty = true;
    for (let i = 0; i < graphCount; i++) {
      const graphArea = graphAreas.nth(i);
      if (await graphArea.isVisible()) {
        const svgContent = graphArea.locator('svg');
        if (await svgContent.count() > 0) {
          // SVG内のデータ要素（path, circle, rectなど）が存在しないことを確認
          const dataElements = svgContent.locator('path[d], circle, rect[class*="bar"]');
          const dataElementCount = await dataElements.count();
          if (dataElementCount > 0) {
            graphsAreEmpty = false;
            break;
          }
        }
      }
    }
    await expect(graphsAreEmpty).toBe(true);

    // データテーブルが存在する場合、テーブルのボディ行が空であることを確認
    const tableArea = page.locator('table, [role="table"]').first();
    if (await tableArea.count() > 0) {
      if (await tableArea.isVisible()) {
        const tableRows = tableArea.locator('tbody tr, [role="row"]:not(thead)');
        await expect(tableRows).toHaveCount(0);
      }
    }

    // コンテンツ領域がデータなしの空白状態で表示されていることを確認
    // グラフやテーブルが表示されていない、またはデータが空で視認可能な状態
    const hasNoData = graphsAreEmpty && (await tableArea.count() === 0 || await tableArea.locator('tbody tr, [role="row"]:not(thead)').count() === 0);
    await expect(hasNoData).toBe(true);
  });
});