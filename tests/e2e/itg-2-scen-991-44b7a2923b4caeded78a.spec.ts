import { test, expect } from '@playwright/test';

test('SCEN-991: 完了数量が1で送信されても、入力データ検証に合格して記録される', async ({ page }) => {
  // ログイン画面からスタート
  await page.goto('/');
  
  // ログイン処理
  await page.fill('input[name="userId"]', 'testuser');
  await page.fill('input[name="password"]', 'testpass');
  await page.click('button[type="submit"]');
  
  // ログイン後の自動遷移を待機
  await page.waitForNavigation();

  // 作業実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  await page.waitForLoadState('networkidle');

  // 作業者情報を入力する
  const workerId = `worker-${Date.now()}`;
  await page.fill('input[data-field="workerId"]', workerId);
  await page.fill('input[data-field="department"]', 'テスト部門');
  
  // 作業タイプを選択する
  await page.click('select[data-field="workType"]');
  await page.selectOption('select[data-field="workType"]', { label: /作業タイプ/ });

  // 完了数量フィールドに「1」と入力する
  await page.fill('input[data-field="completionQuantity"]', '1');

  // その他の必須フィールドを正常な値で入力する
  const now = new Date();
  const startTime = now.toTimeString().slice(0, 5);
  const endTime = new Date(now.getTime() + 60 * 60000).toTimeString().slice(0, 5);
  
  await page.fill('input[data-field="startTime"]', startTime);
  await page.fill('input[data-field="endTime"]', endTime);
  await page.fill('input[data-field="workDate"]', now.toISOString().split('T')[0]);

  // 送信ボタンをクリックする
  await page.click('button[data-action="submit"]');

  // システムが入力値を検証処理に送付し、検証が完了するまで待機
  await page.waitForSelector('[data-message="validationSuccess"], [role="alert"]', { timeout: 10000 });

  // 入力データ検証に合格した旨を示すメッセージが画面に表示される
  const successMessage = page.locator('[data-message="validationSuccess"], [role="alert"]:has-text("検証")');
  await expect(successMessage).toBeVisible();

  // 作業実績データベースに新規レコードとして記録されたことを確認
  const apiUrl = await page.evaluate(() => window.AIVIC_API_URL);
  const appId = await page.evaluate(() => window.AIVIC_APP_ID);
  const tables = await page.evaluate(() => window.AIVIC_TABLES);
  
  const workRecordTableId = tables.find((t: any) => t.tableName === 'workRecords')?.id || tables.find((t: any) => t.tableName.includes('work'))?.id;
  
  const recordsResponse = await page.request.get(
    `${apiUrl}/api/${workRecordTableId}?app=${appId}`,
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const recordsData = await recordsResponse.json();
  const newRecord = recordsData.data?.find((record: any) => 
    record.workerId === workerId && 
    record.completionQuantity === 1 &&
    record.workDate === now.toISOString().split('T')[0]
  );
  
  expect(newRecord).toBeDefined();
  expect(newRecord?.completionQuantity).toBe(1);

  // 生産性ダッシュボード・分析画面において、当該作業者の該当日付の実績が追跡可能か確認
  await page.goto('/panels/scr-1789461964046.html');
  await page.waitForLoadState('networkidle');

  // 作業者IDでフィルター/検索
  const searchInput = page.locator('input[data-field="searchWorkerId"], [placeholder*="作業者"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill(workerId);
    await page.waitForTimeout(500);
  }

  // 当該日付の実績が表示されていることを確認
  const resultRow = page.locator(`[data-worker-id="${workerId}"]`).first();
  await expect(resultRow).toBeVisible();

  // 完了数量が1として記録されていることを確認
  const completionCell = resultRow.locator('[data-field="completionQuantity"]');
  await expect(completionCell).toContainText('1');
});