import { test, expect } from '@playwright/test';

test('SCEN-1227: 目標時間帯の開始時刻が終了時刻より後の場合、エラーメッセージが表示される', async ({ page }) => {
  // 人員配置最適化提案・実行画面にアクセス
  await page.goto('/panels/scr-1789461798629.html');

  // 画面が正常に読み込まれたことを確認
  await expect(page).toHaveTitle(/人員配置最適化提案/);
  await expect(page.locator('[data-testid="generate-proposals-btn"]')).toBeVisible();

  // 目標時間帯の入力フィールドセクションを確認
  const startTimeInput = page.locator('input[name="targetStartTime"], input[id*="start"][id*="time"], input[placeholder*="開始"]').first();
  const endTimeInput = page.locator('input[name="targetEndTime"], input[id*="end"][id*="time"], input[placeholder*="終了"]').first();

  // 開始時刻と終了時刻の入力欄が存在することを確認
  await expect(startTimeInput).toBeVisible();
  await expect(endTimeInput).toBeVisible();

  // 開始時刻に「14:30」を入力
  await startTimeInput.fill('14:30');

  // 終了時刻に「14:00」を入力（開始時刻より前の時刻）
  await endTimeInput.fill('14:00');

  // 「提案を生成」ボタンをクリック
  await page.locator('[data-testid="generate-proposals-btn"]').click();

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=目標時間帯の開始時刻は終了時刻より前の時刻を指定してください');
  await expect(errorMessage).toBeVisible();

  // 開始時刻入力欄が視覚的に指摘されていることを確認（赤色の警告枠またはハイライト表示）
  const startTimeContainer = startTimeInput.locator('xpath=ancestor::*[contains(@class, "form-group") or contains(@class, "input-group") or contains(@class, "field")]').first();
  
  // 赤色のハイライトまたはエラー表示を確認
  const hasVisualError = await startTimeContainer.evaluate((el) => {
    const inputEl = el.querySelector('input');
    const computedStyle = window.getComputedStyle(inputEl || el);
    const borderColor = computedStyle.borderColor;
    const hasErrorClass = el.className.includes('error') || el.className.includes('invalid');
    const isRedBorder = borderColor.includes('220') || borderColor.includes('255, 0, 0') || borderColor.includes('red');
    return hasErrorClass || isRedBorder;
  });

  expect(hasVisualError).toBeTruthy();

  // 提案を生成ボタンが無効化されているか、または処理が実行されていないことを確認
  const generateButton = page.locator('[data-testid="generate-proposals-btn"]');
  
  // ボタンが無効化されているかチェック
  const isDisabled = await generateButton.isDisabled();
  const hasDisabledAttribute = await generateButton.evaluate((el) => {
    return el.hasAttribute('disabled');
  });
  
  const buttonIsDisabled = isDisabled || hasDisabledAttribute;
  
  // ボタンが有効な場合、処理が実行されていないことを確認する
  if (!buttonIsDisabled) {
    // プロポーザルコンテナが更新されていないことを確認
    const proposalContainer = page.locator('#proposals-container, [class*="proposal"]');
    const proposalCount = await proposalContainer.count();
    // 処理が実行されていない場合、提案が生成されていない
    expect(proposalCount).toBe(0);
  } else {
    // ボタンが無効化されていることを確認
    expect(buttonIsDisabled).toBeTruthy();
  }

  // 画面が人員配置最適化提案・実行画面に留まっていることを確認
  await expect(page).toHaveURL(/scr-1789461798629/);
});