import { test, expect } from '@playwright/test';

test.describe('配置案実行処理', () => {
  test('実行完了した配置案の内容が現場リーダーに配置指示として配信され、作業者への指示伝達が促進される', async ({ page, context }) => {
    // ログイン処理
    await page.goto('/');
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass');
    await page.click('button[type="submit"]');
    
    // ログイン後の画面遷移を待機
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    // 最適人員配置案提案・実行画面に遷移
    await page.goto('/panels/scr-1789461978707.html');
    await page.waitForLoadState('networkidle');

    // 承認待ち状態の配置案を確認
    const pendingProposals = await page.locator('[data-status="pending"]').all();
    expect(pendingProposals.length).toBeGreaterThan(0);

    // 最初の承認待ち配置案の詳細を確認
    const proposalCard = page.locator('[data-proposal]').first();
    await expect(proposalCard).toBeVisible();
    
    // 配置案の内容が表示されていることを確認
    const workerNameElement = proposalCard.locator('[data-worker-name]');
    await expect(workerNameElement).toBeVisible();
    const workerName = await workerNameElement.textContent();
    expect(workerName).toBeTruthy();
    expect(workerName?.trim().length).toBeGreaterThan(0);
    
    const processNameElement = proposalCard.locator('[data-process-name]');
    await expect(processNameElement).toBeVisible();
    const processName = await processNameElement.textContent();
    expect(processName).toBeTruthy();
    expect(processName?.trim().length).toBeGreaterThan(0);
    
    const scheduledTimeElement = proposalCard.locator('[data-scheduled-time]');
    await expect(scheduledTimeElement).toBeVisible();
    const scheduledTime = await scheduledTimeElement.textContent();
    expect(scheduledTime).toBeTruthy();
    expect(scheduledTime?.trim().length).toBeGreaterThan(0);

    const workContentElement = proposalCard.locator('[data-work-content]');
    await expect(workContentElement).toBeVisible();
    const workContent = await workContentElement.textContent();
    expect(workContent).toBeTruthy();
    expect(workContent?.trim().length).toBeGreaterThan(0);

    // 「実行」ボタンをクリック
    const executeButton = proposalCard.locator('button[data-action="execute"]');
    await executeButton.click();

    // 実行処理の完了を待機
    await page.waitForLoadState('networkidle');

    // ステータスが「実行完了」に変更されたことを確認
    const statusElement = proposalCard.locator('[data-status]');
    await expect(statusElement).toContainText('実行完了');

    // メッセージ送信ログを確認するため API に接続
    const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
    const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
    const tables = await page.evaluate(() => (window as any).AIVIC_TABLES);
    
    expect(apiUrl).toBeTruthy();
    expect(appId).toBeTruthy();
    expect(tables).toBeTruthy();

    // メッセージ送信ログテーブルを取得
    const messageLogTable = tables.find((t: any) => 
      t.tableName.includes('message') || t.tableName.includes('log')
    );
    expect(messageLogTable).toBeDefined();

    const messageLogTableId = messageLogTable.tableId;
    
    const response = await page.request.get(
      `${apiUrl}/api/${messageLogTableId}?app=${appId}`
    );
    expect(response.ok()).toBeTruthy();
    const logs = await response.json();

    // メッセージ送信ログが存在することを確認
    expect(logs.length).toBeGreaterThan(0);

    // 最新のメッセージ送信ログを確認
    const latestLog = logs[0];
    expect(latestLog).toBeDefined();

    // 送信先が現場リーダーIDであることを確認
    const recipientId = latestLog.recipientId || latestLog.leaderId;
    expect(recipientId).toBeTruthy();
    expect(typeof recipientId).toBe('string');

    // 送信時刻が記録されていることを確認
    const sendTime = latestLog.timestamp || latestLog.sentAt;
    expect(sendTime).toBeTruthy();

    // メッセージ本文に必要な情報が含まれていることを確認
    const messageContent = latestLog.message || latestLog.content;
    expect(messageContent).toBeTruthy();
    expect(messageContent).toContain(workerName?.trim());
    expect(messageContent).toContain(processName?.trim());
    expect(messageContent).toContain(scheduledTime?.trim());
    expect(messageContent).toContain(workContent?.trim());
  });
});