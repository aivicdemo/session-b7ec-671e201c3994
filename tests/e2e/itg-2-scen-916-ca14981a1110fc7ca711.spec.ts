import { test, expect, Page } from '@playwright/test';

test('SCEN-916: 配置案却下 - 必須項目がすべて入力されているとき、入力値検証が成功し、次の配置計画取得へ進む', async ({ page }) => {
  // ログイン処理
  await page.goto('/');
  await page.waitForURL('**/panels/**');
  
  // 最適人員配置案提案・実行画面を開く
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');

  // 配置案却下操作を開始する
  const rejectButton = page.locator('button:has-text("却下"), button:has-text("配置案を却下")');
  await rejectButton.click();
  
  // 却下フォームが表示されるまで待機
  await page.waitForSelector('form, [role="dialog"]', { timeout: 5000 });

  // 配置計画IDフィールドに有効な配置計画IDを入力する
  const planIdInput = page.locator('input[name="planId"], input[placeholder*="配置計画"], input[placeholder*="PLAN"]').first();
  await planIdInput.fill('PLAN-20240115-001');

  // 却下理由ドロップダウンを開き、リストから1つの理由を選択する
  const reasonDropdown = page.locator('select[name="reason"], [role="combobox"][name*="reason"]').first();
  await reasonDropdown.click();
  const reasonOption = page.locator('text="生産性データ不足"');
  await reasonOption.click();

  // 却下理由詳細テキストフィールドに具体的な詳細内容を入力する
  const detailInput = page.locator('textarea[name="detail"], textarea[placeholder*="詳細"], input[name="detail"]').first();
  await detailInput.fill('対象作業者の過去実績データが不足しているため、信頼性のある配置案生成ができません');

  // 入力値検証を実行するボタン（「次へ進む」など）をクリックする
  const submitButton = page.locator('button:has-text("次へ進む"), button:has-text("確認"), button[type="submit"]').first();
  await submitButton.click();

  // 入力値検証が完了し、エラーメッセージが表示されないことを確認
  const errorMessage = page.locator('[role="alert"], .error, .error-message, [class*="error"]');
  await expect(errorMessage).not.toBeVisible();

  // 却下フォームが非表示になったことを確認（次の配置計画取得処理へ進んだ証拠）
  const rejectForm = page.locator('form:has-text("却下"), [role="dialog"]:has-text("却下")').first();
  await expect(rejectForm).not.toBeVisible();

  // 新たな配置計画候補が画面に表示される状態になったことを確認
  // 最適人員配置案提案・実行画面の主要コンテンツが表示される
  const planContent = page.locator('[class*="plan"], [class*="candidate"], table, [role="grid"]').first();
  await expect(planContent).toBeVisible();
});