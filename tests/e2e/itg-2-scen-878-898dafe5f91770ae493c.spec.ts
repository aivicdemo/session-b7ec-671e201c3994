import { test, expect } from '@playwright/test';

test('SCEN-878: 納期までの残り時間が負の値の場合、エラーメッセージが表示される', async ({ page }) => {
  // 実績データ記録入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  await page.waitForLoadState('networkidle');

  // 納期日時を過去の日時に設定（現在時刻より前）
  const pastDateTime = new Date();
  pastDateTime.setHours(pastDateTime.getHours() - 1);
  const pastDateTimeString = pastDateTime.toISOString().slice(0, 16);

  // 納期日時フィールドを特定して入力
  const dueDateTime = page.locator('input[type="datetime-local"]').first();
  await dueDateTime.fill(pastDateTimeString);

  // 進捗率 50% を入力
  const progressInput = page.locator('input[placeholder*="進捗率"], input[name*="progress"], input[aria-label*="進捗"]').first();
  await progressInput.fill('50');

  // 保存ボタンをクリック
  await page.locator('button:has-text("保存")').click();

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=既に納期を超過しています。緊急対応が必要です');
  await expect(errorMessage).toBeVisible();

  // エラーメッセージが赤色であることを確認
  const colorValue = await errorMessage.evaluate(el => window.getComputedStyle(el).color);
  const rgbMatch = colorValue.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  expect(rgbMatch).toBeTruthy();
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    const redValue = parseInt(r);
    const greenValue = parseInt(g);
    const blueValue = parseInt(b);
    // 赤色：R値が高く、G値とB値が低い
    expect(redValue).toBeGreaterThan(greenValue);
    expect(redValue).toBeGreaterThan(blueValue);
  }

  // 作業データが保存されていないことを確認
  // ページをリロードしてデータが保存されなかったことを確認
  await page.reload();
  await page.waitForLoadState('networkidle');

  const reloadedProgress = page.locator('input[placeholder*="進捗率"], input[name*="progress"], input[aria-label*="進捗"]').first();
  const reloadedProgressValue = await reloadedProgress.inputValue();
  expect(reloadedProgressValue).not.toBe('50');
});