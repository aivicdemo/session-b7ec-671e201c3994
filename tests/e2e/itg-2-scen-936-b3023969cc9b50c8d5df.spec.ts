import { test, expect } from '@playwright/test';

test('妥当性スコアが70以上で承認推奨の配置案を承認すると、スコアと判定理由が画面に表示され、配置案が承認状態に遷移する', async ({ page }) => {
  // 最適人員配置案提案・実行画面を開く
  await page.goto('/panels/scr-1789461978707.html');
  
  // 妥当性スコアが70以上で承認推奨状態の配置案を1件表示させる
  // スコア70以上かつ承認推奨の配置案が表示されるまで待機
  await page.waitForSelector('[data-testid="allocation-proposal-card"]', { timeout: 5000 });
  
  // スコア70以上で承認推奨状態の配置案を特定
  const proposalCards = await page.locator('[data-testid="allocation-proposal-card"]').all();
  let targetCard = null;
  
  for (const card of proposalCards) {
    const scoreText = await card.locator('[data-testid="proposal-score"]').textContent();
    const recommendationText = await card.locator('[data-testid="proposal-recommendation"]').textContent();
    
    if (scoreText && recommendationText) {
      const score = parseFloat(scoreText.match(/\d+/)?.[0] || '0');
      if (score >= 70 && recommendationText.includes('承認推奨')) {
        targetCard = card;
        break;
      }
    }
  }
  
  expect(targetCard).toBeTruthy();
  
  // その配置案の承認ボタンをクリックする
  const approveButton = targetCard.locator('[data-testid="approve-button"]');
  await approveButton.click();
  
  // 承認実行の確認ダイアログが表示されるまで待機
  await page.waitForSelector('[data-testid="approval-confirmation-dialog"]', { timeout: 5000 });
  
  const confirmDialog = page.locator('[data-testid="approval-confirmation-dialog"]');
  expect(confirmDialog).toBeVisible();
  
  // 確認ダイアログを承認
  const confirmButton = confirmDialog.locator('[data-testid="confirm-approval-button"]');
  await confirmButton.click();
  
  // ダイアログが閉じるまで待機
  await page.waitForSelector('[data-testid="approval-confirmation-dialog"]', { state: 'hidden', timeout: 5000 });
  
  // 妥当性スコア（70以上の具体値）と判定理由が画面に表示されることを確認
  const scoreDisplay = page.locator('[data-testid="approval-result-score"]');
  const reasonDisplay = page.locator('[data-testid="approval-result-reason"]');
  
  await expect(scoreDisplay).toBeVisible();
  await expect(reasonDisplay).toBeVisible();
  
  const displayedScore = await scoreDisplay.textContent();
  const displayedReason = await reasonDisplay.textContent();
  
  // スコアが70以上であることを確認
  const scoreValue = parseFloat(displayedScore.match(/\d+/)?.[0] || '0');
  expect(scoreValue).toBeGreaterThanOrEqual(70);
  
  // 判定理由に「承認推奨」の文言が含まれていることを確認
  expect(displayedReason).toContain('承認推奨');
  
  // 該当の配置案の状態が「承認待ち」から「承認済み」に遷移したことを確認
  const statusDisplay = targetCard.locator('[data-testid="proposal-status"]');
  await expect(statusDisplay).toContainText('承認済み');
});