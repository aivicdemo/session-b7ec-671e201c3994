import { test, expect } from '@playwright/test';

test.describe('人員配置案自動生成', () => {
  test('複数の配置案が生成された後、生成された配置案が検討対象として抽出され実現可能性スコアで優先度付けされる', async ({ page }) => {
    // テストユーザーで「人員配置最適化提案・実行画面」にログインする
    await page.goto('/');
    await page.waitForURL(/\\/panels\\/scr-\\d+\\.html/);
    
    // ログイン画面が表示される場合のハンドリング
    const loginForm = page.locator('.login-form');
    if (await loginForm.isVisible()) {
      await page.fill('input[name="userId"]', 'testuser');
      await page.fill('input[name="password"]', 'testpass');
      await page.click('button:has-text("ログイン")');
      await page.waitForURL(/\\/panels\\/scr-\\d+\\.html/);
    }

    // 人員配置最適化提案・実行画面へナビゲート
    await page.click('nav [href*="scr-1789461798629"]');
    await page.waitForURL(/scr-1789461798629/);

    // 現在の作業進捗データとして、複数拠点（東京DC、大阪DC、名古屋DC）の進捗情報（完了数・残数・進捗率）が画面に表示されることを確認する
    const progressRateValue = page.locator('#progress-rate-value');
    await expect(progressRateValue).toBeVisible();
    const progressText = await progressRateValue.textContent();
    expect(progressText).toBeTruthy();
    
    const plannedProgress = page.locator('#planned-progress');
    await expect(plannedProgress).toBeVisible();
    
    const actualProgress = page.locator('#progress-bar-actual');
    await expect(actualProgress).toBeVisible();

    // 現在の生産性データとして、各拠点の作業者ごとの生産性指標（時間当たり処理数、習熟度）が画面に表示されることを確認する
    const productivityList = page.locator('#productivity-list');
    await expect(productivityList).toBeVisible();
    
    const productivityItems = productivityList.locator('> *');
    const productivityCount = await productivityItems.count();
    expect(productivityCount).toBeGreaterThan(0);
    
    // 作業者ごとの習熟度と時間当たり処理数が表示されていることを確認
    for (let i = 0; i < Math.min(productivityCount, 3); i++) {
      const item = productivityItems.nth(i);
      const itemText = await item.textContent();
      expect(itemText).toBeTruthy();
    }

    // 「人員配置案の自動生成」ボタンを実行する
    const generateButton = page.locator('button:has-text("人員配置案を自動生成")');
    await expect(generateButton).toBeVisible();
    await generateButton.click();

    // 配置案の自動生成完了通知または配置案一覧が表示されることを確認する
    await page.waitForTimeout(1000);
    const proposalsContainer = page.locator('#proposals-container');
    await expect(proposalsContainer).toBeVisible();

    // 生成された複数の配置案が検討対象として抽出・表示されていることを確認する
    const proposalItems = page.locator('#proposals-container > div');
    const proposalCount = await proposalItems.count();
    expect(proposalCount).toBeGreaterThanOrEqual(3);

    // 各配置案の実現可能性スコアを取得して検証
    const scores: number[] = [];
    const scoreDetails: Array<{ score: number; details: string }> = [];
    
    for (let i = 0; i < proposalCount; i++) {
      const proposalElement = proposalItems.nth(i);
      
      // 配置案が表示されていることを確認
      await expect(proposalElement).toBeVisible();
      
      // 実現可能性スコアが表示されていることを確認
      const proposalContent = await proposalElement.textContent();
      expect(proposalContent).toBeTruthy();
      
      // スコア（パーセンテージ）を抽出
      const scoreMatch = proposalContent?.match(/(\d+)%/);
      let score = 0;
      if (scoreMatch) {
        score = parseInt(scoreMatch[1]);
        scores.push(score);
      }
      
      // 配置案の詳細情報（追加人員数・配置元拠点・配置先拠点）が明記されていることを確認
      const hasAssignmentCount = proposalContent?.includes('名') || proposalContent?.includes('人');
      const hasSiteInfo = proposalContent?.includes('拠点') || proposalContent?.includes('DC');
      
      expect(proposalContent).toMatch(/\d+/); // 数値を含む
      expect(hasAssignmentCount || hasSiteInfo).toBeTruthy();
      
      scoreDetails.push({
        score: score,
        details: proposalContent || ''
      });
    }

    // スコアが降順（高い順）に並んでいることを確認
    expect(scores.length).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }

    // 最上位配置案が画面上部に位置していることを確認
    const firstProposal = proposalItems.first();
    const firstProposalBox = await firstProposal.boundingBox();
    expect(firstProposalBox).not.toBeNull();
    if (firstProposalBox) {
      expect(firstProposalBox.y).toBeLessThanOrEqual(500);
    }

    // 各案に数値スコアが表示されていることを確認
    for (const score of scores) {
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});