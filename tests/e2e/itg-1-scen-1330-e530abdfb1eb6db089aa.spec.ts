import { test, expect } from '@playwright/test';

test.describe('人員配置最適化提案画面表示', () => {
  test('検討対象拠点が指定されていない場合、エラーメッセージが表示される', async ({ page }) => {
    // ログイン処理
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // ログインフォームに入力してログイン
    await page.fill('input[placeholder*="ユーザー"]', 'testuser');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("ログイン")');
    await page.waitForLoadState('networkidle');

    // 人員配置最適化提案・実行画面を開く
    await page.goto('/panels/scr-1789461798629.html');
    await page.waitForLoadState('networkidle');

    // 拠点選択フィールドが存在することを確認
    const siteFilterLocator = page.locator('[data-testid="site-filter"]');
    await expect(siteFilterLocator).toBeVisible();

    // 拠点選択フィールドで選択されている拠点がある場合は、すべて解除する
    const selectedOptions = page.locator('[data-testid="site-filter"] option[selected], [data-testid="site-filter"] [selected]');
    const selectedCount = await selectedOptions.count();
    
    if (selectedCount > 0) {
      // 拠点選択フィールドをクリックして開く
      await siteFilterLocator.click();
      
      // 選択されているすべての拠点を解除
      await siteFilterLocator.evaluate((select: HTMLSelectElement) => {
        if (select.multiple) {
          for (let i = 0; i < select.options.length; i++) {
            select.options[i].selected = false;
          }
        } else {
          select.value = '';
        }
      });
    }

    // 拠点が1つも選択されていない状態を確認
    const finalSelectedCount = await page.locator('[data-testid="site-filter"] option[selected]').count();
    expect(finalSelectedCount).toBe(0);

    // 「人員配置案を自動生成」ボタンをクリック
    const generateButton = page.locator('button:has-text("人員配置案を自動生成")');
    
    // ボタンをクリック
    await generateButton.click();

    // エラーメッセージ『検討対象拠点を1つ以上選択してください』が表示されることを確認
    const errorMessage = page.locator('text=検討対象拠点を1つ以上選択してください');
    await expect(errorMessage).toBeVisible();

    // ボタンが押下に応答しなかったことを検証
    // ボタンクリック後、提案内容が生成されていないことを確認
    
    // proposals-container に配置案が生成されていないことを確認
    const proposalsContainer = page.locator('#proposals-container');
    
    // 提案が存在しないか、初期メッセージが表示されたままであることを確認
    const proposalDetailContainer = page.locator('#proposal-detail-container');
    await expect(proposalDetailContainer).toContainText('配置案を選択して詳細を表示');

    // 配置案詳細テーブルが空のままであることを確認（処理が開始されなかったことの証拠）
    const assignmentDetailTbody = page.locator('#assignment-detail-tbody');
    const tableRows = await assignmentDetailTbody.locator('tr').count();
    expect(tableRows).toBe(0);
  });
});