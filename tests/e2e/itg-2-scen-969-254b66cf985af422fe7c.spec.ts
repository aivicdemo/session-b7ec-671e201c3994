import { test, expect } from '@playwright/test';

test('SCEN-969: 検証済みの実績データが保存されると、作業者の過去実績記録が対象期間で検索可能になる', async ({ page }) => {
  // ログイン処理
  await page.goto('/');
  await page.waitForURL('**/panels/**');
  
  // 作業実績データ記録・入力画面にアクセス
  await test.step('作業実績データ記録・入力画面にアクセスする', async () => {
    await page.goto('/panels/scr-1789461993203.html');
    await page.waitForLoadState('networkidle');
  });

  // テストデータの準備
  const testData = {
    workerId: 'WKR001',
    workDate: '2024-01-15',
    workType: '組立',
    quantity: '50',
    workHours: '8'
  };

  // 実績データを入力フォームに記入
  await test.step('作業者ID、作業日付、作業タイプ、処理数量、作業時間などの実績データを入力フォームに記入する', async () => {
    await page.fill('input[name="workerId"]', testData.workerId);
    await page.fill('input[name="workDate"]', testData.workDate);
    await page.fill('select[name="workType"]', testData.workType);
    await page.fill('input[name="quantity"]', testData.quantity);
    await page.fill('input[name="workHours"]', testData.workHours);
  });

  // 画面の検証機能を実行
  await test.step('入力したデータに対して画面の検証機能を実行し、すべての必須項目が入力されていることを確認する', async () => {
    const validateButton = page.locator('button:has-text("検証")');
    await validateButton.click();
    
    // 検証エラーが表示されないことを確認
    const errorMessages = page.locator('[class*="error"]');
    await expect(errorMessages).toHaveCount(0);
  });

  // 保存ボタンをクリック
  await test.step('保存ボタンをクリックして、実績データをシステムに送信する', async () => {
    const saveButton = page.locator('button:has-text("保存")');
    await saveButton.click();
  });

  // 保存完了メッセージの確認
  await test.step('保存完了のメッセージまたは確認画面が表示されることを確認する', async () => {
    const successMessage = page.locator('text=保存完了');
    await expect(successMessage).toBeVisible();
    await page.waitForTimeout(1000);
  });

  // 生産性ダッシュボード・分析画面に遷移
  await test.step('生産性ダッシュボード・分析画面に遷移する', async () => {
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');
  });

  // 対象期間を指定
  await test.step('対象期間を指定するための日付範囲フィルター（開始日と終了日）を設定する', async () => {
    const startDateInput = page.locator('input[name="startDate"]');
    const endDateInput = page.locator('input[name="endDate"]');
    
    await startDateInput.fill('2024-01-01');
    await endDateInput.fill('2024-01-31');
  });

  // 検索ボタンをクリック
  await test.step('同じ作業者IDで先ほど保存した実績データの日付を含む期間を指定して、検索またはフィルター適用ボタンをクリックして、指定期間のデータを検索する', async () => {
    const searchButton = page.locator('button:has-text("検索")');
    await searchButton.click();
    await page.waitForLoadState('networkidle');
  });

  // 検索結果の確認
  await test.step('生産性ダッシュボード・分析画面の検索結果として、先ほど作業実績データ記録・入力画面で保存した実績データが対象期間内の記録として画面上に表示され、入力時に記録した値と一致していることを確認する', async () => {
    // テーブル内の行を検索
    const tableRows = page.locator('table tbody tr');
    
    // 作業者IDで該当行を検索
    const targetRow = tableRows.filter({
      has: page.locator(`text="${testData.workerId}"`)
    }).first();
    
    await expect(targetRow).toBeVisible();
    
    // 各カラムの値が一致することを確認
    const cells = targetRow.locator('td');
    const rowText = await cells.allTextContents();
    
    // 作業者ID、作業日付、作業タイプ、処理数量、作業時間が表示されていることを確認
    expect(rowText.join()).toContain(testData.workerId);
    expect(rowText.join()).toContain(testData.workDate);
    expect(rowText.join()).toContain(testData.workType);
    expect(rowText.join()).toContain(testData.quantity);
    expect(rowText.join()).toContain(testData.workHours);
  });
});