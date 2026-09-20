import { test, expect } from '@playwright/test';

test('SCEN-1367: 配置案が画面に表示されるとき、全体の分析対象拠点数・高リスク拠点数・推奨配置案数が集計値として表示される', async ({ page }) => {
  // ブラウザで『人員配置最適化提案・実行画面』を開く
  await page.goto('/panels/scr-1789461798629.html');
  await page.waitForLoadState('networkidle');

  // 画面左上の『配置案を生成』ボタンをクリックする
  const generateProposalsBtn = page.getByTestId('generate-proposals-btn');
  await generateProposalsBtn.click();

  // 配置案の生成処理が実行され、画面の結果サマリーセクションに集計値が表示されるまで待機する
  await page.waitForSelector('[id="proposals-container"]', { state: 'visible' });

  // 結果サマリーセクションが表示されていることを確認
  const proposalsContainer = page.locator('[id="proposals-container"]');
  await expect(proposalsContainer).toBeVisible();

  // 分析対象拠点数『5』が表示されていることを確認
  const siteCountElement = page.locator('text=/分析対象拠点数.*5/');
  await expect(siteCountElement).toBeVisible();
  const siteCountText = await siteCountElement.textContent();
  expect(siteCountText).toMatch(/5/);

  // 高リスク拠点数『2』が表示されていることを確認
  const highRiskCountElement = page.locator('text=/高リスク拠点数.*2/');
  await expect(highRiskCountElement).toBeVisible();
  const highRiskCountText = await highRiskCountElement.textContent();
  expect(highRiskCountText).toMatch(/2/);

  // 推奨配置案数『3』が表示されていることを確認
  const recommendedPlansCountElement = page.locator('text=/推奨配置案数.*3/');
  await expect(recommendedPlansCountElement).toBeVisible();
  const recommendedPlansCountText = await recommendedPlansCountElement.textContent();
  expect(recommendedPlansCountText).toMatch(/3/);

  // 3つの集計値が同時に表示されていることを確認
  await expect(siteCountElement).toBeVisible();
  await expect(highRiskCountElement).toBeVisible();
  await expect(recommendedPlansCountElement).toBeVisible();
});