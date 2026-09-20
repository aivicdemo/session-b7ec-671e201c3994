import { test, expect } from '@playwright/test';

test('SCEN-1501: 指定された作業指示IDがデータベースに存在しないと、送信は中止される', async ({ page }) => {
  // 作業指示・実績管理画面を開く
  await page.goto('/panels/scr-1789461813941.html');
  await page.waitForLoadState('networkidle');

  // 作業実績データ送信機能にアクセスする
  // 作業指示一覧から作業指示を選択（存在しない指示IDで実績入力を試みる）
  const performanceFormSection = page.locator('#performance-form-section');
  await expect(performanceFormSection).toBeVisible();

  // 存在しない作業指示ID（例：「INST-999999」）を入力フィールドに入力する
  const workInstructionIdInput = page.locator('#perf-work-instruction-id');
  await workInstructionIdInput.fill('INST-999999');

  // 作業者ID を入力
  const workerIdInput = page.locator('input[name="worker-id"]');
  if (await workerIdInput.isVisible()) {
    await workerIdInput.fill('WORKER-001');
  }

  // 実績数を入力
  const quantityInput = page.locator('#perf-quantity');
  await quantityInput.fill('10');

  // 不良数を入力
  const defectsInput = page.locator('#perf-defects');
  await defectsInput.fill('0');

  // 終了日時を入力
  const endDatetimeInput = page.locator('#perf-end-datetime');
  await endDatetimeInput.fill('2024-01-15T15:30:00');

  // ステータスを選択
  const statusSelect = page.locator('#perf-status');
  await statusSelect.selectOption('completed');

  // 備考（作業内容）を入力
  const notesInput = page.locator('#perf-notes');
  await notesInput.fill('テスト作業内容');

  // 送信ボタンをクリックする
  const submitButton = page.locator('#perf-submit-btn');
  await submitButton.click();

  // 送信処理の結果を画面で確認する
  // エラーメッセージが表示されることを確認
  const errorBanner = page.locator('#error-banner');
  await expect(errorBanner).toBeVisible();

  const errorMessage = page.locator('#error-message');
  await expect(errorMessage).toContainText("指定された作業指示ID『INST-999999』はデータベースに存在しません。送信処理は中止されました。");

  // 作業指示一覧にデータが追加されていないことを確認
  const workInstructionList = page.locator('#work-instruction-tbody');
  
  // INST-999999 の行が存在しないことを確認
  const instRow = workInstructionList.locator('tr:has-text("INST-999999")');
  await expect(instRow).not.toBeVisible();
});