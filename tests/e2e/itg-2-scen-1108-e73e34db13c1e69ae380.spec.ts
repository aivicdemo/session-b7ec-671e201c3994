import { test, expect } from '@playwright/test';

test('SCEN-1108: 確認アクション完了後に後続フローへの遷移準備が整う', async ({ page }) => {
  // 最適人員配置案提案・実行画面を開く
  await page.goto('/panels/scr-1789461978707.html');
  
  // 自動生成された配置案が表示されていることを確認する
  const placementProposal = page.locator('[data-testid="placement-proposal"]');
  await expect(placementProposal).toBeVisible();
  
  // 配置案の詳細内容を確認
  const proposalDetails = page.locator('[data-testid="proposal-details"]');
  await expect(proposalDetails).toBeVisible();
  
  // 『確認完了』ボタンをクリック
  const confirmButton = page.locator('button:has-text("確認完了")');
  await confirmButton.click();
  
  // 後続フローへのUI要素が活性化状態で表示されることを確認
  const nextActionButtons = page.locator('[data-testid="next-actions"] button');
  await expect(nextActionButtons.first()).toBeEnabled();
  await expect(nextActionButtons.first()).toBeVisible();
  
  // 配置案の確認状態が『確認済み』に更新されたことを確認
  const confirmationStatus = page.locator('[data-testid="confirmation-status"]');
  await expect(confirmationStatus).toContainText('確認済み');
  
  // 画面下部に『後続処理準備完了』または同等のメッセージが表示されることを確認
  const completionMessage = page.locator('[data-testid="completion-message"]');
  await expect(completionMessage).toBeVisible();
  await expect(completionMessage).toContainText(/後続処理準備完了|準備完了/);
});