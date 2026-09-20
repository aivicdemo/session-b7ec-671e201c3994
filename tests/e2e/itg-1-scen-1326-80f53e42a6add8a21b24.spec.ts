import { test, expect } from '@playwright/test';

test('SCEN-1326: 優先度スコアが50以上75未満の配置案はリスクレベル「中」と判定されて表示される', async ({ page }) => {
  // 人員配置最適化提案・実行画面を開く
  await page.goto('/panels/scr-1789461798629.html');
  
  // 配置案を生成ボタンをクリック
  const generateButton = page.getByRole('button', { name: /人員配置案を自動生成|最適化提案を実行/ });
  await generateButton.click();
  
  // 配置案の一覧が表示されるまで待機
  await page.waitForSelector('[id="proposals-container"]');
  const proposalsContainer = page.locator('[id="proposals-container"]');
  await expect(proposalsContainer).toBeVisible();
  
  // 配置案の詳細情報を取得
  const proposals = page.locator('[id="proposal-detail-container"]');
  const proposalCount = await proposals.count();
  
  // 優先度スコアが50以上75未満の配置案を特定してリスクレベルを確認
  let targetProposalFound = false;
  let targetProposalRiskLevel = '';
  
  for (let i = 0; i < proposalCount; i++) {
    const proposal = proposals.nth(i);
    
    // 配置案のテキスト内容を取得
    const proposalText = await proposal.textContent();
    
    // 優先度スコアを抽出（例：「スコア: 60」のような形式を想定）
    const scoreMatch = proposalText?.match(/スコア[:\s：]+(\d+(?:\.\d+)?)/);
    
    if (scoreMatch) {
      const priorityScore = parseFloat(scoreMatch[1]);
      
      // 優先度スコアが50以上75未満の範囲に該当するか判定
      if (priorityScore >= 50 && priorityScore < 75) {
        // リスクレベル表示領域を確認
        const riskLevelElement = proposal.locator('[id="risk-level"]');
        
        if (await riskLevelElement.isVisible()) {
          const riskLevelText = await riskLevelElement.textContent();
          
          // リスクレベルが「中」であることを確認
          if (riskLevelText && (riskLevelText.includes('中') || riskLevelText.includes('MEDIUM'))) {
            targetProposalFound = true;
            targetProposalRiskLevel = riskLevelText;
            
            // リスクレベル「中」が表示されていることを検証
            await expect(riskLevelElement).toContainText(/中|MEDIUM/);
            break;
          }
        }
      }
    }
  }
  
  // 優先度スコアが50以上75未満の配置案が存在し、リスクレベル「中」が表示されていることを確認
  expect(targetProposalFound).toBeTruthy();
});