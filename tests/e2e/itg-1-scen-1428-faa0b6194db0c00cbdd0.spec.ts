import { test, expect } from "@playwright/test";

test.describe("SCEN-1428: ダッシュボード表示操作が監査証跡として記録される", () => {
  test("作業指示・実績管理画面からダッシュボードへ遷移し、監査ログが記録される", async ({
    page,
  }) => {
    // ステップ1: 作業指示・実績管理画面にログイン後、正常に表示された状態で待機する
    await page.goto("/");

    // ログイン画面から認証
    const userIdInput = page.locator(
      'input[placeholder*="ユーザーID"], input[name*="user"], input[type="text"]:first-of-type'
    );
    const passwordInput = page.locator(
      'input[placeholder*="パスワード"], input[name*="password"], input[type="password"]'
    );
    const loginButton = page.locator(
      'button:has-text("ログイン"), button[type="submit"]'
    );

    const testUserId = "testuser";
    await userIdInput.fill(testUserId);
    await passwordInput.fill("testpass");
    await loginButton.click();

    // ログイン後、作業指示・実績管理画面へ遷移
    await page.waitForURL("**/panels/**");
    const workInstructionNav = page
      .locator("a, button")
      .filter({ hasText: "作業指示・実績管理" })
      .first();
    await workInstructionNav.click();
    await page.waitForURL("**/scr-1789461813941.html");

    // 画面が正常に表示されたことを確認
    const workInstructionContent = page.locator(
      '[data-testid="work-instruction-list"], #work-instruction-tbody'
    );
    await expect(workInstructionContent).toBeVisible();

    // ステップ2: 画面上部のナビゲーション内の「進捗・人員配置ダッシュボード」へのリンクをクリックして遷移操作を実行する
    const operationTimeStart = new Date();
    const dashboardNav = page
      .locator("a, button")
      .filter({ hasText: "進捗・人員配置ダッシュボード" })
      .first();
    await dashboardNav.click();
    const operationTimeEnd = new Date();

    // ステップ3: 進捗・人員配置ダッシュボード画面が正常に表示されたことを確認する
    await page.waitForURL("**/scr-1789461783315.html");

    const dashboardContent = page.locator(
      '[data-testid="kpi-risk-count"], [data-testid="kpi-sites-action"], [data-testid="kpi-active-plans"]'
    );
    await expect(dashboardContent.first()).toBeVisible();

    // ステップ4, 5: 監査ログAPIにアクセスして検索し、操作内容を確認する
    const apiUrl = (page.context() as any).AIVIC_API_URL;
    const appId = (page.context() as any).AIVIC_APP_ID;
    const tables = (page.context() as any).AIVIC_TABLES || {};

    // 監査ログテーブル番号を取得（テーブル名から検索）
    let auditLogTableId = "audit_logs";
    if (tables && typeof tables === "object") {
      for (const [key, value] of Object.entries(tables)) {
        if (
          key.toLowerCase().includes("audit") ||
          (value as string)?.toLowerCase?.().includes("audit")
        ) {
          auditLogTableId = key;
          break;
        }
      }
    }

    // 監査ログテーブルへのアクセス
    const auditLogResponse = await page.request.get(
      `${apiUrl}/api/${auditLogTableId}?app=${appId}`
    );
    expect(auditLogResponse.ok()).toBeTruthy();

    const auditLogs = await auditLogResponse.json();
    const auditLogRecords = Array.isArray(auditLogs)
      ? auditLogs
      : auditLogs.records || [];

    // 操作直後のレコードを検索（操作ユーザーID、画面ID、操作タイプで絞込）
    const relevantRecords = auditLogRecords.filter((record: any) => {
      const recordUserId = record.userId || record.operationUserId;
      const operationType = record.operationType;
      const operationTarget = record.operationTarget || record.screenId;
      const recordStatus = record.operationStatus || record.status;
      const operationContent =
        record.operationContent ||
        record.operationDescription ||
        record.description ||
        record.content ||
        "";

      const isCorrectUser = recordUserId === testUserId;
      const isScreenTransition =
        operationType === "DASHBOARD_VIEW" ||
        operationType === "SCREEN_TRANSITION";
      const isCorrectTarget =
        operationTarget?.includes?.("scr-1789461783315") ||
        operationTarget?.includes?.("進捗・人員配置ダッシュボード") ||
        operationTarget?.includes?.("DASHBOARD");
      const isSuccess = recordStatus === "SUCCESS";
      const hasOperationContent =
        operationContent?.includes?.("ダッシュボード表示") ||
        operationContent?.includes?.("画面遷移") ||
        operationContent?.includes?.("作業指示・実績管理画面") ||
        operationContent?.includes?.("進捗・人員配置ダッシュボード");

      return (
        isCorrectUser &&
        isScreenTransition &&
        isCorrectTarget &&
        isSuccess &&
        hasOperationContent
      );
    });

    // 期待結果: 監査ログに1件以上のレコードが存在すること
    expect(relevantRecords.length).toBeGreaterThanOrEqual(1);

    // 検索したレコードの検証
    const targetRecord = relevantRecords[0];
    expect(targetRecord).toBeDefined();

    // (1) 操作ユーザーID：ログインユーザーと一致
    const recordUserId = targetRecord.userId || targetRecord.operationUserId;
    expect(recordUserId).toBe(testUserId);

    // (2) 操作タイプ：「DASHBOARD_VIEW」または「SCREEN_TRANSITION」
    expect(targetRecord.operationType).toMatch(
      /^(DASHBOARD_VIEW|SCREEN_TRANSITION)$/
    );

    // (3) 操作対象：「進捗・人員配置ダッシュボード」の画面ID
    const operationTarget = targetRecord.operationTarget || targetRecord.screenId;
    expect(operationTarget).toMatch(
      /scr-1789461783315|進捗・人員配置ダッシュボード|DASHBOARD/
    );

    // (4) タイムスタンプ：操作直後の時刻（秒単位で一致）
    const recordTimestamp = new Date(
      targetRecord.timestamp || targetRecord.operationTime
    );
    const recordSeconds = Math.floor(recordTimestamp.getTime() / 1000);
    const operationEndSeconds = Math.floor(operationTimeEnd.getTime() / 1000);
    expect(Math.abs(recordSeconds - operationEndSeconds)).toBeLessThanOrEqual(2);

    // (5) 操作ステータス：「SUCCESS」
    expect(targetRecord.operationStatus || targetRecord.status).toBe("SUCCESS");

    // 操作内容フィールドの検証
    const operationContent =
      targetRecord.operationContent ||
      targetRecord.operationDescription ||
      targetRecord.description ||
      targetRecord.content ||
      "";
    expect(operationContent).toMatch(
      /ダッシュボード表示|画面遷移.*作業指示・実績管理画面.*進捗・人員配置ダッシュボード/
    );
  });
});