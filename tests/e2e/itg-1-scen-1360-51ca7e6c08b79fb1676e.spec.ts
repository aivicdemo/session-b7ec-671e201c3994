import { test, expect } from '@playwright/test';

test('SCEN-1360: 目標時間帯の開始時刻が終了時刻より後のとき、エラーメッセージが表示される', async ({ page }) => {
  // 人員配置最適化提案・実行画面を開く
  await page.goto('/panels/scr-1789461798629.html');

  // 人員配置案を自動生成するための入力フォームを表示
  const generateButton = page.getByRole('button', { name: '人員配置案を自動生成' });
  await generateButton.click();

  // 「目標時間帯」の設定セクションを探す
  const startTimeInput = page.getByLabel('開始時刻');
  const endTimeInput = page.getByLabel('終了時刻');

  // 開始時刻に「14:00」を入力
  await startTimeInput.fill('14:00');

  // 終了時刻に「12:00」を入力（開始時刻より前の時刻）
  await endTimeInput.fill('12:00');

  // 生成ボタンをクリック
  await generateButton.click();

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=時間帯の開始時刻は終了時刻より前に設定してください');
  await expect(errorMessage).toBeVisible();

  // フォーム入力状態が保持されていることを確認
  await expect(startTimeInput).toHaveValue('14:00');
  await expect(endTimeInput).toHaveValue('12:00');
});