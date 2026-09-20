import { test, expect } from '@playwright/test';

test('ユーザーによる人員配置案配信操作の全詳細が監査ログに記録される', async ({ page }) => {
  // テスト環境にログイン
  await page.goto('/');
  
  // ログイン画面が表示されている場合はログイン操作を実行
  const loginCard = page.locator('.login-card');
  if (await loginCard.isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.fill('input[placeholder*="ユーザーID"]', 'testuser');
    await page.fill('input[placeholder*="パスワード"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/panels/scr-1789461783315.html', { timeout: 10000 });
  } else {
    // ログイン済みの場合は自動遷移を待つ
    await page.waitForURL('**/panels/scr-1789461783315.html', { timeout: 10000 });
  }

  // 監査ログシステムが正常に動作していることを確認
  const tableInfo = await page.evaluate(() => {
    const tableNo = (window as any).AIVIC_TABLES?.find((t: any) => t.tableName === 'audit_logs')?.tableNo;
    const appId = (window as any).AIVIC_APP_ID;
    return { tableNo, appId };
  });

  const { tableNo: auditTableNo, appId } = tableInfo;
  expect(auditTableNo).toBeDefined();
  expect(appId).toBeDefined();

  // 監査ログテーブルへのアクセスを確認
  const auditAccessResponse = await page.request.get(
    `/api/${auditTableNo}?app=${appId}&limit=1`
  );
  expect(auditAccessResponse.ok()).toBeTruthy();

  // 人員配置最適化提案・実行画面へ遷移
  await page.click('nav [id="scr-1789461798629"]');
  await page.waitForURL('**/panels/scr-1789461798629.html', { timeout: 10000 });

  // 現在の進捗・生産性データが画面に読み込まれ、複数の人員配置案が表示されることを確認
  const proposalsContainer = page.locator('#proposals-container');
  await expect(proposalsContainer).toBeVisible({ timeout: 10000 });
  
  const proposalCards = page.locator('[id="proposal-detail-container"]');
  const proposalCount = await proposalCards.count();
  expect(proposalCount).toBeGreaterThan(0);

  // 画面に表示された人員配置案から最初の配置案を選択
  const firstProposal = proposalCards.first();
  await firstProposal.click();

  // その配置案の詳細を確認
  const assignmentDetailTable = page.locator('#assignment-detail-tbody');
  await expect(assignmentDetailTable).toBeVisible({ timeout: 5000 });

  // 「配信」ボタンをクリック
  const distributeButton = page.locator('#distribute-btn');
  await distributeButton.click();

  // 配信モーダルが表示されることを確認
  const distributeModal = page.locator('#distribute-modal-overlay');
  await expect(distributeModal).toBeVisible({ timeout: 5000 });

  // 配信確認ボタンをクリック
  const distributeConfirmButton = page.locator('#distribute-modal-confirm');
  await distributeConfirmButton.click();

  // 配信完了メッセージを確認
  const successBanner = page.locator('#success-banner');
  await expect(successBanner).toBeVisible({ timeout: 10000 });
  const successMessage = page.locator('#success-message');
  const messageText = await successMessage.textContent();
  expect(messageText).toContain('配置案を配信しました');

  // 配信IDが含まれていることを確認
  expect(messageText).toMatch(/配信ID[:\s]*[\w\-]+/);

  // 監査ログデータベースに照会
  const auditResponse = await page.request.get(
    `/api/${auditTableNo}?app=${appId}&operationType=STAFFING_PLAN_DISTRIBUTION&sort=-operationTimestamp&limit=10`
  );
  
  expect(auditResponse.ok()).toBeTruthy();
  const auditLogs = await auditResponse.json();

  // 監査ログテーブルに新規レコードが1件以上作成されていることを確認
  expect(auditLogs.records).toBeDefined();
  expect(auditLogs.records.length).toBeGreaterThan(0);

  // 最新のレコードを取得
  const latestLog = auditLogs.records[0];

  // レコードが必須フィールドを全て含むことを確認
  expect(latestLog.userId).toBeDefined();
  expect(latestLog.operationType).toBe('STAFFING_PLAN_DISTRIBUTION');
  expect(latestLog.operationTimestamp).toBeDefined();
  expect(latestLog.staffingPlanId).toBeDefined();
  expect(latestLog.targetSiteId).toBeDefined();
  expect(latestLog.targetTeamId).toBeDefined();
  expect(latestLog.assignmentContent).toBeDefined();
  expect(latestLog.distributionId).toBeDefined();
  expect(latestLog.externalNotificationResult).toBeDefined();
  expect(latestLog.operationResultStatus).toBe('SUCCESS');

  // タイムスタンプがISO 8601形式であることを確認
  const isoTimestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[\+\-]\d{2}:\d{2}$/;
  expect(latestLog.operationTimestamp).toMatch(isoTimestampRegex);

  // 配置内容がJSON形式であることを確認
  let assignmentContentObj;
  if (typeof latestLog.assignmentContent === 'string') {
    assignmentContentObj = JSON.parse(latestLog.assignmentContent);
  } else {
    assignmentContentObj = latestLog.assignmentContent;
  }
  
  expect(Array.isArray(assignmentContentObj) || typeof assignmentContentObj === 'object').toBeTruthy();
  if (Array.isArray(assignmentContentObj)) {
    expect(assignmentContentObj.length).toBeGreaterThan(0);
    assignmentContentObj.forEach((item: any) => {
      expect(item.workerId).toBeDefined();
      expect(item.sourceSite).toBeDefined();
      expect(item.reasonCode).toBeDefined();
      expect(item.priority).toBeDefined();
    });
  }

  // 外部通知サービス呼び出し情報を確認
  let notificationResult;
  if (typeof latestLog.externalNotificationResult === 'string') {
    notificationResult = JSON.parse(latestLog.externalNotificationResult);
  } else {
    notificationResult = latestLog.externalNotificationResult;
  }

  expect(notificationResult.callTimestamp).toBeDefined();
  expect(notificationResult.distributionId).toBeDefined();
  expect(notificationResult.callbackUrl).toBeDefined();
  expect(notificationResult.status).toBe('SENT');

  // ログレコードが一意に識別可能であることを確認
  expect(latestLog.operationId || (latestLog.userId && latestLog.operationTimestamp)).toBeDefined();
});