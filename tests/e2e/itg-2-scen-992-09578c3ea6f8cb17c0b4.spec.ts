import { test, expect } from '@playwright/test';

test('SCEN-992: 境界系：所要時間が1ミリ秒で送信されても、入力データ検証に合格して記録される', async ({ page }) => {
  // 作業実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  await page.waitForLoadState('networkidle');

  // 必須フィールドにテストデータを入力
  // 作業タイプを入力
  const workTypeInput = page.locator('input[name="workType"]');
  await workTypeInput.fill('テスト作業');

  // 部門を入力
  const departmentInput = page.locator('input[name="department"]');
  await departmentInput.fill('テスト部門');

  // 作業者IDを入力
  const workerIdInput = page.locator('input[name="workerId"]');
  await workerIdInput.fill('WORKER001');

  // 所要時間フィールドに「1」ミリ秒を入力
  const timeRequiredInput = page.locator('input[name="timeRequired"]');
  await timeRequiredInput.fill('1');

  // 保存ボタンをクリック
  const saveButton = page.locator('button:has-text("保存")');
  await saveButton.click();

  // 保存処理の完了を待つ
  await page.waitForLoadState('networkidle');

  // 保存後、生産性ダッシュボード・分析画面に遷移する
  await page.goto('/panels/scr-1789461964046.html');
  await page.waitForLoadState('networkidle');

  // 入力したデータが表示されているか確認
  // 作業者IDで検索/フィルタ
  const workerFilter = page.locator('input[placeholder*="作業者"]');
  await workerFilter.fill('WORKER001');

  // テーブルに該当レコードが表示されていることを確認
  const recordRow = page.locator('table tbody tr', {
    has: page.locator('td:has-text("WORKER001")')
  });
  
  await expect(recordRow).toBeVisible();

  // テーブルヘッダーから所要時間列のインデックスを取得
  const headers = page.locator('table thead th');
  let timeRequiredColumnIndex = -1;
  const headerCount = await headers.count();
  
  for (let i = 0; i < headerCount; i++) {
    const headerText = await headers.nth(i).textContent();
    if (headerText && headerText.includes('所要時間')) {
      timeRequiredColumnIndex = i;
      break;
    }
  }

  // 該当行の所要時間列のセルを取得して「1」であることを確認
  if (timeRequiredColumnIndex >= 0) {
    const timeCellInRow = recordRow.locator('td').nth(timeRequiredColumnIndex);
    await expect(timeCellInRow).toHaveText('1');
  }

  // 作業タイプが記録されていることを確認
  await expect(recordRow.locator('td:has-text("テスト作業")')).toBeVisible();

  // 部門が記録されていることを確認
  await expect(recordRow.locator('td:has-text("テスト部門")')).toBeVisible();
});