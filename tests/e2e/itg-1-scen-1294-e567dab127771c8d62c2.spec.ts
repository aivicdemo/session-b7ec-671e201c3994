import { test, expect } from '@playwright/test';

test('SCEN-1294: 計画完了時刻が現在時刻より前のとき、計画完了時刻が過去である旨のエラーメッセージが表示される', async ({ page }) => {
  // 進捗・人員配置ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');

  // リスク分析結果確認セクションにアクセスする
  // 参考情報から risk-assessment-table がリスク分析結果確認に対応
  const riskAssessmentTable = page.locator('[data-testid="risk-assessment-table"]');
  await riskAssessmentTable.scrollIntoViewIfNeeded();

  // 計画完了時刻の入力フィールドをクリックする
  // リスク評価テーブル内から計画完了時刻（planned-completion）に対応する入力フィールドを探す
  const plannedCompletionInput = page.locator('#planned-completion').first();
  await plannedCompletionInput.click();

  // 現在時刻を取得
  const now = new Date();

  // 過去の時刻を設定（現在時刻より2時間30分前）
  const pastDate = new Date(now.getTime() - 2.5 * 60 * 60 * 1000);
  const pastYear = pastDate.getFullYear();
  const pastMonth = String(pastDate.getMonth() + 1).padStart(2, '0');
  const pastDay = String(pastDate.getDate()).padStart(2, '0');
  const pastHour = String(pastDate.getHours()).padStart(2, '0');
  const pastMinute = String(pastDate.getMinutes()).padStart(2, '0');
  const dateTimeString = `${pastYear}-${pastMonth}-${pastDay}T${pastHour}:${pastMinute}`;

  // 計画完了時刻に現在時刻より前の日時を入力する
  await plannedCompletionInput.fill(dateTimeString);

  // 入力値を確定する（Enterキー押下）
  await plannedCompletionInput.press('Enter');

  // フォーカスを外す
  await page.keyboard.press('Tab');

  // リスク分析を実行するボタンをクリックする
  // 参考情報から confirm-results-button がリスク分析実行に対応
  const executeButton = page.locator('[data-testid="confirm-results-button"]');
  await executeButton.click();

  // エラーメッセージが表示されるまで待機
  const errorMessage = page.locator(
    'text=/計画完了時刻が現在時刻より前です。過去の時刻を指定することはできません|計画完了時刻が現在時刻より前|過去の時刻を指定することはできません/'
  );

  // エラーメッセージが表示されることを確認
  await expect(errorMessage).toBeVisible({ timeout: 5000 });

  // エラーメッセージが入力フィールド下部または画面上部に表示されていることを確認
  const errorElement = errorMessage.first();
  const errorBoundingBox = await errorElement.boundingBox();
  const inputBoundingBox = await plannedCompletionInput.boundingBox();
  
  // エラーメッセージが入力フィールド下部に表示されているか、または画面上部に表示されているかを確認
  let isPositionValid = false;
  
  if (errorBoundingBox && inputBoundingBox) {
    // 入力フィールド下部：エラーメッセージのy座標が入力フィールドより下にある
    const isBelow = errorBoundingBox.y > inputBoundingBox.y + inputBoundingBox.height;
    // 画面上部：エラーメッセージのy座標がviewportの上の方
    const isTopArea = errorBoundingBox.y < 200;
    isPositionValid = isBelow || isTopArea;
  }

  expect(isPositionValid).toBe(true);

  // エラーメッセージが赤色で表示されていることを確認
  const computedColor = await errorElement.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return style.color;
  });

  // RGB値を抽出して赤色を検証（赤成分が緑・青成分より有意に大きいこと）
  const rgbMatch = computedColor.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    const red = parseInt(rgbMatch[1], 10);
    const green = parseInt(rgbMatch[2], 10);
    const blue = parseInt(rgbMatch[3], 10);
    
    // 赤色：赤成分が緑・青成分より有意に大きい
    const isRed = red > green + 50 && red > blue + 50;
    expect(isRed).toBe(true);
  }

  // 画面遷移が発生していないことを確認
  expect(page.url()).toContain('/panels/scr-1789461783315.html');

  // リスク分析の実行処理が中断されたことを確認
  // ボタンがまだ表示されており、画面遷移や処理完了状態ではないことを確認
  await expect(executeButton).toBeVisible();
  
  // エラーメッセージが表示されているため、処理が中断された状態であることを確認
  const errorIsStillVisible = await errorMessage.isVisible();
  expect(errorIsStillVisible).toBe(true);
});