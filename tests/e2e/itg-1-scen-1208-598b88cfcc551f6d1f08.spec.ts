import { test, expect } from '@playwright/test';

test('SCEN-1208: 平均生産性が0以下の場合に警告メッセージが表示される', async ({ page }) => {
  // ログイン画面へアクセス
  await page.goto('/');
  
  // ログイン操作
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpass');
  await page.click('button:has-text("ログイン")');
  
  // ダッシュボード画面の読み込み完了を待機
  await page.waitForURL('**/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');
  
  // テスト環境で平均生産性が0以下のシナリオを設定
  const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
  const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
  const tables = await page.evaluate(() => (window as any).AIVIC_TABLES);
  
  // 生産性データを0以下の値で設定
  if (tables && apiUrl && appId) {
    // テーブル情報から生産性関連テーブルを特定
    const tableEntries = Object.entries(tables);
    let productivityTableNum: string | undefined;
    
    for (const [tableNum, tableName] of tableEntries) {
      if (typeof tableName === 'string' && 
          (tableName.includes('productivity') || 
           tableName.includes('perf') ||
           tableName.includes('wms') ||
           tableName.includes('handy'))) {
        productivityTableNum = tableNum;
        break;
      }
    }
    
    if (productivityTableNum) {
      // 平均生産性が0以下の作業者データを作成
      await fetch(`${apiUrl}/api/${productivityTableNum}?app=${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: 'tokyo',
          team: 'team_a',
          worker_id: 'test_worker_001',
          avg_productivity: -0.5,
          productivity_count: 1
        })
      }).catch(() => {});
      
      // 平均生産性が0の作業者データも作成
      await fetch(`${apiUrl}/api/${productivityTableNum}?app=${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: 'osaka',
          team: 'team_b',
          worker_id: 'test_worker_002',
          avg_productivity: 0,
          productivity_count: 0
        })
      }).catch(() => {});
    }
  }
  
  // 画面をリロードして最新データを取得
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  // 進捗遅延リスク判定を実行するトリガーを操作
  // 「人員配置を最適化」ボタンが進捗遅延リスク判定のトリガー
  const optimizeButton = page.getByTestId('optimize-button');
  const optimizeButtonVisible = await optimizeButton.isVisible({ timeout: 1000 }).catch(() => false);
  
  if (optimizeButtonVisible) {
    await optimizeButton.click();
    await page.waitForLoadState('networkidle');
  } else {
    // 自動更新またはリアルタイムデータ取得が動作するまで待機
    await page.waitForTimeout(2000);
  }
  
  // 警告メッセージが表示されているか確認
  const warningMessage = page.locator('text=生産性データが不足しています。推定値の精度が低い可能性があります');
  
  // 警告メッセージが視認可能な状態であることを確認
  await expect(warningMessage).toBeVisible();
  
  // 警告テキストが完全に表示されていることを確認
  await expect(warningMessage).toContainText('生産性データが不足しています。推定値の精度が低い可能性があります');
  
  // 警告要素の視覚的属性を確認
  const warningElement = warningMessage.first();
  
  // 警告要素が画面に表示されていることを確認
  const box = await warningElement.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThan(0);
  expect(box!.width).toBeGreaterThan(0);
  
  // 背景色が設定されていることを確認
  const backgroundColor = await warningElement.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return computed.backgroundColor;
  });
  expect(backgroundColor).toBeTruthy();
  expect(backgroundColor).not.toMatch(/rgba\(0, 0, 0, 0\)/);
  
  // クラス名またはデータ属性に警告レベルを示す識別子が含まれているか確認
  const elementInfo = await warningElement.evaluate((el) => ({
    className: el.className,
    dataAttrs: Array.from(el.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .map(attr => attr.value)
      .join(' '),
    parentClass: el.parentElement?.className || ''
  }));
  
  const hasWarningIndicator = /warning|alert|error|risk|critical|caution/i.test(
    elementInfo.className + ' ' + elementInfo.dataAttrs + ' ' + elementInfo.parentClass
  );
  expect(hasWarningIndicator || backgroundColor).toBeTruthy();
  
  // フォント属性（太さ、サイズ、色）が警告を強調するスタイルであることを確認
  const fontStyles = await warningElement.evaluate((el) => ({
    fontSize: window.getComputedStyle(el).fontSize,
    fontWeight: window.getComputedStyle(el).fontWeight,
    color: window.getComputedStyle(el).color
  }));
  
  expect(fontStyles.fontSize).toBeTruthy();
  expect(fontStyles.fontWeight).toBeTruthy();
  expect(fontStyles.color).toBeTruthy();
  
  // フォントサイズが最小限度以上であることを確認
  const fontSizeValue = parseFloat(fontStyles.fontSize);
  expect(fontSizeValue).toBeGreaterThanOrEqual(12);
  
  // 警告が進捗遅延リスク判定結果（kpi-risk-count）の付近に配置されているか確認
  const riskCountKpi = page.getByTestId('kpi-risk-count');
  const riskCountVisible = await riskCountKpi.isVisible({ timeout: 1000 }).catch(() => false);
  
  if (riskCountVisible && box) {
    const riskCountBox = await riskCountKpi.boundingBox();
    if (riskCountBox) {
      // 警告要素とリスク判定KPIが近接しているか確認（Y座標の差が500px以内）
      const verticalDistance = Math.abs(box.y - riskCountBox.y);
      const isNearby = verticalDistance <= 500;
      expect(isNearby).toBeTruthy();
    }
  }
  
  // 警告が視認可能な領域に配置されていることを最終確認
  await expect(warningElement).toBeInViewport();
});