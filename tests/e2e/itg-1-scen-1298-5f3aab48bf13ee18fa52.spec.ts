import { test, expect } from '@playwright/test';

test('SCEN-1298: 改善指示配信実行', async ({ page }) => {
  // Step 1: ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');

  // Step 2: 拠点A・チームXの進捗状況を確認
  const siteVarianceTable = page.locator('[id="site-variance-tbody"]');
  await expect(siteVarianceTable).toBeVisible();
  
  const siteVarianceText = await siteVarianceTable.textContent();
  expect(siteVarianceText).toContain('75');
  expect(siteVarianceText).toContain('150');
  expect(siteVarianceText).toContain('50');

  // Step 3: 拠点A・チームXの進捗遅延リスク判定結果を確認
  const riskAssessmentTable = page.locator('[id="risk-assessment-tbody"]');
  await expect(riskAssessmentTable).toBeVisible();
  
  const riskText = await riskAssessmentTable.textContent();
  expect(riskText).toContain('65');
  expect(riskText).toContain('ON');

  // Step 4: 対応が必要な拠点リスト・推奨調整内容を確認
  const recommendedActions = page.locator('[id="recommended-actions"]');
  await expect(recommendedActions).toBeVisible();
  
  const actionsText = await recommendedActions.textContent();
  expect(actionsText).toContain('拠点A');
  expect(actionsText).toContain('チームX');
  expect(actionsText).toContain('3名');
  expect(actionsText).toContain('拠点B');

  // Step 5: 推奨調整内容の優先順位変更案を確認
  // WO-202401-003がWO-202401-002より前に表示されることを検証
  const activePlansTable = page.locator('[id="active-plans-tbody"]');
  await expect(activePlansTable).toBeVisible();
  
  const plansContent = await activePlansTable.innerHTML();
  const wo003Index = plansContent.indexOf('WO-202401-003');
  const wo002Index = plansContent.indexOf('WO-202401-002');
  
  expect(wo003Index).toBeGreaterThan(-1);
  expect(wo002Index).toBeGreaterThan(-1);
  expect(wo003Index).toBeLessThan(wo002Index);

  // Step 6: 改善指示配信ボタンを視認
  const deliverySendButton = page.locator('[data-testid="delivery-send-button"]');
  await expect(deliverySendButton).toBeVisible();

  // Step 7: 改善指示配信ボタンを押下
  const clickTime = Date.now();
  await deliverySendButton.click();

  // Step 8: ボタン押下後、画面の再読み込みまたはポップアップ表示を待つ（最大 5 秒）
  // 期待結果1: 改善指示配信ボタンが一時的にディセーブル状態になり、その直後に「配信中...」というステータスメッセージが表示される
  await expect(deliverySendButton).toBeDisabled({ timeout: 5000 });
  
  const sendingStatus = page.locator('text=配信中...');
  await expect(sendingStatus).toBeVisible({ timeout: 5000 });
  
  const sendingStatusDisplayTime = Date.now();
  const timeSinceSendingStatus = sendingStatusDisplayTime - clickTime;
  expect(timeSinceSendingStatus).toBeLessThan(5000);

  // 期待結果2: 配信完了後、成功メッセージが表示される
  await expect(sendingStatus).toBeHidden({ timeout: 5000 });
  
  const successMessage = page.locator('text=/改善指示を配信しました。配信ID: NTF-\\d{8}-\\d{3}/');
  await expect(successMessage).toBeVisible({ timeout: 5000 });

  // 期待結果3: 配信対象の改善指示内容が確定状態として表示される
  const deliveryHistoryTable = page.locator('[id="delivery-history-tbody"]');
  await expect(deliveryHistoryTable).toBeVisible({ timeout: 5000 });

  const historyText = await deliveryHistoryTable.textContent();
  expect(historyText).toContain('確定済み');

  const historyContent = await deliveryHistoryTable.innerHTML();
  const timestampPattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/;
  expect(timestampPattern.test(historyContent)).toBe(true);

  // 期待結果4: ダッシュボード画面に、最新の再集約済みデータが表示される状態で遷移が成立する
  await expect(siteVarianceTable).toBeVisible({ timeout: 5000 });
  await expect(riskAssessmentTable).toBeVisible({ timeout: 5000 });
  await expect(recommendedActions).toBeVisible({ timeout: 5000 });

  const siteVarianceAfterText = await siteVarianceTable.textContent();
  const riskAssessmentAfterText = await riskAssessmentTable.textContent();
  const recommendedActionsAfterText = await recommendedActions.textContent();

  expect(siteVarianceAfterText).toBeTruthy();
  expect(siteVarianceAfterText).toContain('75');
  
  expect(riskAssessmentAfterText).toBeTruthy();
  expect(riskAssessmentAfterText).toContain('65');
  
  expect(recommendedActionsAfterText).toBeTruthy();
  expect(recommendedActionsAfterText).toContain('拠点A');
});