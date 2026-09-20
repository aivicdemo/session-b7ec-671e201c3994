import { test, expect } from '@playwright/test';

test.describe('SCEN-1541: 作業指示受領確認', () => {
  test('作業指示受領確認完了後、監査証跡に操作ユーザー・操作日時・操作内容が記録されていること', async ({ page, context }) => {
    // テスト前提：監査証跡が記録される状態にあることを確認
    await page.goto('/');

    // ログイン画面を確認
    const loginForm = page.locator('.login-form');
    await expect(loginForm).toBeVisible();

    // テスト用ユーザーアカウント（U001、操作員A）でログイン
    await page.fill('input[type="text"]', 'U001');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("ログイン")');
    await page.waitForNavigation();

    // ログイン後、ダッシュボードが表示されることを確認（監査証跡が記録される状態）
    await page.waitForLoadState('networkidle');
    const dashboardContent = page.locator('.shell-body');
    await expect(dashboardContent).toBeVisible();

    // 作業指示・実績管理画面を開く
    await page.click('text=作業指示・実績管理');
    await page.waitForLoadState('networkidle');

    // 受領確認状態フィルターで「未確認」を選択して未受領状態の作業指示を表示
    const receiptStatusFilter = page.locator('[data-testid="filter-receipt-status"]');
    await receiptStatusFilter.click();
    await page.click('text=未確認');
    await page.click('[data-testid="filter-search-button"]');
    await page.waitForLoadState('networkidle');

    // 未受領状態の作業指示1件を表示し、その作業指示IDを記録
    const workInstructionRow = page.locator('[id="work-instruction-tbody"] >> tr').first();
    const workInstructionIdText = await workInstructionRow.locator('td').first().textContent();
    const workInstructionId = workInstructionIdText?.trim() || '';
    expect(workInstructionId).toBeTruthy();

    // 未受領状態であることを確認（受領確認状態列が「未確認」であることを確認）
    const receiptStatusCell = workInstructionRow.locator('td').nth(4);
    const receiptStatusText = await receiptStatusCell.textContent();
    expect(receiptStatusText?.trim()).toBe('未確認');

    // 作業指示をクリックして詳細を表示
    await workInstructionRow.click();
    await page.waitForLoadState('networkidle');

    // システム時刻を記録する（期待結果の検証用）
    const operationTimeMs = Date.now();

    // 作業指示受領確認ボタンをクリック
    const receiptConfirmButton = page.locator('[data-testid="receipt-confirm-ok"]');
    await receiptConfirmButton.click();
    await page.waitForLoadState('networkidle');

    // 受領確認完了メッセージを確認
    const successMessage = page.locator('[id="success-message"]');
    await expect(successMessage).toBeVisible();

    // 管理者向けの監査ログ確認画面にアクセス
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    // 監査証跡が記録される状態にあることを確認（ページが正常に読み込まれていることを確認）
    const auditLogPageContent = page.locator('body');
    await expect(auditLogPageContent).toBeVisible();

    // API から監査ログを取得
    const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
    const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);

    expect(apiUrl).toBeTruthy();
    expect(appId).toBeTruthy();

    if (apiUrl && appId) {
      // 監査ログテーブルを特定
      const tables = await page.evaluate(() => (window as any).AIVIC_TABLES);
      let auditLogTableNumber = null;

      if (tables && tables.length > 0) {
        const auditTable = tables.find((t: any) =>
          t.tableName && (t.tableName.includes('audit') || t.tableName.includes('log'))
        );
        if (auditTable) {
          auditLogTableNumber = auditTable.tableNumber;
        }
      }

      // デフォルトのテーブル番号を使用（テーブル特定失敗時）
      if (!auditLogTableNumber) {
        auditLogTableNumber = 'audit_logs';
      }

      const auditLogUrl = `${apiUrl}/${auditLogTableNumber}?app=${appId}&sort=-timestamp&limit=100`;
      const auditResponse = await context.request.get(auditLogUrl);
      const auditData = await auditResponse.json() as any;

      expect(auditData.records).toBeDefined();
      expect(auditData.records.length).toBeGreaterThan(0);

      // 最新の監査証跡レコードから、対象の作業指示IDに関連する操作を検索
      const relevantRecords = auditData.records.filter((record: any) =>
        record.work_instruction_id === workInstructionId &&
        (record.operation_type === '作業指示受領確認' ||
         record.operation_type?.includes('受領確認') ||
         record.operation_type?.includes('受領'))
      );

      // 対象の作業指示に関連するレコードが存在することを確認
      expect(relevantRecords.length).toBeGreaterThan(0);

      // 最新のレコードを取得（新規レコードであることを確認）
      const latestAuditRecord = relevantRecords[0];

      // ユーザー識別子フィールドの検証
      const userIdentified =
        latestAuditRecord.user_id === 'U001' ||
        latestAuditRecord.user_name === '操作員A' ||
        latestAuditRecord.operator_id === 'U001' ||
        latestAuditRecord.operator_name === '操作員A';
      expect(userIdentified).toBeTruthy();

      // タイムスタンプフィールドの検証（操作時刻と同一または数秒以内）
      const recordTimestamp = new Date(latestAuditRecord.timestamp || latestAuditRecord.created_at);
      const recordTimestampMs = recordTimestamp.getTime();
      const timeDifference = Math.abs(recordTimestampMs - operationTimeMs);
      // レコードがボタンクリック後に作成されたことを確認（新規レコード）
      expect(recordTimestampMs).toBeGreaterThanOrEqual(operationTimeMs);
      // 時刻差は5秒以内
      expect(timeDifference).toBeLessThanOrEqual(5000);

      // 操作種別フィールドの検証
      const operationTypeValid =
        latestAuditRecord.operation_type === '作業指示受領確認' ||
        latestAuditRecord.operation_type?.includes('受領確認') ||
        latestAuditRecord.operation_type?.includes('受領');
      expect(operationTypeValid).toBeTruthy();

      // 対象作業指示フィールドの検証
      expect(latestAuditRecord.work_instruction_id).toBe(workInstructionId);
    }
  });
});