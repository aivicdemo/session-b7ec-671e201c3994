import { test, expect } from '@playwright/test';

test('SCEN-940: 業界標準ベンチマークが1年以上更新されていない場合、警告が表示される', async ({ page }) => {
  // ログイン画面にアクセス
  await page.goto('/');
  
  // ログイン画面で認証
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'testpassword');
  await page.click('button:has-text("ログイン")');
  
  // ログイン後の自動遷移を待つ
  await page.waitForNavigation();
  
  // 最適人員配置案提案・実行画面にアクセス
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');
  
  // 業界標準ベンチマークマスタの最終更新日時を1年以上前に設定
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  // API経由でベンチマークデータの更新日時を過去に設定
  const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
  const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
  const tables = await page.evaluate(() => (window as any).AIVIC_TABLES);
  
  if (apiUrl && appId && tables) {
    // ベンチマークマスタのテーブル番号を取得
    const benchmarkTableName = Object.entries(tables).find(
      ([_, name]: [string, any]) => typeof name === 'string' && name.toLowerCase().includes('benchmark')
    )?.[0];
    
    if (benchmarkTableName) {
      const response = await page.request.patch(
        `${apiUrl}/api/${benchmarkTableName}?app=${appId}`,
        {
          data: {
            lastUpdated: oneYearAgo.toISOString()
          }
        }
      );
      
      if (!response.ok()) {
        throw new Error(`ベンチマーク更新日時の設定に失敗しました: ${response.status()}`);
      }
    }
  }
  
  // ページをリロードして更新されたベンチマークデータを反映
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  // 配置案承認フローを開始
  await page.click('button:has-text("承認")');
  await page.waitForLoadState('networkidle');
  
  // 承認待ちの配置案を表示させる
  await page.click('button:has-text("配置案を確認")');
  await page.waitForLoadState('networkidle');
  
  // 画面に表示されたベンチマークデータの参照情報を確認
  const benchmarkRefInfo = page.locator(
    '[class*="benchmark"], [class*="reference"], [data-testid*="benchmark"], text=/更新日時|データソース|参照日|最終更新/'
  );
  
  await expect(benchmarkRefInfo.first()).toBeVisible();
  
  // ベンチマークデータが古い旨の警告メッセージが表示されていることを確認
  const warningMessage = page.locator(
    'text="業界標準ベンチマークデータが1年以上更新されていません"'
  );
  
  await expect(warningMessage).toBeVisible();
  
  // 警告が視覚的に識別可能な形式（色付きバナーまたは警告アイコン）で表示されていることを確認
  const warningElement = warningMessage.locator('..');
  
  // 警告要素に警告スタイルが適用されていることを確認
  const computedStyle = await warningElement.evaluate((el) => {
    return window.getComputedStyle(el);
  });
  
  const hasWarningStyle = 
    computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
    computedStyle.borderColor !== 'rgba(0, 0, 0, 0)' ||
    computedStyle.color !== 'rgb(0, 0, 0)';
  
  expect(hasWarningStyle).toBeTruthy();
  
  // 警告が配置案の主要情報エリアに配置されていることを確認
  const mainInfoArea = page.locator('[class*="plan"], [class*="proposal"], main').first();
  
  const warningInMainArea = mainInfoArea.locator(
    'text="業界標準ベンチマークデータが1年以上更新されていません"'
  );
  
  await expect(warningInMainArea).toBeVisible();
  
  // 警告要素が主要情報エリア内の配下にあることを確認
  const warningBoundingBox = await warningMessage.boundingBox();
  const mainAreaBoundingBox = await mainInfoArea.boundingBox();
  
  if (warningBoundingBox && mainAreaBoundingBox) {
    const isWithinMainArea = 
      warningBoundingBox.x >= mainAreaBoundingBox.x &&
      warningBoundingBox.y >= mainAreaBoundingBox.y &&
      warningBoundingBox.x + warningBoundingBox.width <= mainAreaBoundingBox.x + mainAreaBoundingBox.width &&
      warningBoundingBox.y + warningBoundingBox.height <= mainAreaBoundingBox.y + mainAreaBoundingBox.height;
    
    expect(isWithinMainArea).toBeTruthy();
  }
});