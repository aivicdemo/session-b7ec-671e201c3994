import { test, expect } from '@playwright/test';

test('SCEN-1259: リスク判定実行操作が、ユーザーID・操作内容・実行時刻とともに監査ログに記録される', async ({ page }) => {
  const baseUrl = 'http://localhost:3000';
  const adminUserId = 'ADMIN001';
  const adminPassword = 'admin_password';

  // ステップ1: テスト用管理者ユーザーでログイン
  await page.goto(`${baseUrl}/`);
  await page.waitForLoadState('networkidle');
  
  // ログインフォーム入力
  await page.fill('input[name="userId"]', adminUserId);
  await page.fill('input[name="password"]', adminPassword);
  await page.click('button:has-text("ログイン")');
  await page.waitForLoadState('networkidle');

  // ステップ2: 進捗・人員配置ダッシュボード画面を開く
  await page.waitForURL('**/panels/scr-1789461783315.html');
  const dashboardPage = page.url();
  expect(dashboardPage).toContain('scr-1789461783315');

  // 監査ログAPIの初期状態を取得
  const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
  const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
  
  // 監査ログテーブルを取得
  const tables = await page.evaluate(() => (window as any).AIVIC_TABLES);
  const auditLogTableNumber = tables.find((t: any) => t.tableName === 'audit_logs')?.tableNumber;

  expect(auditLogTableNumber).toBeDefined();

  // 操作前の監査ログ件数を取得
  const beforeResponse = await page.request.get(
    `${apiUrl}/api/${auditLogTableNumber}?app=${appId}&filter=userId:${adminUserId}&sort=-createdAt&limit=100`
  );
  const beforeData = await beforeResponse.json();
  const beforeCount = beforeData.records?.length || 0;

  // ステップ3: 操作実行時刻を記録
  const operationTimeBefore = new Date();

  // 「リスク判定を実行」ボタンをクリック
  await page.click('button:has-text("リスク判定を実行")');
  
  // ステップ4: リスク分析の実行完了を示す画面表示まで待機
  await page.waitForSelector('text=/進捗遅延リスク判定が完了|リスク分析完了/', { timeout: 30000 });

  // 操作実行後の時刻を記録
  const operationTimeAfter = new Date();

  // ステップ5, 6: 監査ログの取得と検証
  // 操作後の監査ログを取得
  const afterResponse = await page.request.get(
    `${apiUrl}/api/${auditLogTableNumber}?app=${appId}&filter=userId:${adminUserId}&sort=-createdAt&limit=100`
  );
  
  const afterData = await afterResponse.json();
  expect(afterResponse.ok()).toBeTruthy();

  const afterCount = afterData.records?.length || 0;

  // 1件のみ新たに追加されたことを確認
  expect(afterCount).toBe(beforeCount + 1);

  // 最新の監査ログレコードを確認
  const auditLog = afterData.records?.[0];
  expect(auditLog).toBeDefined();

  // 期待値の検証
  expect(auditLog.userId).toBe('ADMIN001');
  expect(auditLog.operationType).toBe('RISK_ANALYSIS_EXECUTE');

  // 操作実行時刻が操作時刻の±5秒以内であることを検証
  const recordedTime = new Date(auditLog.executedAt);
  
  // operationTimeBefore基準の検証
  const timeDiffMsBefore = Math.abs(recordedTime.getTime() - operationTimeBefore.getTime());
  const timeDiffSecondsBefore = timeDiffMsBefore / 1000;
  
  // operationTimeAfter基準の検証
  const timeDiffMsAfter = Math.abs(recordedTime.getTime() - operationTimeAfter.getTime());
  const timeDiffSecondsAfter = timeDiffMsAfter / 1000;
  
  // 記録時刻が操作前後の時刻範囲内にあり、かつ±5秒以内であることを確認
  expect(timeDiffSecondsBefore).toBeLessThanOrEqual(5);
  expect(timeDiffSecondsAfter).toBeLessThanOrEqual(5);
  expect(recordedTime.getTime()).toBeGreaterThanOrEqual(operationTimeBefore.getTime());
  expect(recordedTime.getTime()).toBeLessThanOrEqual(operationTimeAfter.getTime() + 5000);
});