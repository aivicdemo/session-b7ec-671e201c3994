import { test, expect } from '@playwright/test';

test('SCEN-1121: 入力データが形式・値域・必須項目を満たさない場合、処理が中断される', async ({ page }) => {
  // ログイン画面にアクセス
  await page.goto('/');
  
  // ログイン処理（前提条件）
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // ログイン後の自動遷移を待つ
  await page.waitForURL('**/panels/**');
  
  // 最適人員配置案提案・実行画面を開く
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');
  
  // 配置案実行処理に必要な入力フォームの確認
  const workerIdInput = page.locator('input[name*="worker"], input[placeholder*="作業者"]');
  const departmentInput = page.locator('input[name*="department"], input[placeholder*="部門"], select[name*="department"]');
  const executionDateInput = page.locator('input[name*="date"], input[placeholder*="実行日"]');
  const executeButton = page.locator('button:has-text("実行"), button:has-text("配置"), button[type="submit"]');
  
  // 必須項目が存在することを確認
  await expect(workerIdInput).toBeVisible();
  await expect(departmentInput).toBeVisible();
  await expect(executionDateInput).toBeVisible();
  await expect(executeButton).toBeVisible();
  
  // データベースの初期状態を取得
  const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
  const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
  const tables = await page.evaluate(() => (window as any).AIVIC_TABLES);
  
  // 配置案記録テーブルと割当変更記録テーブルの初期件数を取得
  const placementRecordTableId = tables?.find((t: any) => t.tableName?.includes('配置案'))?.id || 'placement_records';
  const assignmentChangeTableId = tables?.find((t: any) => t.tableName?.includes('割当'))?.id || 'assignment_changes';
  
  const initialPlacementResponse = await page.evaluate(async (params) => {
    const response = await fetch(`${params.apiUrl}/api/${params.placementTableId}?app=${params.appId}`);
    return response.json();
  }, {
    apiUrl,
    appId,
    placementTableId: placementRecordTableId
  });
  
  const initialAssignmentResponse = await page.evaluate(async (params) => {
    const response = await fetch(`${params.apiUrl}/api/${params.assignmentTableId}?app=${params.appId}`);
    return response.json();
  }, {
    apiUrl,
    appId,
    assignmentTableId: assignmentChangeTableId
  });
  
  const initialPlacementCount = Array.isArray(initialPlacementResponse) ? initialPlacementResponse.length : 0;
  const initialAssignmentCount = Array.isArray(initialAssignmentResponse) ? initialAssignmentResponse.length : 0;
  
  // 必須項目のいずれかを空白のまま、実行ボタンをクリック
  // 作業者IDのみ入力し、その他は空白にしたまま実行ボタンをクリック
  await workerIdInput.fill('W001');
  // departmentInputとexecutionDateInputは空白のまま
  
  await executeButton.click();
  
  // 入力エラーメッセージが表示されることを確認
  const errorMessage = page.locator('[role="alert"], .error-message, .validation-error, .form-error');
  await expect(errorMessage).toBeVisible();
  
  // エラーメッセージのテキストを確認（入力エラーに関連するテキスト）
  await expect(errorMessage).toContainText(/必須|入力|エラー|入力してください|選択してください/i);
  
  // 画面が最適人員配置案提案・実行画面に留まっていることを確認
  await expect(page).toHaveURL(/scr-1789461978707/);
  
  // 実行ボタンが依然として表示されていることを確認（処理が中断され、画面に留まっている）
  await expect(executeButton).toBeVisible();
  
  // データベースへの記録が行われていないことを確認
  // 配置案記録テーブルに新しいレコードが追加されていないことを確認
  const finalPlacementResponse = await page.evaluate(async (params) => {
    const response = await fetch(`${params.apiUrl}/api/${params.placementTableId}?app=${params.appId}`);
    return response.json();
  }, {
    apiUrl,
    appId,
    placementTableId: placementRecordTableId
  });
  
  const finalPlacementCount = Array.isArray(finalPlacementResponse) ? finalPlacementResponse.length : 0;
  expect(finalPlacementCount).toBe(initialPlacementCount);
  
  // 割当変更記録テーブルに新しいレコードが追加されていないことを確認
  const finalAssignmentResponse = await page.evaluate(async (params) => {
    const response = await fetch(`${params.apiUrl}/api/${params.assignmentTableId}?app=${params.appId}`);
    return response.json();
  }, {
    apiUrl,
    appId,
    assignmentTableId: assignmentChangeTableId
  });
  
  const finalAssignmentCount = Array.isArray(finalAssignmentResponse) ? finalAssignmentResponse.length : 0;
  expect(finalAssignmentCount).toBe(initialAssignmentCount);
});