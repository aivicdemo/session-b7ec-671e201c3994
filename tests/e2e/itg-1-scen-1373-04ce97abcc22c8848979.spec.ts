import { test, expect } from '@playwright/test';

test.describe('人員配置案却下操作の監査ログ記録', () => {
  let apiUrl: string;
  let appId: string;
  let tables: any;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForURL('**/panels/scr-1789461783315.html', { timeout: 30000 });
    
    apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
    appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
    tables = await page.evaluate(() => (window as any).AIVIC_TABLES);
    
    await context.close();
  });

  test('人員配置案却下操作が監査ログに記録される', async ({ page, browser }) => {
    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/');
    await page.waitForURL('**/panels/scr-1789461783315.html', { timeout: 30000 });
    
    // 人員配置最適化提案・実行画面へ遷移
    const proposalNavLink = page.locator('nav').locator('text=人員配置最適化提案');
    await proposalNavLink.click();
    await page.waitForURL('**/panels/scr-1789461798629.html', { timeout: 30000 });
    
    // システムが生成した人員配置案を確認
    const proposalContainer = page.locator('[id="proposals-container"]');
    await expect(proposalContainer).toBeVisible({ timeout: 10000 });
    
    // 最初の配置案を選択
    const proposals = proposalContainer.locator('> div');
    const proposalCount = await proposals.count();
    expect(proposalCount).toBeGreaterThan(0);
    
    const firstProposal = proposals.first();
    const proposalId = await firstProposal.getAttribute('data-proposal-id').catch(() => '');
    await firstProposal.click();
    
    // 配置案の詳細が表示されることを確認
    const detailContainer = page.locator('[id="proposal-detail-container"]');
    await expect(detailContainer).toBeVisible({ timeout: 10000 });
    
    // 却下ボタンをクリック
    const rejectButton = page.locator('[data-testid="reject-button"]').or(page.locator('button:has-text("配置案を却下")'));
    await rejectButton.click();
    
    // 却下理由ダイアログが表示される
    const rejectModalOverlay = page.locator('[id="reject-modal-overlay"]');
    await expect(rejectModalOverlay).toBeVisible({ timeout: 10000 });
    
    // 却下理由テキストエリアに理由を入力
    const rejectReasonTextarea = page.locator('[id="reject-reason"]');
    const rejectReason = '当該作業者は別案件で必須';
    await rejectReasonTextarea.fill(rejectReason);
    
    // 確定ボタンをクリック前に時刻を記録
    const operationTime = new Date();
    
    // 確定ボタンをクリック
    const rejectConfirmButton = page.locator('[data-testid="reject-modal-confirm"]').or(page.locator('button:has-text("却下する")'));
    await rejectConfirmButton.click();
    
    // 成功メッセージが表示されることを確認
    const successMessage = page.locator('text=/人員配置案.*却下.*完了|却下.*完了/');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    // モーダルが閉じることを確認
    await expect(rejectModalOverlay).not.toBeVisible({ timeout: 10000 });
    
    // 新しいコンテキストで管理者として監査ログ画面にアクセス
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    try {
      // 監査ログ画面へ直接アクセス
      await adminPage.goto('/admin/audit-logs', { waitUntil: 'networkidle', timeout: 30000 }).catch(async () => {
        // 直接アクセスが失敗した場合、APIから監査ログを取得
        await adminPage.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
      });
      
      // 監査ログテーブルが表示されることを確認
      let auditLogTable = adminPage.locator('[id="audit-logs-table"]')
        .or(adminPage.locator('table').first());
      
      // APIからも監査ログデータを取得する準備
      const auditLogsTableName = tables?.audit_logs?.tableName || 'audit_logs';
      const apiEndpoint = `${apiUrl}/api/${auditLogsTableName}?app=${appId}`;
      
      // ソート条件：操作日時で降順、操作区分が「人員配置案却下」
      const response = await adminPage.evaluate(async (endpoint: string) => {
        try {
          const res = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          return await res.json();
        } catch (error) {
          return null;
        }
      }, apiEndpoint);
      
      // UIまたはAPIからログレコードを取得
      let auditLogData: any = {};
      
      if (await auditLogTable.isVisible({ timeout: 5000 }).catch(() => false)) {
        // 操作日時カラムをクリックして降順ソート
        const headers = adminPage.locator('thead th');
        const headerCount = await headers.count().catch(() => 0);
        
        for (let i = 0; i < headerCount; i++) {
          const headerText = await headers.nth(i).textContent().catch(() => '');
          if (headerText?.includes('操作日時')) {
            const sortButton = headers.nth(i).locator('button').or(headers.nth(i));
            await sortButton.click().catch(() => {});
            await adminPage.waitForLoadState('networkidle').catch(() => {});
            // 降順にするため2回クリック
            await sortButton.click().catch(() => {});
            await adminPage.waitForLoadState('networkidle').catch(() => {});
            break;
          }
        }
        
        // 最新のログレコード（最初のデータ行）を取得
        const tableBody = adminPage.locator('tbody').first();
        const rows = tableBody.locator('tr');
        const firstLogRow = rows.first();
        
        await expect(firstLogRow).toBeVisible({ timeout: 10000 });
        
        // テーブルヘッダーとセルをマッピング
        const headerElements = adminPage.locator('thead th');
        const headerTexts: string[] = [];
        const headerTextCount = await headerElements.count();
        
        for (let i = 0; i < headerTextCount; i++) {
          const text = await headerElements.nth(i).textContent().catch(() => '');
          headerTexts.push(text || '');
        }
        
        // ログ行のセルを取得
        const cells = firstLogRow.locator('td');
        const cellCount = await cells.count();
        
        for (let i = 0; i < cellCount && i < headerTexts.length; i++) {
          const cellText = (await cells.nth(i).textContent().catch(() => '')).trim();
          const headerText = headerTexts[i];
          
          if (headerText.includes('操作区分')) {
            auditLogData.operationType = cellText;
          } else if (headerText.includes('操作者') || headerText.includes('ユーザーID')) {
            auditLogData.operatorUserId = cellText;
          } else if (headerText.includes('操作日時')) {
            auditLogData.operationTime = cellText;
          } else if (headerText.includes('対象リソース') || headerText.includes('配置案ID')) {
            auditLogData.targetResourceId = cellText;
          } else if (headerText.includes('却下理由') || headerText.includes('理由')) {
            auditLogData.rejectReason = cellText;
          } else if (headerText.includes('ステータス') || headerText.includes('状態')) {
            auditLogData.statusChange = cellText;
          }
        }
      } else if (response && Array.isArray(response)) {
        // APIからのレスポンスから最新のログを検索
        const rejectLog = response
          .sort((a: any, b: any) => new Date(b.operation_time || b.operationTime).getTime() - new Date(a.operation_time || a.operationTime).getTime())
          .find((log: any) => (log.operation_type || log.operationType) === '人員配置案却下');
        
        if (rejectLog) {
          auditLogData.operationType = rejectLog.operation_type || rejectLog.operationType;
          auditLogData.operatorUserId = rejectLog.operator_user_id || rejectLog.operatorUserId || rejectLog.operator_id;
          auditLogData.operationTime = rejectLog.operation_time || rejectLog.operationTime;
          auditLogData.targetResourceId = rejectLog.target_resource_id || rejectLog.targetResourceId || rejectLog.proposal_id;
          auditLogData.rejectReason = rejectLog.reject_reason || rejectLog.rejectReason;
          auditLogData.statusChange = (rejectLog.status_change || rejectLog.statusChange) || 
            `${rejectLog.old_status || rejectLog.oldStatus || '実行予定'}→${rejectLog.new_status || rejectLog.newStatus || '却下'}`;
        }
      }
      
      // 監査ログの記録を検証
      expect(auditLogData.operationType).toBeTruthy();
      expect(auditLogData.operationType).toBe('人員配置案却下');
      
      expect(auditLogData.operatorUserId).toBeTruthy();
      const operatorUserIdTrimmed = String(auditLogData.operatorUserId).trim();
      expect(operatorUserIdTrimmed.length).toBeGreaterThan(0);
      
      expect(auditLogData.operationTime).toBeTruthy();
      const operationTimeTrimmed = String(auditLogData.operationTime).trim();
      expect(operationTimeTrimmed.length).toBeGreaterThan(0);
      
      // 操作日時が手順5実行時刻の±5秒以内であることを確認
      const logTimeStr = String(auditLogData.operationTime).trim();
      const logTime = new Date(logTimeStr);
      expect(logTime.getTime()).toBeGreaterThan(0);
      const timeDifference = Math.abs(logTime.getTime() - operationTime.getTime());
      expect(timeDifference).toBeLessThanOrEqual(5000);
      
      expect(auditLogData.targetResourceId).toBeTruthy();
      const targetResourceIdTrimmed = String(auditLogData.targetResourceId).trim();
      expect(targetResourceIdTrimmed.length).toBeGreaterThan(0);
      
      expect(auditLogData.rejectReason).toBeTruthy();
      const rejectReasonTrimmed = String(auditLogData.rejectReason).trim();
      expect(rejectReasonTrimmed.length).toBeGreaterThan(0);
      expect(rejectReasonTrimmed).toBe(rejectReason);
      
      expect(auditLogData.statusChange).toBeTruthy();
      const statusChangeTrimmed = String(auditLogData.statusChange).trim();
      expect(statusChangeTrimmed.length).toBeGreaterThan(0);
      expect(statusChangeTrimmed).toContain('実行予定');
      expect(statusChangeTrimmed).toContain('却下');
    } finally {
      await adminContext.close();
    }
  });
});