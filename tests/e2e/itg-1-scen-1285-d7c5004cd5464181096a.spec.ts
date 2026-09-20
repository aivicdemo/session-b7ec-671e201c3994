import { test, expect } from '@playwright/test';

test('SCEN-1285: 現在の作業者数が0のとき、人員配置未実施である旨のエラーメッセージが表示されて処理が中止される', async ({ page }) => {
  // ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');

  // 現在の作業者数が0の状態を準備するため、ダッシュボード画面で「人員配置を最適化」ボタンをクリック
  const optimizeButton = page.getByRole('button', { name: '人員配置を最適化' });
  await optimizeButton.click();

  // 人員配置最適化提案・実行画面へ遷移するまで待機
  await page.waitForURL(/scr-1789461798629/);
  await page.waitForLoadState('networkidle');

  // リスク分析結果の表示領域を確認
  const proposalsContainer = page.locator('#proposals-container');
  await expect(proposalsContainer).toBeVisible();

  // エラーメッセージが表示領域内に表示されることを確認
  const errorMessage = proposalsContainer.locator('text=現在この拠点に配置されている作業者がいません。人員配置を実施してからリスク分析を再度実行してください。');
  await expect(errorMessage).toBeVisible();

  // 人員配置案の生成・実行ボタンが無効化されていることを確認
  const generateProposalsBtn = page.getByTestId('generate-proposals-btn');
  await expect(generateProposalsBtn).toBeDisabled();

  // ページが遷移していないことを確認（人員配置最適化提案・実行画面に留まっている）
  await expect(page).toHaveURL(/scr-1789461798629/);
});