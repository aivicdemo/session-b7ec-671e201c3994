import { test, expect } from '@playwright/test';

test('SCEN-1261: 進捗データを含む複数の分析結果がダッシュボード上に一覧表示される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  await page.waitForURL(/.*\/panels\/.*/, { waitUntil: 'networkidle' });
  
  // ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  
  // ダッシュボード画面が完全に読み込まれるまで待機
  await page.waitForLoadState('networkidle');
  
  // 拠点分散表テーブルが読み込まれるまで待機
  await page.locator('#site-variance-tbody').waitFor({ state: 'visible', timeout: 10000 });
  
  // テーブルのHTML構造を取得して検証
  const siteVarianceTable = page.locator('#site-variance-tbody');
  const rows = siteVarianceTable.locator('tr');
  const rowCount = await rows.count();
  
  // 複数の拠点データが存在することを確認
  expect(rowCount).toBeGreaterThanOrEqual(3);
  
  // 拠点Aの検証
  const siteARow = rows.filter({ hasText: /拠点A|拠点.*A/ }).first();
  await expect(siteARow).toContainText(/65/); // 進捗率65%
  await expect(siteARow).toContainText(/520.*280/); // 完了520件/残280件
  await expect(siteARow).toContainText(/28/); // 遅延リスク28%
  
  // 拠点Aの色分け確認（中程度警告：黄色系またはオレンジ系）
  const siteACell = siteARow.locator('td').first();
  const siteAComputedStyle = await siteACell.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });
  // 中程度警告は黄色系またはオレンジ系（RGB値で確認）
  // 黄色系: rgb(255, 193, 7) または rgb(255, 152, 0) など
  // オレンジ系: rgb(255, 111, 0) など
  const isWarningYellow = /rgb\(25[0-5],\s*1[4-9][0-9]|2[0-5][0-9],\s*[0-9]{1,3}\)|rgba\(25[0-5],\s*1[4-9][0-9]|2[0-5][0-9],\s*[0-9]{1,3}/.test(siteAComputedStyle);
  expect(isWarningYellow || siteAComputedStyle.includes('rgb(255')).toBeTruthy();
  
  // 拠点Bの検証
  const siteBRow = rows.filter({ hasText: /拠点B|拠点.*B/ }).first();
  await expect(siteBRow).toContainText(/48/); // 進捗率48%
  await expect(siteBRow).toContainText(/310.*340/); // 完了310件/残340件
  await expect(siteBRow).toContainText(/71/); // 遅延リスク71%
  
  // 拠点Bの色分け確認（高リスク赤）
  const siteBCell = siteBRow.locator('td').first();
  const siteBComputedStyle = await siteBCell.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });
  // 高リスク赤: rgb(220, 38, 38) または rgb(239, 68, 68) など
  const isHighRiskRed = /rgb\(2[0-4][0-9]|25[0-5],\s*[0-5][0-9],\s*[0-5][0-9]\)|rgba\(2[0-4][0-9]|25[0-5],\s*[0-5][0-9],\s*[0-5][0-9]/.test(siteBComputedStyle);
  expect(isHighRiskRed || (siteBComputedStyle.includes('rgb(') && siteBComputedStyle.match(/rgb\((\d+)/)?.[1] && parseInt(siteBComputedStyle.match(/rgb\((\d+)/)?.[1]) > 200)).toBeTruthy();
  
  // 拠点Cの検証
  const siteCRow = rows.filter({ hasText: /拠点C|拠点.*C/ }).first();
  await expect(siteCRow).toContainText(/82/); // 進捗率82%
  await expect(siteCRow).toContainText(/650.*140/); // 完了650件/残140件
  await expect(siteCRow).toContainText(/12/); // 遅延リスク12%
  
  // 拠点Cの色分け確認（低リスク緑）
  const siteCCell = siteCRow.locator('td').first();
  const siteCComputedStyle = await siteCCell.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });
  // 低リスク緑: rgb(34, 197, 94) または rgb(74, 222, 128) など
  const isLowRiskGreen = /rgb\([0-9]{1,3},\s*1[4-9][0-9]|2[0-4][0-9]|25[0-5],\s*[0-9]{1,3}\)|rgba\([0-9]{1,3},\s*1[4-9][0-9]|2[0-4][0-9]|25[0-5],\s*[0-9]{1,3}/.test(siteCComputedStyle);
  expect(isLowRiskGreen || siteCComputedStyle.includes('rgb(')).toBeTruthy();
  
  // 各拠点の行が視認可能に表示されていることを確認
  await expect(siteARow).toBeVisible();
  await expect(siteBRow).toBeVisible();
  await expect(siteCRow).toBeVisible();
  
  // リスク度に応じた色分けが異なることを確認
  expect(siteAComputedStyle).not.toBe(siteBComputedStyle);
  expect(siteBComputedStyle).not.toBe(siteCComputedStyle);
  expect(siteAComputedStyle).not.toBe(siteCComputedStyle);
  
  // 各色が仕様の色体系に該当することを確認
  // 拠点A: 中程度警告（黄色/オレンジ系）
  const siteAValues = siteAComputedStyle.match(/\d+/g);
  if (siteAValues && siteAValues.length >= 3) {
    const [r, g, b] = [parseInt(siteAValues[0]), parseInt(siteAValues[1]), parseInt(siteAValues[2])];
    expect(r > 200 && g > 100 && b < 100).toBeTruthy(); // 黄色/オレンジ系
  }
  
  // 拠点B: 高リスク赤
  const siteBValues = siteBComputedStyle.match(/\d+/g);
  if (siteBValues && siteBValues.length >= 3) {
    const [r, g, b] = [parseInt(siteBValues[0]), parseInt(siteBValues[1]), parseInt(siteBValues[2])];
    expect(r > 180 && g < 100 && b < 100).toBeTruthy(); // 赤系
  }
  
  // 拠点C: 低リスク緑
  const siteCValues = siteCComputedStyle.match(/\d+/g);
  if (siteCValues && siteCValues.length >= 3) {
    const [r, g, b] = [parseInt(siteCValues[0]), parseInt(siteCValues[1]), parseInt(siteCValues[2])];
    expect(r < 150 && g > 150 && b < 150).toBeTruthy(); // 緑系
  }
});