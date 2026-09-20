import { test, expect } from '@playwright/test';

test.describe('SCEN-1412: 配信モーダル確定', () => {
  test('「確定」ボタンクリック後、モーダルが閉じて配置案ステータスが「配信完了」に更新され、完了メッセージが表示される', async ({ page }) => {
    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // 人員配置最適化提案・実行画面に遷移する
    await page.click('nav a[href*="scr-1789461798629"]');
    await page.waitForLoadState('networkidle');

    // 配置案が表示されていることを確認する
    const proposalContainer = page.locator('#proposals-container');
    await expect(proposalContainer).toBeVisible();
    const proposals = page.locator('#proposals-container [class*="proposal"]');
    await expect(proposals.first()).toBeVisible();

    // 配置案に対して「配信」ボタンをクリックする前に、対象の配置案要素を取得
    const firstProposal = proposals.first();
    const distributeBtn = firstProposal.getByTestId('distribute-button');
    await expect(distributeBtn).toBeVisible();

    // 配置案の状態を確認（変更前）
    const statusBeforeDistribute = await firstProposal.locator('[class*="status"]').textContent();

    await distributeBtn.click();

    // 配信確定モーダルが表示される
    const distributeModal = page.locator('#distribute-modal-overlay');
    await expect(distributeModal).toBeVisible();

    // モーダル内の「確定」ボタンをクリックする
    const distributeConfirmBtn = page.getByTestId('distribute-modal-confirm');
    await expect(distributeConfirmBtn).toBeVisible();
    await distributeConfirmBtn.click();

    // モーダルが閉じられることを確認
    await expect(distributeModal).not.toBeVisible();

    // 配置案の状態が「配信待機中」から「配信完了」に変わっていることを確認する
    const statusAfterDistribute = await firstProposal.locator('[class*="status"]').textContent();
    expect(statusAfterDistribute).toContain('配信完了');
    // 状態が変化したことを確認
    expect(statusBeforeDistribute).not.toEqual(statusAfterDistribute);

    // 画面上に「配置指示を現場リーダーに配信しました。受領確認をお待ちしています」というメッセージが表示されていることを確認する
    const successMessage = page.locator('text=配置指示を現場リーダーに配信しました。受領確認をお待ちしています');
    await expect(successMessage).toBeVisible();
  });
});