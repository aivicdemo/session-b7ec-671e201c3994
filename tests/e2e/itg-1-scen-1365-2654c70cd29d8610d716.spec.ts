import { test, expect } from '@playwright/test';

test.describe('人員配置案自動生成', () => {
  test('配置案が画面に表示されるとき、各案にはリスクレベル（高・中・低）が付与されている', async ({ page }) => {
    // テスト対象システムにログインし、進捗・人員配置ダッシュボード画面に遷移する
    await page.goto('/');
    
    // ログイン画面が表示されるため、ログイン操作を実行
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button:has-text("ログイン")');
    
    // ダッシュボード画面の読み込み完了を待つ
    await page.waitForURL('**/scr-1789461783315.html');
    
    // ダッシュボード画面から『人員配置最適化提案・実行画面』へナビゲートする
    await page.click('a:has-text("人員配置最適化提案")');
    
    // 人員配置最適化提案・実行画面が読み込まれるのを待つ
    await page.waitForURL('**/scr-1789461798629.html');
    
    // 画面上に配置案の一覧が表示されるのを確認する
    const proposalsContainer = page.locator('#proposals-container');
    await expect(proposalsContainer).toBeVisible();
    
    // 配置案のすべての要素を取得
    const proposalElements = page.locator('#proposals-container > [id*="proposal-"]');
    const proposalCount = await proposalElements.count();
    
    // 配置案が存在することを確認
    expect(proposalCount).toBeGreaterThan(0);
    
    // 表示されているすべての配置案に対して、リスクレベルのラベルと具体的な値が付与されているか確認
    for (let i = 0; i < proposalCount; i++) {
      const proposal = proposalElements.nth(i);
      
      // リスクレベルのラベルと値を含むテキストを取得
      const riskLevelText = await proposal.locator('text=/リスクレベル/').textContent();
      
      // リスクレベルのラベルが存在することを確認
      await expect(proposal.locator('text=/リスクレベル/')).toBeVisible();
      
      // リスクレベルの値が『高』『中』『低』のいずれかであることを確認
      const riskValue = await proposal.locator('text=/(高|中|低)/').textContent();
      expect(riskValue).toMatch(/(高|中|低)/);
    }
  });
});