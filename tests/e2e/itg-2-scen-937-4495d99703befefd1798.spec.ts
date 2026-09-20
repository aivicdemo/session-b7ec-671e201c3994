import { test, expect } from '@playwright/test';

test('SCEN-937: 妥当性スコアが70未満で要確認フラグが立つ配置案を承認した場合、要確認項目のリストが画面に表示され、確認が促される', async ({ page }) => {
  // 最適人員配置案提案・実行画面を開く
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');

  // 妥当性スコアが70未満で要確認フラグが立っている配置案を確認する
  const proposalRow = page.locator('table tbody tr').filter({
    has: page.locator('[data-field="validity-score"]')
  }).first();

  // 妥当性スコアを取得して70未満を確認
  const scoreText = await proposalRow.locator('[data-field="validity-score"]').textContent();
  const scoreValue = parseFloat(scoreText || '0');
  expect(scoreValue).toBeLessThan(70);

  // 要確認フラグが立っているか確認
  const flagElement = proposalRow.locator('[data-field="review-flag"]');
  await expect(flagElement).toBeVisible();

  // その配置案の承認ボタンをクリックする
  const approveButton = proposalRow.locator('button[data-action="approve"]');
  await expect(approveButton).toBeVisible();
  await approveButton.click();

  // 承認処理が完了するまで待機する
  await page.waitForLoadState('networkidle');

  // 承認処理完了後、画面上に『要確認項目リスト』セクションが表示される
  const reviewSectionTitle = page.locator('text=要確認項目リスト');
  await expect(reviewSectionTitle).toBeVisible();

  // 要確認項目が�条書きで列挙されている
  const reviewItemsList = page.locator('[data-section="review-items"] ul li');
  const itemCount = await reviewItemsList.count();
  expect(itemCount).toBeGreaterThan(0);

  // 各要確認項目が表示されていることを確認
  for (let i = 0; i < itemCount; i++) {
    const item = reviewItemsList.nth(i);
    await expect(item).toBeVisible();
    const itemText = await item.textContent();
    expect(itemText).toBeTruthy();
    expect(itemText?.length).toBeGreaterThan(0);
  }
});