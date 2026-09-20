import { test, expect } from '@playwright/test';

test.describe('SCEN-1233: 人員配置最適化提案画面遷移', () => {
  test('各配置案に推奨理由が日本語テキストで付与される', async ({ page }) => {
    // ブラウザで進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');
    
    // ダッシュボード画面から「人員配置最適化提案・実行画面」へのナビゲーションボタンをクリック
    const optimizationNavButton = page.locator('a:has-text("人員配置最適化提案")');
    await optimizationNavButton.click();
    
    // 人員配置最適化提案・実行画面に遷移し、画面の読み込みが完了するまで待機
    await page.waitForURL('**/scr-1789461798629.html');
    await page.waitForLoadState('networkidle');
    
    // 画面に表示されている各人員配置案の行要素を確認
    const proposalsContainer = page.locator('id=proposals-container');
    await expect(proposalsContainer).toBeVisible();
    
    // 各配置案の詳細要素を取得
    const proposalDetails = page.locator('id=proposal-detail-container');
    const detailCount = await proposalDetails.count();
    
    expect(detailCount).toBeGreaterThan(0);
    
    // 各配置案について推奨理由テキストが存在することを検証
    const collectedReasons: string[] = [];
    for (let i = 0; i < detailCount; i++) {
      const detail = proposalDetails.nth(i);
      
      // 推奨理由要素を取得（proposal-reason IDで指定）
      const reasonElement = detail.locator('id=proposal-reason');
      
      // 推奨理由が存在し、可視状態であることを確認
      await expect(reasonElement).toBeVisible();
      
      // 推奨理由のテキストを取得
      const reasonText = await reasonElement.textContent();
      
      // テキストが存在することを確認
      expect(reasonText).toBeTruthy();
      
      // 日本語テキストを含むことを確認
      expect(reasonText).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/);
      
      // 具体的な情報（拠点、人数、スコア、リスク率などのキーワード）を含むことを確認
      const hasDetailedContent = /[拠点名人数スコア習熟度進捗遅延リスク対応最適作業%点]/.test(reasonText || '');
      expect(hasDetailedContent).toBeTruthy();
      
      collectedReasons.push(reasonText || '');
    }
    
    // 複数の配置案がある場合、異なるテキストが表示されていることを確認
    if (collectedReasons.length > 1) {
      const uniqueReasons = new Set(collectedReasons);
      // 複数案がある場合、すべてが同じテキストではないことを確認
      expect(uniqueReasons.size).toBeGreaterThan(1);
    }
  });
});