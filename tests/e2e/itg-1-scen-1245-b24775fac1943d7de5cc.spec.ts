import { test, expect } from '@playwright/test';

test.describe('SCEN-1245: 配置案生成時にWMSの在庫・優先度情報が同期され作業優先順位の変更が反映される', () => {
  test('人員配置最適化提案画面遷移', async ({ page }) => {
    // Step 1: 進捗・人員配置ダッシュボード画面を開き、ユーザが管理者権限でログイン
    await page.goto('/');
    await page.waitForURL(/scr-1789461783315\.html/);
    
    // ログイン画面が表示されている場合はログイン
    const loginForm = await page.locator('input[type="text"]').first().isVisible().catch(() => false);
    if (loginForm) {
      await page.locator('input[type="text"]').first().fill('admin');
      await page.locator('input[type="password"]').fill('password');
      await page.locator('button:has-text("ログイン")').click();
      await page.waitForURL(/scr-1789461783315\.html/);
    }

    // ダッシュボード画面が表示されることを確認
    await expect(page.locator('text=進捗・人員配置ダッシュボード')).toBeVisible();

    // Step 2: ダッシュボード上の「配置案を生成」ボタンをクリック
    const generateButton = page.locator('button:has-text("人員配置案を自動生成")');
    await generateButton.click();

    // Step 3: 人員配置最適化提案・実行画面に遷移し、画面が読み込み中の状態を確認
    await page.waitForURL(/scr-1789461798629\.html/);
    
    // 読み込み中の表示を確認（あれば）
    const loadingIndicator = page.locator('text=読込中');
    if (await loadingIndicator.isVisible()) {
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
    }

    // Step 4: 人員配置最適化提案・実行画面の読み込みが完了し、画面上に「WMS同期完了：150件の在庫情報、優先度変更3件を検知」というメッセージが表示されることを確認
    const wmsMessage = page.locator('text=WMS同期完了：150件の在庫情報、優先度変更3件を検知');
    await expect(wmsMessage).toBeVisible();

    // Step 5: 人員配置最適化提案・実行画面の「推奨配置案」セクションに、作業指示のリストが表示されていることを確認
    const proposalContainer = page.locator('#proposals-container');
    await expect(proposalContainer).toBeVisible();
    
    const assignmentTable = page.locator('#assignment-detail-tbody');
    await expect(assignmentTable).toBeVisible();
    
    const tableRows = assignmentTable.locator('tr');
    await expect(tableRows).not.toHaveCount(0);

    // Step 6: 配置案リスト内の各行に「優先度レベル」「更新源：WMS同期」「同期時刻」の属性が表示されていることを確認
    const firstRow = tableRows.first();
    const firstRowText = await firstRow.textContent();
    
    // 同じ行内に優先度レベル、更新源、同期時刻が含まれていることを確認
    expect(firstRowText).toMatch(/Lv\d+/);
    expect(firstRowText).toContain('WMS同期');
    expect(firstRowText).toMatch(/\d{4}-\d{2}-\d{2}/);

    // Step 7: 配置案リストの作業指示の並び順を確認し、優先度レベルが3の作業が優先度レベルが1の作業より上位に配列されていることを確認
    const allRows = await tableRows.all();
    
    if (allRows.length >= 2) {
      let priority3RowIndex = -1;
      let priority1RowIndex = -1;
      
      for (let i = 0; i < allRows.length; i++) {
        const rowText = await allRows[i].textContent();
        if (rowText?.includes('Lv3')) {
          priority3RowIndex = i;
        }
        if (rowText?.includes('Lv1') && priority1RowIndex === -1) {
          priority1RowIndex = i;
        }
      }
      
      // 優先度レベル3が優先度レベル1より上位に配列されていることを確認
      if (priority3RowIndex !== -1 && priority1RowIndex !== -1) {
        expect(priority3RowIndex).toBeLessThan(priority1RowIndex);
      }
    }

    // 最終確認：提案画面が正常に表示されている
    await expect(page.locator('text=推奨配置案')).toBeVisible();
  });
});