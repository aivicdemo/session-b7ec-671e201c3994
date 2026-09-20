import { test, expect } from '@playwright/test';

test.describe('最適人員配置案表示', () => {
  test('作業者の生産性パターンデータが3日分未満の場合、推奨精度が低い旨の警告が画面に表示される', async ({ page }) => {
    // Step 1: 作業実績データ記録・入力画面にアクセスし、テスト用作業者アカウントでログインする
    await page.goto('/panels/scr-1789461993203.html');
    
    // ログイン画面が表示されるまで待機
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    
    // テスト用作業者アカウントでログイン
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass');
    await page.click('button[type="submit"]');
    
    // ログイン後の遷移を待機
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');
    
    // Step 2: 過去2日分の生産性データのみが登録されている作業者を選択する
    await page.waitForSelector('[data-testid="worker-select"]', { timeout: 10000 });
    
    // 過去2日分のみのデータを持つ作業者を選択
    // テスト用データの前提条件として、該当作業者が存在することを想定
    await page.selectOption('[data-testid="worker-select"]', { index: 1 });
    
    // 選択完了を待機
    await page.waitForLoadState('networkidle');
    
    // Step 3: 生産性ダッシュボード・分析画面で当該作業者の生産性データを確認する
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');
    
    // 選択した作業者の生産性データが表示されることを確認
    await page.waitForSelector('[data-testid="productivity-data"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="productivity-data"]')).toBeVisible();
    
    // 当該作業者の生産性データ内容を確認
    const productivityDataText = await page.locator('[data-testid="productivity-data"]').textContent();
    expect(productivityDataText).toBeTruthy();
    
    // Step 4: 最適人員配置案提案・実行画面へ遷移する
    await page.goto('/panels/scr-1789461978707.html');
    await page.waitForLoadState('networkidle');
    
    // Step 5: 最適人員配置案の生成・表示処理が完了するまで待機する
    await page.waitForSelector('[data-testid="allocation-proposal"]', { timeout: 30000 });
    
    // Step 6: 画面上の配置案表示領域を確認する
    // 警告メッセージが表示されていることを確認
    const warningMessage = page.locator('[data-testid="warning-message"], .warning, [role="alert"]').first();
    
    // 警告が視認可能な状態で表示されている
    await expect(warningMessage).toBeVisible({ timeout: 10000 });
    
    // 警告メッセージの内容を確認（3日分未満に関する警告）
    const warningText = await warningMessage.textContent();
    expect(warningText).toMatch(/3日分|推奨精度|低い可能性/);
    
    // 警告が配置案領域内またはその直上に表示されている
    const allocationArea = page.locator('[data-testid="allocation-proposal"]');
    const allocationBox = await allocationArea.boundingBox();
    const warningBox = await warningMessage.boundingBox();
    
    // 警告が領域内または直上に配置されていることを確認
    if (allocationBox && warningBox) {
      const isDirectlyAbove = warningBox.y + warningBox.height <= allocationBox.y + 10;
      const isWithinArea = warningBox.y >= allocationBox.y && warningBox.y < allocationBox.y + allocationBox.height;
      expect(isDirectlyAbove || isWithinArea).toBe(true);
    }
    
    // 警告に黄色背景などの強調表示が適用されていることを確認
    const backgroundColor = await warningMessage.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // 黄色系の背景色を検出（RGB値で黄色を確認）
    const rgbMatch = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      // 黄色系（赤と緑が高く、青が低い）
      expect(r > 150 && g > 150 && b < 150).toBe(true);
    }
  });
});