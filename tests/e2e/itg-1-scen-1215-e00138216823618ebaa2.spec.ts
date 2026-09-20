import { test, expect } from '@playwright/test';

test('SCEN-1215: チーム進捗データが空の場合、エラーメッセージが表示される', async ({ page }) => {
  // ステップ1: Playwrightテスト環境を初期化し、進捗・人員配置ダッシュボード画面のURLにアクセスする
  await page.goto('/panels/scr-1789461783315.html', { waitUntil: 'networkidle' });

  // ステップ2: ダッシュボード画面の読み込み完了を待機する（ページロード完了まで最大10秒）
  await page.waitForLoadState('networkidle', { timeout: 10000 });

  // ステップ3: ダッシュボード画面上のエラーメッセージ表示領域を確認する
  // 期待結果: 画面上にエラーメッセージ「チーム進捗情報が取得できません。WMS接続を確認してください」が表示されていることを確認する
  const errorMessage = page.locator('text=チーム進捗情報が取得できません。WMS接続を確認してください');
  
  await expect(errorMessage).toBeVisible();
  
  // エラーメッセージが視認可能な色（赤またはオレンジ）であることを確認
  const errorElement = errorMessage.first();
  const color = await errorElement.evaluate((el) => {
    return window.getComputedStyle(el).color;
  });
  
  // RGB値を解析して赤またはオレンジ色であることを確認
  // 赤: R=255, G=0-50, B=0-50
  // オレンジ: R=255, G=100-180, B=0-50
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  expect(rgbMatch).toBeTruthy();
  
  const [, r, g, b] = rgbMatch!.map(Number);
  const isRed = r === 255 && g <= 50 && b <= 50;
  const isOrange = r === 255 && g >= 100 && g <= 180 && b <= 50;
  
  expect(isRed || isOrange).toBeTruthy();

  // ダッシュボードの進捗データ表示領域を確認
  const teamVarianceTable = page.locator('#team-variance-tbody');
  
  // チーム進捗テーブルが空であることを確認
  const tableRowCount = await teamVarianceTable.locator('tr').count();
  expect(tableRowCount).toBe(0);
  
  // エラーメッセージが進捗データ表示領域内に表示されていることを確認
  // エラーメッセージの親要素がダッシュボードコンテンツ領域内にあることを確認
  const errorElementLocator = page.locator('text=チーム進捗情報が取得できません。WMS接続を確認してください').first();
  const isWithinDashboard = await errorElementLocator.evaluate((el) => {
    // ダッシュボード領域またはカード領域内にあることを確認
    let current = el.parentElement;
    while (current) {
      if (current.classList.contains('content-area') || 
          current.classList.contains('card') ||
          current.id === 'team-variance-tbody' ||
          current.classList.contains('table-wrap')) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  });
  
  expect(isWithinDashboard).toBeTruthy();
});