import { test, expect } from '@playwright/test';

test('SCEN-1244: 古いデータに基づく配置案には「データ更新待機中」と注記される', async ({ page }) => {
  // 進捗・人員配置ダッシュボード画面を開く
  await page.goto('/');
  await page.waitForURL(/scr-1789461783315/);
  
  // ダッシュボードが表示され、最後に正常取得したキャッシュデータが表示されていることを確認する
  const dashboard = page.locator('[data-testid="kpi-risk-count"]');
  await expect(dashboard).toBeVisible();
  
  // ダッシュボードが読み込まれていることを確認
  await expect(page.locator('text=読込中...')).not.toBeVisible({ timeout: 10000 });
  
  // 人員配置最適化提案・実行画面へ遷移する
  const optimizationLink = page.locator('a:has-text("人員配置最適化提案")');
  await optimizationLink.click();
  await page.waitForURL(/scr-1789461798629/);
  
  // 画面内に表示されている人員配置案を確認する
  const proposalsContainer = page.locator('#proposals-container');
  await expect(proposalsContainer).toBeVisible();
  
  // 人員配置最適化提案・実行画面で表示された配置案に対して、
  // 『データ更新待機中』という注記が配置案の近傍に明示されている
  const waitingForUpdateLabel = page.locator('text=データ更新待機中');
  await expect(waitingForUpdateLabel).toBeVisible();
  
  // 『進捗データの更新に遅延が発生しています。最後の更新：○分前』というメッセージがページ上部に表示されている
  const delayMessage = page.locator('text=進捗データの更新に遅延が発生しています');
  await expect(delayMessage).toBeVisible();
  
  // メッセージに「最後の更新」の情報が含まれていることを確認
  const messageText = await delayMessage.textContent();
  expect(messageText).toMatch(/最後の更新：\d+分前/);
});