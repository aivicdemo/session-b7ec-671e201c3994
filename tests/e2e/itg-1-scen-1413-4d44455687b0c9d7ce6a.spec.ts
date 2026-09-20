import { test, expect } from '@playwright/test';

test.describe('SCEN-1413: 配信モーダル確定操作全体が監査ログに記録される', () => {
  test('配信モーダル確定時に監査ログが正しく記録される', async ({ page, context }) => {
    // テスト前提: 認証状態で「人員配置最適化提案・実行画面」に遷移
    await page.goto('/');

    // ログイン画面が表示される場合はログイン
    const loginForm = page.locator('.login-form');
    const isLoginRequired = await loginForm.isVisible();

    if (isLoginRequired) {
      // テスト用認証情報でログイン
      await page.fill('input[placeholder*="ユーザー"], input[type="text"]', 'admin');
      await page.fill('input[placeholder*="パスワード"], input[type="password"]', 'password');
      const loginButton = page.locator('button:has-text("ログイン"), .login-button').first();
      await loginButton.click();
      await page.waitForLoadState('networkidle');
    }

    // 「人員配置最適化提案・実行画面」に遷移していることを確認
    await page.waitForURL('**/panels/scr-1789461798629.html', { timeout: 10000 });

    // 配置案が生成されている状態を確認
    const progressRateElement = page.locator('[data-testid="progress-rate"]');
    await expect(progressRateElement).toBeVisible();

    // 配置案を生成
    const generateProposalsBtn = page.locator('[data-testid="generate-proposals-btn"]');
    const isGenerateVisible = await generateProposalsBtn.isVisible();

    if (isGenerateVisible) {
      await generateProposalsBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // 生成後の配置案を確認
    const proposalsContainer = page.locator('[id="proposals-container"]');
    await expect(proposalsContainer).toBeVisible();

    // 配置案の詳細行を取得
    const assignmentDetailTable = page.locator('[data-testid="assignment-detail-table"]');
    await expect(assignmentDetailTable).toBeVisible();
    
    const proposalRows = assignmentDetailTable.locator('tbody tr');
    const rowCount = await proposalRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 配置案の詳細行をクリックして配信内容を確認するモーダルを開く
    const firstProposalRow = proposalRows.first();
    await firstProposalRow.click();

    // 配信モーダルが表示されることを確認
    const distributeModalContent = page.locator('[id="distribute-modal-content"]');
    await expect(distributeModalContent).toBeVisible();

    // モーダル内で配信対象（拠点）が表示されていることを確認
    const deliverySiteSelect = page.locator('[data-testid="delivery-site-select"]');
    await expect(deliverySiteSelect).toBeVisible();

    // モーダル内で配信対象の詳細情報（拠点名、チーム名、作業者グループ数、総人数）を取得
    const siteSelectValue = await deliverySiteSelect.textContent();
    expect(siteSelectValue).toBeTruthy();
    expect(siteSelectValue?.trim().length).toBeGreaterThan(0);

    // 配信内容（人員配置案の詳細）が表示されていることを確認
    const deliveryContentTextarea = page.locator('[data-testid="delivery-content-textarea"]');
    await expect(deliveryContentTextarea).toBeVisible();
    const deliveryContent = await deliveryContentTextarea.inputValue();
    expect(deliveryContent.length).toBeGreaterThan(0);

    // 配信予定日時が表示されていることを確認
    const scheduledDateTimeElements = distributeModalContent.locator('[data-testid*="datetime"], [data-testid*="scheduled"]');
    const scheduledDateTimeCount = await scheduledDateTimeElements.count();
    expect(scheduledDateTimeCount).toBeGreaterThan(0);
    const scheduledDateTimeText = await scheduledDateTimeElements.first().textContent();
    expect(scheduledDateTimeText).toBeTruthy();

    // 配置案の詳細情報から、対象拠点名、チーム名、作業者グループ数、総人数を取得して記録
    const targetSiteName = siteSelectValue?.trim();
    const targetGroupCountMatch = deliveryContent.match(/グループ\s*[:：]?\s*(\d+)/);
    const targetGroupCount = targetGroupCountMatch ? parseInt(targetGroupCountMatch[1]) : null;
    const totalWorkerCountMatch = deliveryContent.match(/(?:合計|総)?人数\s*[:：]?\s*(\d+)/);
    const totalWorkerCount = totalWorkerCountMatch ? parseInt(totalWorkerCountMatch[1]) : null;

    // 確定ボタンクリック時のタイムスタンプを記録
    const confirmTimestamp = new Date();

    // モーダル内の「確定」ボタンをクリック
    const distributeModalConfirmButton = page.locator('[data-testid="distribute-modal-confirm"]');
    await expect(distributeModalConfirmButton).toBeVisible();
    await distributeModalConfirmButton.click();

    // モーダルが閉じることを確認
    await expect(distributeModalContent).not.toBeVisible();

    // 配置案詳細が再度表示されることを確認
    const proposalDetailContainer = page.locator('[id="proposal-detail-container"]');
    await expect(proposalDetailContainer).toBeVisible();

    // 当該配置案の状態が「配信確定」に更新されていることを確認
    const statusCell = firstProposalRow.locator('[data-status], [data-testid*="status"]').first();
    await statusCell.waitFor({ state: 'visible', timeout: 5000 });
    const statusText = await statusCell.textContent();
    expect(statusText).toContain('配信確定');

    // APIから監査ログレコードを取得
    const auditLogRecords = await page.evaluate(async () => {
      const apiUrl = (window as any).AIVIC_API_URL;
      const appId = (window as any).AIVIC_APP_ID;
      const tables = (window as any).AIVIC_TABLES;

      if (!apiUrl || !appId) {
        return null;
      }

      let auditLogTableId = null;
      if (tables && Array.isArray(tables)) {
        const auditLogTable = tables.find((t: any) => t.name === 'audit_log' || t.tableName === 'audit_log');
        auditLogTableId = auditLogTable?.id;
      }

      if (!auditLogTableId) {
        auditLogTableId = 'audit_log';
      }

      try {
        const response = await fetch(`${apiUrl}/api/${auditLogTableId}?app=${appId}`, {
          method: 'GET',
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        return data.records || [];
      } catch (e) {
        return null;
      }
    });

    // 監査ログレコードが取得できることを確認
    expect(auditLogRecords).not.toBeNull();
    expect(Array.isArray(auditLogRecords)).toBe(true);
    expect(auditLogRecords.length).toBeGreaterThan(0);

    // 配置案配信確定に関連するレコードを検索
    const relatedRecords = auditLogRecords.filter((record: any) => {
      const actionType = String(record.actionType || '').toLowerCase();
      return actionType.includes('staffing_plan_confirmed') || 
             actionType.includes('staffing_plan_delivery_confirmed') ||
             (actionType.includes('staffing_plan') && actionType.includes('confirmed'));
    });

    expect(relatedRecords.length).toBeGreaterThan(0);

    // 単一レコード または 連続する関連レコードのいずれかで記録されている場合を確認
    if (relatedRecords.length === 1) {
      // 単一レコードに全情報が記録されている場合
      const confirmRecord = relatedRecords[0];

      // (1) 操作実行時刻の確認（確定ボタンクリック時刻 ±5秒以内）
      const recordTimestamp = new Date(confirmRecord.timestamp);
      const timeDiffSeconds = Math.abs(recordTimestamp.getTime() - confirmTimestamp.getTime()) / 1000;
      expect(timeDiffSeconds).toBeLessThanOrEqual(5);

      // (1) 実行ユーザー（ユーザーID）が記録されていることを確認
      expect(confirmRecord.userId).toBeDefined();
      expect(confirmRecord.userId).not.toBeNull();

      // (1) 操作種別が記録されていることを確認
      expect(confirmRecord.actionType).toBeDefined();
      expect(confirmRecord.actionType).not.toBeNull();

      // (2) 配置案の識別情報（ID）が記録されていることを確認
      const planId = confirmRecord.planId || confirmRecord.resourceId;
      expect(planId).toBeDefined();
      expect(planId).not.toBeNull();

      // (2) 対象拠点コードが記録されていることを確認
      expect(confirmRecord.siteCode).toBeDefined();
      expect(confirmRecord.siteCode).not.toBeNull();

      // (2) 対象チームコードが記録されていることを確認
      expect(confirmRecord.teamCode).toBeDefined();
      expect(confirmRecord.teamCode).not.toBeNull();

      // (3) 対象作業者グループ数が記録されていることを確認
      const recordedGroupCount = confirmRecord.groupCount || confirmRecord.workerGroupCount;
      expect(recordedGroupCount).toBeDefined();
      expect(recordedGroupCount).not.toBeNull();
      if (targetGroupCount !== null) {
        expect(recordedGroupCount).toBe(targetGroupCount);
      }

      // (3) 配信対象人数（総人数）が記録されていることを確認
      const recordedTotalCount = confirmRecord.targetCount || confirmRecord.totalWorkerCount;
      expect(recordedTotalCount).toBeDefined();
      expect(recordedTotalCount).not.toBeNull();
      if (totalWorkerCount !== null) {
        expect(recordedTotalCount).toBe(totalWorkerCount);
      }

      // (4) NotificationServiceAdapterの sendStaffingPlan が呼び出されたことを示す情報が記録されていることを確認
      const hasNotificationServiceAdapter = 
        (confirmRecord.adapterName && String(confirmRecord.adapterName).includes('NotificationServiceAdapter')) ||
        (confirmRecord.adapterMethod && String(confirmRecord.adapterMethod).includes('sendStaffingPlan')) ||
        String(confirmRecord.actionType || '').includes('notification');
      expect(hasNotificationServiceAdapter).toBe(true);

      // (4) sendStaffingPlan の戻り値として配信ID が記録されていることを確認
      expect(confirmRecord.deliveryId).toBeDefined();
      expect(confirmRecord.deliveryId).not.toBeNull();

      // (4) sendStaffingPlan の戻り値として受領確認用コールバックURL が記録されていることを確認
      expect(confirmRecord.callbackUrl).toBeDefined();
      expect(confirmRecord.callbackUrl).not.toBeNull();

      // ステータスが『success』として記録されていることを確認
      expect(confirmRecord.status).toBe('success');

      // 画面上で削除・編集ボタンが非表示または無効化されていることを確認
      const auditLogUIElements = await page.evaluate(async () => {
        const deleteButtons = document.querySelectorAll('[data-testid*="delete"], [aria-label*="削除"]');
        const editButtons = document.querySelectorAll('[data-testid*="edit"], [aria-label*="編集"]');
        
        return {
          deleteButtonsCount: deleteButtons.length,
          editButtonsCount: editButtons.length,
          deleteButtonsVisible: Array.from(deleteButtons).some(btn => (btn as HTMLElement).offsetHeight > 0),
          editButtonsVisible: Array.from(editButtons).some(btn => (btn as HTMLElement).offsetHeight > 0),
        };
      });

      // 画面上で削除ボタンが非表示または無効化されていることを確認
      expect(auditLogUIElements.deleteButtonsVisible).toBe(false);
      // 画面上で編集ボタンが非表示または無効化されていることを確認
      expect(auditLogUIElements.editButtonsVisible).toBe(false);

      // 読み取り専用権限の検証：監査ログレコードの削除APIアクセスを試行
      const deleteAttempt = await page.evaluate(async () => {
        const apiUrl = (window as any).AIVIC_API_URL;
        const appId = (window as any).AIVIC_APP_ID;
        const tables = (window as any).AIVIC_TABLES;

        if (!apiUrl || !appId) {
          return null;
        }

        let auditLogTableId = null;
        if (tables && Array.isArray(tables)) {
          const auditLogTable = tables.find((t: any) => t.name === 'audit_log' || t.tableName === 'audit_log');
          auditLogTableId = auditLogTable?.id;
        }

        if (!auditLogTableId) {
          auditLogTableId = 'audit_log';
        }

        try {
          const response = await fetch(`${apiUrl}/api/${auditLogTableId}/${confirmRecord.id}?app=${appId}`, {
            method: 'DELETE',
          });

          return {
            status: response.status,
            ok: response.ok,
          };
        } catch (e) {
          return {
            status: null,
            ok: false,
          };
        }
      });

      // 削除APIが権限エラー（403）または操作不可（405）で拒否されることを確認
      expect(deleteAttempt).not.toBeNull();
      expect([403, 405]).toContain(deleteAttempt?.status);
      expect(deleteAttempt?.ok).toBe(false);

      // 読み取り専用権限の検証：監査ログレコードの編集APIアクセスを試行
      const updateAttempt = await page.evaluate(async () => {
        const apiUrl = (window as any).AIVIC_API_URL;
        const appId = (window as any).AIVIC_APP_ID;
        const tables = (window as any).AIVIC_TABLES;

        if (!apiUrl || !appId) {
          return null;
        }

        let auditLogTableId = null;
        if (tables && Array.isArray(tables)) {
          const auditLogTable = tables.find((t: any) => t.name === 'audit_log' || t.tableName === 'audit_log');
          auditLogTableId = auditLogTable?.id;
        }

        if (!auditLogTableId) {
          auditLogTableId = 'audit_log';
        }

        try {
          const response = await fetch(`${apiUrl}/api/${auditLogTableId}/${confirmRecord.id}?app=${appId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ actionType: 'modified' }),
          });

          return {
            status: response.status,
            ok: response.ok,
          };
        } catch (e) {
          return {
            status: null,
            ok: false,
          };
        }
      });

      // 編集APIが権限エラー（403）または操作不可（405）で拒否されることを確認
      expect(updateAttempt).not.toBeNull();
      expect([403, 405]).toContain(updateAttempt?.status);
      expect(updateAttempt?.ok).toBe(false);
    } else {
      // 連続する関連レコードとして記録されている場合
      const firstRecord = relatedRecords[0];

      // (1) 最初のレコードから操作実行時刻・実行ユーザー・操作種別を確認
      const recordTimestamp = new Date(firstRecord.timestamp);
      const timeDiffSeconds = Math.abs(recordTimestamp.getTime() - confirmTimestamp.getTime()) / 1000;
      expect(timeDiffSeconds).toBeLessThanOrEqual(5);

      expect(firstRecord.userId).toBeDefined();
      expect(firstRecord.userId).not.toBeNull();
      expect(firstRecord.actionType).toBeDefined();

      // (2) 対象リソース情報を確認
      const resourceRecord = relatedRecords.find((r: any) =>
        (r.planId || r.resourceId || r.siteCode || r.teamCode)
      );
      expect(resourceRecord).toBeDefined();
      const recordedPlanId = resourceRecord.planId || resourceRecord.resourceId;
      expect(recordedPlanId).toBeDefined();
      expect(recordedPlanId).not.toBeNull();
      expect(resourceRecord.siteCode).toBeDefined();
      expect(resourceRecord.siteCode).not.toBeNull();
      expect(resourceRecord.teamCode).toBeDefined();
      expect(resourceRecord.teamCode).not.toBeNull();

      // (3) 配信対象の詳細情報を確認
      const targetDetailRecord = relatedRecords.find((r: any) =>
        (r.targetCount || r.totalWorkerCount) && (r.groupCount || r.workerGroupCount)
      );
      expect(targetDetailRecord).toBeDefined();
      const recordedGroupCount = targetDetailRecord.groupCount || targetDetailRecord.workerGroupCount;
      const recordedTotalCount = targetDetailRecord.targetCount || targetDetailRecord.totalWorkerCount;
      expect(recordedGroupCount).toBeDefined();
      expect(recordedGroupCount).not.toBeNull();
      expect(recordedTotalCount).toBeDefined();
      expect(recordedTotalCount).not.toBeNull();
      if (targetGroupCount !== null) {
        expect(recordedGroupCount).toBe(targetGroupCount);
      }
      if (totalWorkerCount !== null) {
        expect(recordedTotalCount).toBe(totalWorkerCount);
      }

      // (4) NotificationServiceAdapterの sendStaffingPlan が呼び出されたことを示す情報を確認
      const adapterRecord = relatedRecords.find((r: any) => {
        const hasNotificationAdapter = (r.adapterName && String(r.adapterName).includes('NotificationServiceAdapter')) ||
          (r.adapterMethod && String(r.adapterMethod).includes('sendStaffingPlan')) ||
          String(r.actionType || '').includes('notification');
        return hasNotificationAdapter;
      });
      expect(adapterRecord).toBeDefined();

      // (4) sendStaffingPlan の戻り値として配信ID が記録されていることを確認
      const deliveryIdRecord = relatedRecords.find((r: any) => r.deliveryId && r.deliveryId !== null);
      expect(deliveryIdRecord).toBeDefined();
      expect(deliveryIdRecord.deliveryId).not.toBeNull();

      // (4) sendStaffingPlan の戻り値として受領確認用コールバックURL が記録されていることを確認
      const callbackUrlRecord = relatedRecords.find((r: any) => r.callbackUrl && r.callbackUrl !== null);
      expect(callbackUrlRecord).toBeDefined();
      expect(callbackUrlRecord.callbackUrl).not.toBeNull();

      // (5) トランザクション関連レコード間での追跡可能性確認
      const transactionIds = relatedRecords.map((r: any) => r.transactionId).filter((id: any) => id);

      if (transactionIds.length > 0) {
        // transactionId で関連付けられている場合
        const uniqueTransactionIds = new Set(transactionIds);
        expect(uniqueTransactionIds.size).toBe(1);
      } else {
        // transactionId がない場合は時間的連続性を確認
        for (let i = 1; i < relatedRecords.length; i++) {
          const prevTime = new Date(relatedRecords[i - 1].timestamp).getTime();
          const currTime = new Date(relatedRecords[i].timestamp).getTime();
          const timeDiff = currTime - prevTime;
          expect(timeDiff).toBeLessThanOrEqual(10000);
        }
      }

      // (5) モーダル確定から画面状態更新までの一連のトランザクション追跡確認
      const screenUpdateRecord = relatedRecords.find((r: any) =>
        String(r.actionType || '').includes('status_updated') ||
        String(r.actionType || '').includes('screen_updated')
      );
      if (screenUpdateRecord) {
        const screenUpdateTime = new Date(screenUpdateRecord.timestamp).getTime();
        const lastRecordTime = new Date(relatedRecords[relatedRecords.length - 1].timestamp).getTime();
        expect(Math.abs(screenUpdateTime - lastRecordTime)).toBeLessThanOrEqual(10000);
      }

      // ステータスが『success』として記録されていることを確認
      const successRecord = relatedRecords.find((r: any) => r.status === 'success');
      expect(successRecord).toBeDefined();

      // 画面上で削除・編集ボタンが非表示または無効化されていることを確認
      const auditLogUIElements = await page.evaluate(async () => {
        const deleteButtons = document.querySelectorAll('[data-testid*="delete"], [aria-label*="削除"]');
        const editButtons = document.querySelectorAll('[data-testid*="edit"], [aria-label*="編集"]');
        
        return {
          deleteButtonsCount: deleteButtons.length,
          editButtonsCount: editButtons.length,
          deleteButtonsVisible: Array.from(deleteButtons).some(btn => (btn as HTMLElement).offsetHeight > 0),
          editButtonsVisible: Array.from(editButtons).some(btn => (btn as HTMLElement).offsetHeight > 0),
        };
      });

      // 画面上で削除ボタンが非表示または無効化されていることを確認
      expect(auditLogUIElements.deleteButtonsVisible).toBe(false);
      // 画面上で編集ボタンが非表示または無効化されていることを確認
      expect(auditLogUIElements.editButtonsVisible).toBe(false);

      // 読み取り専用権限の検証：最初の関連レコードの削除APIアクセスを試行
      const recordToDelete = relatedRecords[0];
      const deleteAttempt = await page.evaluate(async (recordId: string) => {
        const apiUrl = (window as any).AIVIC_API_URL;
        const appId = (window as any).AIVIC_APP_ID;
        const tables = (window as any).AIVIC_TABLES;

        if (!apiUrl || !appId) {
          return null;
        }

        let auditLogTableId = null;
        if (tables && Array.isArray(tables)) {
          const auditLogTable = tables.find((t: any) => t.name === 'audit_log' || t.tableName === 'audit_log');
          auditLogTableId = auditLogTable?.id;
        }

        if (!auditLogTableId) {
          auditLogTableId = 'audit_log';
        }

        try {
          const response = await fetch(`${apiUrl}/api/${auditLogTableId}/${recordId}?app=${appId}`, {
            method: 'DELETE',
          });

          return {
            status: response.status,
            ok: response.ok,
          };
        } catch (e) {
          return {
            status: null,
            ok: false,
          };
        }
      }, recordToDelete.id);

      // 削除APIが権限エラー（403）または操作不可（405）で拒否されることを確認
      expect(deleteAttempt).not.toBeNull();
      expect([403, 405]).toContain(deleteAttempt?.status);
      expect(deleteAttempt?.ok).toBe(false);

      // 読み取り専用権限の検証：関連レコードの編集APIアクセスを試行
      const updateAttempt = await page.evaluate(async (recordId: string) => {
        const apiUrl = (window as any).AIVIC_API_URL;
        const appId = (window as any).AIVIC_APP_ID;
        const tables = (window as any).AIVIC_TABLES;

        if (!apiUrl || !appId) {
          return null;
        }

        let auditLogTableId = null;
        if (tables && Array.isArray(tables)) {
          const auditLogTable = tables.find((t: any) => t.name === 'audit_log' || t.tableName === 'audit_log');
          auditLogTableId = auditLogTable?.id;
        }

        if (!auditLogTableId) {
          auditLogTableId = 'audit_log';
        }

        try {
          const response = await fetch(`${apiUrl}/api/${auditLogTableId}/${recordId}?app=${appId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ actionType: 'modified' }),
          });

          return {
            status: response.status,
            ok: response.ok,
          };
        } catch (e) {
          return {
            status: null,
            ok: false,
          };
        }
      }, recordToDelete.id);

      // 編集APIが権限エラー（403）または操作不可（405）で拒否されることを確認
      expect(updateAttempt).not.toBeNull();
      expect([403, 405]).toContain(updateAttempt?.status);
      expect(updateAttempt?.ok).toBe(false);
    }
  });
});