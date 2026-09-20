import { test, expect } from '@playwright/test';

test('SCEN-983: エラー系：品質スコアが値域外（0.0～1.0）で送信されると、入力データ検証段階で拒否される', async ({ page }) => {
  // 作業実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  
  // 画面が読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // API呼び出しの監視を開始
  let apiCallDetected = false;
  page.on('response', (response) => {
    if (response.url().includes('/api/') && response.request().method() === 'POST') {
      apiCallDetected = true;
    }
  });

  // 作業者の実績データを入力
  // その他の必須フィールドがある場合は入力
  const workerIdInput = page.locator('input[name="workerId"]');
  if (await workerIdInput.isVisible()) {
    await workerIdInput.fill('WORKER001');
  }
  
  const taskInput = page.locator('input[name="task"]');
  if (await taskInput.isVisible()) {
    await taskInput.fill('テスト作業');
  }

  // 品質スコアフィールドに値域外の値（1.5）を入力
  await page.fill('input[name="qualityScore"]', '1.5');
  
  // 保存ボタンをクリック
  const saveButton = page.locator('button:has-text("保存")');
  await saveButton.click();

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=品質スコアは0.0～1.0の範囲内で入力してください');
  await expect(errorMessage).toBeVisible();

  // 品質スコアフィールドがハイライト表示されていることを確認
  const qualityScoreField = page.locator('input[name="qualityScore"]');
  const fieldContainer = qualityScoreField.locator('..');
  const hasErrorClass = await fieldContainer.evaluate((el) => {
    return el.classList.contains('error') || 
           el.classList.contains('error-field') ||
           el.classList.contains('is-invalid') ||
           el.getAttribute('aria-invalid') === 'true' ||
           window.getComputedStyle(el).borderColor.includes('rgb(239, 68, 68)') ||
           window.getComputedStyle(el).borderColor.includes('red');
  });
  expect(hasErrorClass).toBeTruthy();

  // エラーメッセージが表示された後も、API呼び出しが発生していないことを確認
  expect(apiCallDetected).toBe(false);
});