import { test, expect } from '@playwright/test';

test('SCEN-988: 正常系：実績データ保存完了後、リアルタイム進捗監視・生産性分析エンジンへのデータ更新通知が送信される', async ({ page }) => {
  // 作業実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  await page.waitForLoadState('networkidle');

  // 作業者ID、作業タイプ、部門、実績数量、作業時間などの必須項目を入力する
  await page.fill('input[name="workerId"]', 'WKR001');
  await page.fill('select[name="workType"]', 'assembly');
  await page.fill('select[name="department"]', 'dept001');
  await page.fill('input[name="quantity"]', '50');
  await page.fill('input[name="workTime"]', '480');

  // 入力内容を検証して保存ボタンをクリックする
  const saveButton = page.locator('button:has-text("保存")');
  await saveButton.click();

  // 保存完了メッセージが画面に表示されるまで待機する
  const successMessage = page.locator('text=保存完了');
  await expect(successMessage).toBeVisible({ timeout: 5000 });

  // 保存完了メッセージが表示されたことを確認する
  await expect(successMessage).toContainText('保存完了');

  // 生産性ダッシュボード・分析画面に遷移する
  await page.goto('/panels/scr-1789461964046.html');
  await page.waitForLoadState('networkidle');

  // ダッシュボード画面のリアルタイム進捗監視セクションに、直前に保存した作業実績データが表示されていることを確認する
  const realtimeSection = page.locator('[data-section="realtime-monitoring"]');
  await expect(realtimeSection).toBeVisible();

  // 作業者ID、実績数量、タイムスタンプなどが表示されていることを確認する
  const workerIdCell = realtimeSection.locator('text=WKR001');
  await expect(workerIdCell).toBeVisible();

  const quantityCell = realtimeSection.locator('text=50');
  await expect(quantityCell).toBeVisible();

  // タイムスタンプが表示されていることを確認する（現在の日付と時刻を含む行の存在確認）
  const timestamps = realtimeSection.locator('[data-field="timestamp"]');
  await expect(timestamps.first()).toBeVisible();
});