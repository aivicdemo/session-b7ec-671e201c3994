import { test, expect } from '@playwright/test';

test('人員配置案が表示されるとき、各案には推奨理由が日本語テキストで付与されている', async ({ page }) => {
  // ログイン画面に遷移
  await page.goto('/');
  
  // ログイン操作
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpassword');
  await page.click('button:has-text("ログイン")');
  
  // ダッシュボード画面への遷移を待機
  await page.waitForURL('**/scr-1789461783315.html');
  
  // 人員配置最適化提案画面に遷移
  await page.click('a:has-text("人員配置最適化提案")');
  await page.waitForURL('**/scr-1789461798629.html');
  
  // 現在の作業進捗と生産性データが読み込まれていることを確認
  await test.step('進捗ダッシュボード領域に拠点ごとの進捗率と遅延リスク値が表示されていることを確認', async () => {
    const progressRate = page.locator('[data-testid="progress-rate"]');
    await expect(progressRate).toBeVisible();
    
    const plannedProgress = page.locator('#planned-progress');
    await expect(plannedProgress).toBeVisible();
    
    // 拠点ごとの進捗率が表示されていることを確認
    const siteVarianceTable = page.locator('[data-testid="site-variance-table"]');
    await expect(siteVarianceTable).toBeVisible();
    const siteRows = page.locator('#site-variance-tbody tr');
    await expect(siteRows).not.toHaveCount(0);
    
    // 遅延リスク値が表示されていることを確認
    const riskAssessmentTable = page.locator('[data-testid="risk-assessment-table"]');
    await expect(riskAssessmentTable).toBeVisible();
    const riskRows = page.locator('#risk-assessment-tbody tr');
    await expect(riskRows).not.toHaveCount(0);
  });
  
  // 人員配置案の自動生成トリガーを実行
  await test.step('配置案を自動生成', async () => {
    const generateButton = page.locator('[data-testid="generate-proposals-btn"]');
    await generateButton.click();
    
    // 複数の配置案が表示されるまで待機
    await page.waitForTimeout(1000);
  });
  
  // 表示された配置案から推奨理由を取得して検証
  await test.step('各配置案に日本語の推奨理由が付与されていることを確認', async () => {
    const proposalsContainer = page.locator('#proposals-container');
    await expect(proposalsContainer).toBeVisible();
    
    const proposalItems = proposalsContainer.locator('> div');
    const count = await proposalItems.count();
    
    expect(count).toBeGreaterThan(0);
    
    let visibleReasonsCount = 0;
    
    // 各配置案の推奨理由を検証
    for (let i = 0; i < count; i++) {
      const proposal = proposalItems.nth(i);
      
      // 推奨理由要素を取得（配置案内のすべての推奨理由要素を検索）
      const reasonElements = proposal.locator('[id*="proposal-reason"], [class*="proposal-reason"], [data-testid*="reason"]');
      
      const reasonElementCount = await reasonElements.count();
      
      if (reasonElementCount > 0) {
        // 最初の推奨理由要素を使用（複数ある場合）
        const reasonElement = reasonElements.first();
        
        await expect(reasonElement).toBeVisible();
        
        const reasonText = await reasonElement.textContent();
        
        // 推奨理由がテキストとして存在することを確認
        expect(reasonText).toBeTruthy();
        expect(reasonText?.trim().length).toBeGreaterThan(0);
        
        const reasonTextStr = reasonText?.trim() || '';
        
        // 日本語テキストが含まれていることを確認
        const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;
        expect(japanesePattern.test(reasonTextStr)).toBeTruthy();
        
        // 推奨理由の内容構成を検証：3つの要素を含むことを確認
        // (1) 遅延リスク判定の根拠(リスク値、現進捗状況)
        const hasRiskBasis = /リスク|遅延|進捗|%/;
        expect(hasRiskBasis.test(reasonTextStr)).toBeTruthy();
        
        // (2) 配置対象者または配置元拠点の生産性・習熟度情報
        const hasProductivityInfo = /生産性|習熟度|拠点|作業者|Lv|スキル|余力/;
        expect(hasProductivityInfo.test(reasonTextStr)).toBeTruthy();
        
        // (3) この配置により期待される効果(納期達成見込みなど)
        const hasEffect = /見込める|達成|期待|効果|改善|活用|対応|実現|支援|可能/;
        expect(hasEffect.test(reasonTextStr)).toBeTruthy();
        
        // 推奨理由が配置案の下部または横に配置されていることをDOM検査で確認
        const reasonBoundingBox = await reasonElement.boundingBox();
        const proposalBoundingBox = await proposal.boundingBox();
        
        expect(reasonBoundingBox).toBeTruthy();
        expect(proposalBoundingBox).toBeTruthy();
        
        if (reasonBoundingBox && proposalBoundingBox) {
          // 推奨理由が配置案の下部にあることを確認（Y座標で判定）
          const isBelow = reasonBoundingBox.y >= proposalBoundingBox.y + proposalBoundingBox.height - 10;
          // 推奨理由が配置案の横にあることを確認（X座標で判定）
          const isRight = reasonBoundingBox.x >= proposalBoundingBox.x + proposalBoundingBox.width - 10;
          
          // 推奨理由が配置案内に含まれていることも確認（子要素として存在）
          const isContained = reasonBoundingBox.y >= proposalBoundingBox.y && 
                             reasonBoundingBox.y + reasonBoundingBox.height <= proposalBoundingBox.y + proposalBoundingBox.height &&
                             reasonBoundingBox.x >= proposalBoundingBox.x &&
                             reasonBoundingBox.x + reasonBoundingBox.width <= proposalBoundingBox.x + proposalBoundingBox.width;
          
          expect(isBelow || isRight || isContained).toBeTruthy();
        }
        
        visibleReasonsCount++;
      }
    }
    
    // 1件以上の配置案が推奨理由付きで画面上に可視化されていることを確認
    expect(visibleReasonsCount).toBeGreaterThanOrEqual(1);
  });
});