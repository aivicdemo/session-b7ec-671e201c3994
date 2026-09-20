import { test, expect } from '@playwright/test';

test.describe('作業指示実績CSV出力', () => {
  test('認証済みユーザーがCSV出力権限を持たない場合、権限エラーが発生して処理が中断される', async ({ page, context }) => {
    // テスト前提条件: テストユーザーのCSV出力権限を削除する
    const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
    const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
    
    await context.request.post(`${apiUrl}/api/test-setup/remove-permission`, {
      data: {
        userId: 'testuser',
        permission: 'export_csv',
        appId: appId
      }
    });

    // テストユーザーでログインする
    await page.goto('/');
    await page.waitForURL('**/login**', { timeout: 5000 }).catch(() => {});

    // ログイン画面が表示されている場合はログイン処理を実行
    const loginForm = await page.querySelector('.login-form');
    if (loginForm) {
      // テストユーザーの認証情報でログイン
      await page.fill('input[placeholder*="ユーザー"], input[type="text"]', 'testuser');
      await page.fill('input[type="password"]', 'testpass');
      await page.click('button:has-text("ログイン")');
      await page.waitForURL('**/panels/**');
    }

    // ダッシュボードが表示されることを確認
    await expect(page).toHaveURL('**/panels/scr-1789461783315.html');

    // 作業指示・実績管理画面へ遷移
    await page.click('text=作業指示・実績管理');
    await page.waitForURL('**/panels/scr-1789461813941.html');
    await page.waitForLoadState('networkidle');

    // CSV出力ボタンが表示されていることを確認
    const exportButton = page.getByTestId('export-csv-button');
    await expect(exportButton).toBeVisible();

    // ダウンロードイベントを監視するリスナーを事前に登録
    let downloadTriggered = false;
    page.on('download', () => {
      downloadTriggered = true;
    });

    // CSV出力ボタンをクリック
    await exportButton.click();
    await page.waitForTimeout(500);

    // エラーメッセージが表示されることを確認
    const errorBanner = page.getByTestId('error-banner');
    await expect(errorBanner).toBeVisible();

    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toContainText('このユーザーアカウントには作業指示実績CSV出力権限がありません');

    // 画面が作業指示・実績管理画面に留まっていることを確認
    await expect(page).toHaveURL('**/panels/scr-1789461813941.html');

    // 他の操作が可能な状態であることを確認（例：フィルターボタンがクリック可能）
    const filterButton = page.getByTestId('filter-search-button');
    await expect(filterButton).toBeEnabled();

    // ダウンロードが発生していないことを確認
    expect(downloadTriggered).toBe(false);
  });
});