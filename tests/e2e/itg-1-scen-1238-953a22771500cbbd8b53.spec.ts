import { test, expect } from '@playwright/test';

test.describe('SCEN-1238: WMSから進捗データの取得に失敗した場合、キャッシュから最後の正常データが使用される', () => {
  test('進捗データ取得失敗時にキャッシュデータが表示され、メッセージが表示される', async ({ page }) => {
    // 初期化：ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // 最後の正常データをキャッシュに設定
    await page.evaluate(() => {
      const cachedData = {
        site: '拠点A',
        team: 'チームB',
        completed: 500,
        remaining: 200,
        progressRate: 71.4,
        timestamp: Date.now() - 120000 // 2分前
      };
      localStorage.setItem('progress_data_cache', JSON.stringify(cachedData));
    });

    // WMS取得失敗をシミュレート：ネットワークエラーをインターセプト
    await page.route('**/api/*', route => {
      if (route.request().url().includes('progress') || route.request().url().includes('wms')) {
        route.abort('timedout');
      } else {
        route.continue();
      }
    });

    // ページをリロードしてキャッシュを有効化
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // 画面上のリフレッシュボタンをクリック
    // ダッシュボード画面の更新トリガーを探索
    const refreshButtons = await page.locator('button').all();
    let refreshButtonFound = false;
    
    for (const button of refreshButtons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      if (
        (text && (text.includes('更新') || text.includes('リフレッシュ') || text.includes('再読込'))) ||
        (ariaLabel && (ariaLabel.includes('更新') || ariaLabel.includes('リフレッシュ'))) ||
        (title && (title.includes('更新') || title.includes('リフレッシュ')))
      ) {
        await button.click();
        refreshButtonFound = true;
        await page.waitForLoadState('domcontentloaded');
        break;
      }
    }

    // リフレッシュボタンが見つからない場合は、ページ全体のリロードで自動更新をトリガー
    if (!refreshButtonFound) {
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
    }

    // 画面上に表示されている進捗データを確認
    // キャッシュから復元された拠点Aが表示されることを確認
    await expect(page.locator('text=拠点A')).toBeVisible({ timeout: 10000 });
    
    // チームBが表示されることを確認
    await expect(page.locator('text=チームB')).toBeVisible({ timeout: 10000 });
    
    // 進捗データのテーブル要素から各値を確認
    const siteVarianceTable = page.locator('[id="site-variance-tbody"]');
    const tableText = await siteVarianceTable.textContent();
    expect(tableText).toContain('500');
    expect(tableText).toContain('200');
    expect(tableText).toContain('71.4');

    // 遅延メッセージが表示されることを確認
    // 仕様で指定された「進捗データの更新に遅延が発生しています。最後の更新：○分前」という形式を検証
    const delayMessage = page.locator('text=/進捗データの更新に遅延が発生しています。最後の更新：\\d+分前/');
    await expect(delayMessage).toBeVisible({ timeout: 10000 });

    // メッセージテキストの内容を確認
    const messageText = await delayMessage.textContent();
    expect(messageText).toMatch(/進捗データの更新に遅延が発生しています/);
    expect(messageText).toMatch(/最後の更新：\d+分前/);

    // 人員配置最適化提案・実行画面へ遷移
    await page.locator('a[href*="scr-1789461798629"]').click();
    await page.waitForLoadState('networkidle');

    // 遷移後もキャッシュデータが参照可能な状態であることを確認
    const cachedDataInStorage = await page.evaluate(() => {
      return localStorage.getItem('progress_data_cache');
    });
    expect(cachedDataInStorage).toBeTruthy();
    
    const parsedCache = JSON.parse(cachedDataInStorage!);
    expect(parsedCache.site).toBe('拠点A');
    expect(parsedCache.team).toBe('チームB');
    expect(parsedCache.completed).toBe(500);
    expect(parsedCache.remaining).toBe(200);
    expect(parsedCache.progressRate).toBe(71.4);
  });
});