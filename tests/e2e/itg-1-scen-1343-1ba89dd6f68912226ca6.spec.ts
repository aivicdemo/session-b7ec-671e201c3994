import { test, expect } from '@playwright/test';

test.describe('作業指示実績管理画面遷移（配置提案画面から）', () => {
  test('WMS連携ログが取得され、受注・在庫・入出荷データの同期状況が画面に表示される', async ({ page }) => {
    // ログイン画面にアクセス
    await page.goto('/');
    
    // ログインフォームに入力して送信
    await page.fill('input[name="userId"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    
    // 自動遷移後、ダッシュボード画面が表示されるまで待機
    await page.waitForURL('**/scr-1789461783315.html');
    
    // 人員配置最適化提案画面へのナビゲーション
    await page.click('a[href*="scr-1789461798629"]');
    await page.waitForURL('**/scr-1789461798629.html');
    
    // 人員配置最適化提案・実行画面が表示されたことを確認
    await expect(page).toHaveURL(/scr-1789461798629/);
    
    // ナビゲーションボタン（作業指示・実績管理画面へのリンク）を確認
    const navigationLink = page.locator('a[href*="scr-1789461813941"]');
    await expect(navigationLink).toBeVisible();
    
    // test.step: ナビゲーションボタンをクリック
    await test.step('作業指示・実績管理画面へ遷移', async () => {
      await navigationLink.click();
      await page.waitForURL('**/scr-1789461813941.html');
    });
    
    // 作業指示・実績管理画面が表示されたことを確認
    await expect(page).toHaveURL(/scr-1789461813941/);
    
    // WMS連携ログセクションが表示されていることを確認
    const wmsTabButton = page.getByTestId('tab-wms');
    await expect(wmsTabButton).toBeVisible();
    
    // WMS連携ログタブをクリックしてコンテンツを表示
    await wmsTabButton.click();
    
    // WMS連携ログコンテンツが表示されることを確認
    const wmsLogContent = page.locator('#tab-wms-content');
    await expect(wmsLogContent).toBeVisible();
    
    // WMS連携ログテーブルが存在することを確認
    const wmsLogTable = page.locator('#wms-log-tbody');
    await expect(wmsLogTable).toBeVisible();
    
    // テーブル内に行が存在することを確認
    const logRows = page.locator('#wms-log-tbody tr');
    const rowCount = await logRows.count();
    expect(rowCount).toBeGreaterThan(0);
    
    // 受注・在庫・入出荷の3つのデータカテゴリーが表示されていることを確認
    const allSyncTypes = await logRows.locator('td:first-child').allTextContents();
    const syncTypeTexts = allSyncTypes.map(t => t.trim());
    
    // 各ログ行のデータカテゴリーと同期情報を検証
    const requiredCategories = ['受注', '在庫', '入出荷'];
    const foundCategories = new Set<string>();
    
    for (let i = 0; i < rowCount; i++) {
      const row = logRows.nth(i);
      
      // 連携種別（受注、在庫、入出荷などのいずれか）
      const syncType = row.locator('td').nth(0);
      await expect(syncType).toBeVisible();
      const syncTypeText = await syncType.textContent();
      const categoryName = syncTypeText?.trim() || '';
      
      // 要求されるカテゴリーをチェック
      for (const category of requiredCategories) {
        if (categoryName.includes(category)) {
          foundCategories.add(category);
        }
      }
      
      // ステータス（正常、遅延中、失敗のいずれか）
      const statusCell = row.locator('td').nth(1);
      await expect(statusCell).toBeVisible();
      const statusText = await statusCell.textContent();
      expect(['正常', '遅延中', '失敗']).toContain(statusText?.trim());
      
      // 送信日時（タイムスタンプ）
      const timestampCell = row.locator('td').nth(2);
      await expect(timestampCell).toBeVisible();
      const timestampText = await timestampCell.textContent();
      expect(timestampText).toMatch(/\d{4}年\d{1,2}月\d{1,2}日\s+\d{1,2}:\d{2}:\d{2}|^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/);
      
      // 処理件数（レコード数）
      const recordCountCell = row.locator('td').nth(3);
      await expect(recordCountCell).toBeVisible();
      const recordCountText = await recordCountCell.textContent();
      expect(recordCountText).toMatch(/\d+/);
    }
    
    // 受注・在庫・入出荷の3つのカテゴリーがすべて表示されていることを確認
    expect(foundCategories.has('受注')).toBeTruthy();
    expect(foundCategories.has('在庫')).toBeTruthy();
    expect(foundCategories.has('入出荷')).toBeTruthy();
  });
});