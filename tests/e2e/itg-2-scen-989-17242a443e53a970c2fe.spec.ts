import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-989: 境界系：品質スコアが下限値（0.0）で送信されても、入力データ検証に合格して記録される', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/');
    
    // ログイン処理
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("ログイン")');
    await page.waitForNavigation();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('品質スコア0.0で保存したデータが記録される', async () => {
    // Step 1: 作業実績データ記録・入力画面を開く
    await page.goto('/panels/scr-1789461993203.html');
    await page.waitForLoadState('networkidle');

    // Step 2: 作業タイプ、部門、作業者名などの必須項目を入力する
    await page.fill('input[data-field="workType"]', 'テスト作業');
    await page.fill('input[data-field="department"]', 'テスト部門');
    await page.fill('input[data-field="workerName"]', 'テスト作業者');
    await page.fill('input[data-field="workDuration"]', '8');

    // Step 3: 品質スコア項目に下限値である 0.0 を入力する
    await page.fill('input[data-field="qualityScore"]', '0.0');

    // Step 4: データ保存ボタンをクリックする
    await page.click('button:has-text("保存")');

    // Step 5: 保存処理が完了し、画面上に成功メッセージが表示されることを確認する
    const successMessage = page.locator('text=/保存|成功|完了/i');
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // 保存したデータの詳細を取得するため、少し待機
    await page.waitForTimeout(500);

    // Step 6: 生産性ダッシュボード・分析画面に遷移し、保存したデータが実績一覧に品質スコア 0.0 で表示されていることを確認する
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');

    // 実績一覧テーブルで品質スコア 0.0 のレコードを確認
    const performanceList = page.locator('table tbody tr');
    
    let recordFound = false;
    const rowCount = await performanceList.count();
    
    for (let i = 0; i < rowCount; i++) {
      const row = performanceList.nth(i);
      const rowText = await row.textContent();
      
      // テスト作業者名とスコア 0.0 の両方を含む行を検索
      if (rowText?.includes('テスト作業者') && rowText?.includes('0.0')) {
        recordFound = true;
        
        // 品質スコア列が 0.0 であることを確認
        const qualityScoreCell = row.locator('[data-field="qualityScore"]');
        const scoreValue = await qualityScoreCell.textContent();
        await expect(scoreValue?.trim()).toBe('0.0');
        
        break;
      }
    }

    await expect(recordFound).toBe(true);
  });
});