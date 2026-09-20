import { test, expect } from '@playwright/test';

test('実績データ記録入力画面で作業者ID・部門・作業タイプ・日付・時刻・数量・品質評価などの入力値が形式・範囲・必須項目の検証に合格すると、次の業務ロジック処理へ進む', async ({ page }) => {
  // 作業実績データ記録・入力画面にアクセスする
  await page.goto('/panels/scr-1789461993203.html');
  
  // ページが読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // 作業者ID入力欄に有効な形式の値（例：「WR00001」）を入力する
  await page.fill('input[name="workerId"]', 'WR00001');

  // 部門ドロップダウンから「物流センターA」を選択する
  await page.selectOption('select[name="department"]', '物流センターA');

  // 作業タイプドロップダウンから「ピッキング」を選択する
  await page.selectOption('select[name="workType"]', 'ピッキング');

  // 日付入力欄に本日の日付を「YYYY-MM-DD」形式で入力する
  const today = new Date().toISOString().split('T')[0];
  await page.fill('input[name="date"]', today);

  // 時刻入力欄に「09:30」を入力する
  await page.fill('input[name="time"]', '09:30');

  // 数量入力欄に「150」を入力する
  await page.fill('input[name="quantity"]', '150');

  // 品質評価ドロップダウンから「良好」を選択する
  await page.selectOption('select[name="qualityRating"]', '良好');

  // すべての必須項目が入力された状態で「次へ進む」ボタンをクリックする
  await page.click('button:has-text("次へ進む")');

  // 入力画面から業務ロジック処理画面への画面遷移が成立することを確認
  // 次のページに遷移したことを確認
  await page.waitForNavigation();
  
  // エラーメッセージが表示されていないことを確認
  const errorMessages = await page.locator('[class*="error"]').count();
  expect(errorMessages).toBe(0);

  // ユーザーが次の処理ステップの画面に遷移していることを確認
  // 現在のURLが変更されたことを確認
  const currentUrl = page.url();
  expect(currentUrl).not.toContain('scr-1789461993203');
});