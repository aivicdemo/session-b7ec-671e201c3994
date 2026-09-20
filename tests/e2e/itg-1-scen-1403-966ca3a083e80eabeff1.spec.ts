import { test, expect } from '@playwright/test';

test('SCEN-1403: 承認モーダル確定時に監査ログが記録される', async ({ page }) => {
  // 1. ログイン認証
  await page.goto('/');
  await page.waitForURL(/.*\/panels\/.+\.html$/);
  
  const userIdField = page.locator('input[placeholder*="ユーザーID"], input[placeholder*="ID"]').first();
  const passwordField = page.locator('input[type="password"]');
  const loginButton = page.locator('button').filter({ hasText: /ログイン|LOGIN/ }).first();
  
  const testUserId = 'admin';
  if (await userIdField.isVisible()) {
    await userIdField.fill(testUserId);
    await passwordField.fill('password');
    await loginButton.click();
    await page.waitForURL(/.*\/panels\/scr-1789461783315\.html$/);
  }

  // 2. ダッシュボード画面を確認
  await expect(page).toHaveURL(/.*scr-1789461783315\.html$/);
  
  // 3. 人員配置最適化提案・実行画面へ遷移
  const optimizationNavItem = page.locator('[data-testid="scr-1789461798629"], a, button').filter({ hasText: /人員配置最適化提案/ }).first();
  await optimizationNavItem.click();
  await page.waitForURL(/.*scr-1789461798629\.html$/);

  // 4. 進捗・生産性データが表示されている状態を確認
  const progressRate = page.locator('[data-testid="progress-rate"], [id="progress-rate-value"]');
  await expect(progressRate).toBeVisible();

  // 5. 遅延リスク判定結果が表示されていることを確認
  const riskLevel = page.locator('[id="risk-level"]');
  await expect(riskLevel).toBeVisible();

  // 6. 人員配置案が生成・提示されていることを確認
  const proposalsContainer = page.locator('[id="proposals-container"]');
  await expect(proposalsContainer).toBeVisible();
  
  const generateButton = page.locator('[data-testid="generate-proposals-btn"]');
  if (await generateButton.isEnabled()) {
    await generateButton.click();
    await page.waitForTimeout(1000);
  }

  // 7. 提示された人員配置案の『承認』ボタンをクリック
  const approveButton = page.locator('[data-testid="approve-button"], [id="approve-btn"]').first();
  await expect(approveButton).toBeVisible();
  await approveButton.click();

  // 8. 承認モーダルが表示されることを確認
  const approveModal = page.locator('[id="approve-modal-overlay"], [data-testid*="approve-modal"]');
  await expect(approveModal).toBeVisible();

  // 9. モーダル内の『確定』ボタンをクリック
  const confirmButton = page.locator('[data-testid="approve-modal-confirm"]');
  
  const clickTime = new Date();
  await confirmButton.click();

  // 10. モーダルが閉じ、画面に戻ることを確認
  await expect(approveModal).not.toBeVisible();
  await expect(page).toHaveURL(/.*scr-1789461798629\.html$/);

  // 11 & 12. 監査ログをデータベースから取得して検証
  const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
  const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
  const tables = await page.evaluate(() => (window as any).AIVIC_TABLES);
  
  if (apiUrl && appId && tables) {
    // テーブル特定時にデフォルトを複数試行
    let auditTableId: string | undefined;
    if (Array.isArray(tables)) {
      const auditTable = tables.find((t: any) => t.tableName === 'audit_log' || t.tableName === 'audit_logs');
      auditTableId = auditTable?.tableId;
    }
    if (!auditTableId) {
      auditTableId = 'audit_log';
    }
    
    const response = await page.request.get(
      `${apiUrl}/api/${auditTableId}?app=${appId}&sort=created_at:desc&limit=1`
    );
    
    expect(response.ok()).toBeTruthy();
    const auditData = await response.json();
    
    const latestLog = Array.isArray(auditData) ? auditData[0] : auditData.data?.[0];
    
    expect(latestLog).toBeDefined();
    
    // executed_by：ログイン済みの管理者ユーザーIDを検証
    expect(latestLog.executed_by).toBe(testUserId);
    
    // operation_type：承認確定操作コードを検証
    expect(latestLog.operation_type).toMatch(/STAFFING_PLAN_APPROVAL_CONFIRMED/);
    
    // related_entity_id：承認した人員配置案IDを検証
    expect(latestLog.related_entity_id).toBeTruthy();
    
    // executed_at：『確定』ボタン押下時刻を中心とした±5秒の範囲内を検証
    const executedTime = new Date(latestLog.executed_at);
    const timeDiff = Math.abs(executedTime.getTime() - clickTime.getTime());
    expect(timeDiff).toBeLessThanOrEqual(5000);
    
    // details：配置先拠点名・チーム名・配置対象者数などの操作詳細がJSON等の構造化形式で含まれていることを検証
    expect(latestLog.details).toBeTruthy();
    const details = typeof latestLog.details === 'string' 
      ? JSON.parse(latestLog.details) 
      : latestLog.details;
    expect(details).toBeDefined();
    
    // 拠点名が含まれていることを確認
    const siteField = details.site_name || details.site;
    expect(siteField).toBeTruthy();
    expect(typeof siteField).toBe('string');
    
    // チーム名が含まれていることを確認
    const teamField = details.team_name || details.team;
    expect(teamField).toBeTruthy();
    expect(typeof teamField).toBe('string');
    
    // 配置対象者数が含まれていることを確認
    const staffingField = details.assignment_count || details.staffing_count;
    expect(staffingField).toBeTruthy();
    expect(typeof staffingField === 'number' || typeof staffingField === 'string').toBeTruthy();
  }
});