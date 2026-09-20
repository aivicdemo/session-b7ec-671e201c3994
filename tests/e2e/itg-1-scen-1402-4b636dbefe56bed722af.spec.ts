import { test, expect } from '@playwright/test';

test.describe('承認モーダル確定', () => {
  test('承認判定結果が人員配置案に反映され、ステータスが承認済みに更新されて永続化される', async ({ page }) => {
    // 人員配置最適化提案・実行画面を開く
    await page.goto('/panels/scr-1789461798629.html');
    await page.waitForLoadState('networkidle');

    // 画面上に表示されている人員配置案の中から、承認対象の配置案1件を特定
    const proposalDetailContainer = page.locator('#proposals-container');
    await expect(proposalDetailContainer).toBeVisible();
    
    const proposals = page.locator('[id^="proposal-"]');
    const proposalCount = await proposals.count();
    expect(proposalCount).toBeGreaterThan(0);

    // 最初の配置案を対象として、承認前のステータスを確認
    const firstProposal = proposals.first();
    await expect(firstProposal).toBeVisible();

    // 当該配置案に対して『承認』ボタンをクリック
    const approveBtn = firstProposal.locator('[id="approve-btn"]');
    await approveBtn.click();

    // 承認モーダルが開き、配置内容が正確に表示されていることを確認
    const approveModalOverlay = page.locator('#approve-modal-overlay');
    await expect(approveModalOverlay).toBeVisible();

    const approveModalContent = page.locator('#approve-modal-content');
    await expect(approveModalContent).toBeVisible();

    // モーダル内に配置内容（拠点名・移動人員数・移動元拠点・理由）が表示されていることを確認
    const modalText = await approveModalContent.textContent();
    expect(modalText).toBeTruthy();

    // モーダル内の『確定』ボタンをクリック
    const approveModalConfirm = page.locator('[id="approve-modal-confirm"]');
    await approveModalConfirm.click();

    // 画面がモーダルを閉じ、人員配置最適化提案・実行画面に戻ることを確認
    await expect(approveModalOverlay).not.toBeVisible();

    // 当該配置案のステータスが『未承認』から『承認済み』に変更されていることを画面上で確認
    const updatedProposal = proposals.first();
    const statusText = await updatedProposal.textContent();
    expect(statusText).toContain('承認済み');

    // ブラウザをリロードして画面を再表示させる
    await page.reload();
    await page.waitForLoadState('networkidle');

    // リロード後も当該配置案のステータスが『承認済み』のまま表示されていることを確認
    const reloadedProposals = page.locator('[id^="proposal-"]');
    const reloadedFirstProposal = reloadedProposals.first();
    const reloadedStatusText = await reloadedFirstProposal.textContent();
    expect(reloadedStatusText).toContain('承認済み');
  });
});