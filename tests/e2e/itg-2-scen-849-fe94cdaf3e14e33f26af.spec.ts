import { test, expect } from '@playwright/test';

test('SCEN-849: 認証・権限検証を通過したユーザーが最適人員配置案表示操作を実行すると、ハンディターミナルから実績データが収集され、次工程へ進む', async ({ page }) => {
  // Step 1: テストユーザーで認証・権限検証を完了し、生産性ダッシュボード・分析画面にログインする
  await page.goto('/');
  
  // ログインフォームの入力
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'testpassword');
  
  // ログインボタンをクリック
  await page.click('button:has-text("ログイン")');
  
  // ログイン後の遷移完了を待機
  await page.waitForURL('/panels/scr-1789461964046.html');
  
  // 生産性ダッシュボード・分析画面が表示されることを確認
  await expect(page).toHaveURL('/panels/scr-1789461964046.html');

  // Step 2: 生産性ダッシュボード・分析画面から「最適人員配置案表示」ボタンを操作して、最適人員配置案提案・実行画面への遷移を開始する
  const optimizeButton = page.locator('button:has-text("最適人員配置案表示")');
  await expect(optimizeButton).toBeVisible();
  
  // ハンディターミナルからのデータ送信リクエストを監視
  const dataTransferPromise = page.waitForResponse(
    response => response.url().includes('/api/') && response.status() === 200
  );
  
  // ボタンをクリックしてハンディターミナルからのデータ送信を実行
  await optimizeButton.click();

  // Step 3: ハンディターミナルから実績データ送信が実行され、システムがデータ受信を確認する
  const dataResponse = await dataTransferPromise;
  expect(dataResponse.ok()).toBeTruthy();
  
  // ハンディターミナルから送信されたデータが受信されたことを確認
  const responseData = await dataResponse.json();
  expect(responseData).toBeDefined();

  // Step 4: 最適人員配置案提案・実行画面が正常に表示される
  // 画面遷移の完了を待機
  await page.waitForURL('/panels/scr-1789461978707.html');
  
  // 最適人員配置案提案・実行画面が表示されることを確認
  await expect(page).toHaveURL('/panels/scr-1789461978707.html');

  // 期待結果の検証：
  // 実績データ（作業タイプ別件数）が画面に反映されていることを確認
  const workTypeDataElements = page.locator('text=/作業タイプ/i, text=/作業種別/i');
  await expect(workTypeDataElements.first()).toBeVisible();
  
  // 実績データ（部門別処理時間）が画面に反映されていることを確認
  const departmentTimeElements = page.locator('text=/部門/i, text=/処理時間/i');
  await expect(departmentTimeElements.first()).toBeVisible();
  
  // 実績データ（作業者ごとの生産性指標）が画面に反映されていることを確認
  const productivityElements = page.locator('text=/生産性/i, text=/作業者/i');
  await expect(productivityElements.first()).toBeVisible();

  // データテーブル領域が表示されていることを確認
  const dataTable = page.locator('table');
  await expect(dataTable.first()).toBeVisible();

  // グラフ領域が表示されていることを確認
  const graphArea = page.locator('svg, canvas, [class*="chart"], [class*="graph"]');
  await expect(graphArea.first()).toBeVisible();

  // 次工程へ進むための操作が可能な状態（ボタンなど）を確認
  const nextButton = page.locator('button:has-text("次へ"), button:has-text("実行"), button[type="submit"]').first();
  await expect(nextButton).toBeVisible();
  await expect(nextButton).toBeEnabled();
});