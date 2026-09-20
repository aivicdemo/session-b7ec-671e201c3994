import { test, expect } from "@playwright/test";

test.describe("人員配置最適化提案画面遷移（実績管理画面から）", () => {
  let apiUrl: string;
  let appId: string;
  let userId: string;
  let auditLogTableId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.goto("http://localhost:3000");

    apiUrl =
      (await page.evaluate(() => (window as any).AIVIC_API_URL)) ||
      "http://localhost:3000/api";
    appId =
      (await page.evaluate(() => (window as any).AIVIC_APP_ID)) || "app-001";

    const tables = await page.evaluate(() => (window as any).AIVIC_TABLES);
    auditLogTableId =
      tables?.find((t: any) => t.tableName === "audit_log")?.id ||
      "tbl-audit-log";

    await context.close();
  });

  test("遅延リスク情報生成後、画面遷移操作が監査ログに記録される", async ({
    page,
  }) => {
    // テスト前準備：監査ログテーブルを初期化
    const initResponse = await page.request.get(
      `${apiUrl}/${auditLogTableId}?app=${appId}`
    );
    const allRecords = await initResponse.json();

    // 既存レコードを削除
    if (Array.isArray(allRecords) && allRecords.length > 0) {
      for (const record of allRecords) {
        await page.request.delete(
          `${apiUrl}/${auditLogTableId}/${record.id}?app=${appId}`
        );
      }
    }

    // 作業指示・実績管理画面にログイン直後の状態で遷移
    await page.goto("http://localhost:3000/panels/scr-1789461813941.html");

    // ログイン画面が表示されている場合はログイン処理
    const loginForm = page.locator(".login-form");
    if (await loginForm.isVisible()) {
      await page.fill('input[placeholder*="ユーザーID"]', "testuser");
      await page.fill('input[placeholder*="パスワード"]', "testpass");
      await page.click(".login-button");
      await page.waitForNavigation();
    }

    // ユーザーID取得（セッションストレージまたはローカルストレージから）
    userId =
      (await page.evaluate(() => {
        return (
          sessionStorage.getItem("userId") ||
          localStorage.getItem("userId") ||
          (window as any).currentUserId ||
          "testuser"
        );
      })) || "testuser";

    // WMS から進捗データが正常に取得され、画面に進捗情報が表示されていることを確認
    const workerSummaryList = page.locator("#worker-summary-list");
    await expect(workerSummaryList).toBeVisible();

    // WMS通信の成功を確認：進捗情報がAPI経由で取得されたことを検証
    const wmsLogTab = page.locator('[data-testid="tab-wms"]');
    await wmsLogTab.click();
    await page.waitForTimeout(500);

    const wmsLogContent = page.locator("#tab-wms-content");
    await expect(wmsLogContent).toBeVisible();

    const wmsLogTable = page.locator("#wms-log-tbody");
    const wmsLogRows = wmsLogTable.locator("tr");
    const wmsLogCount = await wmsLogRows.count();
    expect(wmsLogCount).toBeGreaterThan(0);

    // 進捗情報（進捗率 75% など）が画面に表示されていることを確認
    const progressInfo = page.locator("text=/進捗率.*75%/");
    await expect(progressInfo).toBeVisible({ timeout: 5000 });

    // 画面上の「進捗分析実行」ボタンをクリック
    const analyzeButton = page.locator('button:has-text("進捗分析実行")');
    await expect(analyzeButton).toBeVisible();
    await analyzeButton.click();
    await page.waitForTimeout(2000);

    // 遅延リスク情報が画面に表示されることを確認（例：「納期遅延リスク：高（65%）」）
    const riskInfo = page.locator("text=/納期遅延リスク.*高.*65%|遅延確率.*65%/");
    await expect(riskInfo).toBeVisible({ timeout: 5000 });

    // 画面上の「人員配置最適化提案・実行画面へ遷移」リンク/ボタンをクリック
    const transitionButton = page.locator(
      'a:has-text("人員配置最適化提案"), button:has-text("人員配置最適化提案")'
    );
    await expect(transitionButton).toBeVisible();
    await transitionButton.click();

    // 人員配置最適化提案・実行画面への遷移が完了することを確認
    await page.waitForURL(/scr-1789461798629|人員配置最適化提案/, {
      timeout: 5000,
    });
    const pageTitle = page.locator("h1, h2, .page-title");
    const titleText = await pageTitle.first().textContent();
    expect(titleText).toMatch(/人員配置|最適化提案/);

    await page.waitForTimeout(1000);

    // 監査ログテーブルから全レコードを取得
    const allAuditRecords = await page.request.get(
      `${apiUrl}/${auditLogTableId}?app=${appId}`
    );
    const auditData = await allAuditRecords.json();
    const auditRecordsArray = Array.isArray(auditData) ? auditData : [];

    // 2 つ以上のレコードが記録されていることを確認
    expect(auditRecordsArray.length).toBeGreaterThanOrEqual(2);

    // RISK_ANALYSIS_EXECUTED レコードを検索
    const riskRecord = auditRecordsArray.find(
      (r) =>
        r.eventType === "RISK_ANALYSIS_EXECUTED" ||
        r.イベント種別 === "RISK_ANALYSIS_EXECUTED"
    );

    // SCREEN_TRANSITION レコードを検索
    const transitionRecord = auditRecordsArray.find(
      (r) =>
        r.eventType === "SCREEN_TRANSITION" ||
        r.イベント種別 === "SCREEN_TRANSITION"
    );

    // 両レコードが存在することを確認
    expect(riskRecord).toBeDefined();
    expect(transitionRecord).toBeDefined();

    // RISK_ANALYSIS_EXECUTED レコードの検証
    const riskEventType =
      riskRecord?.eventType || riskRecord?.イベント種別;
    const riskUserId = riskRecord?.userId || riskRecord?.ユーザーID;
    const riskDetails = riskRecord?.details || riskRecord?.詳細情報;
    const riskTimestamp =
      riskRecord?.timestamp || riskRecord?.タイムスタンプ;

    expect(riskEventType).toBe("RISK_ANALYSIS_EXECUTED");
    expect(riskUserId).toBe(userId);
    // 詳細情報に「リスク分析実行完了、遅延確率 65%」が完全に含まれていることを確認
    expect(riskDetails).toContain("リスク分析実行完了");
    expect(riskDetails).toContain("遅延確率");
    expect(riskDetails).toContain("65%");
    expect(riskDetails).toMatch(/リスク分析実行完了.*遅延確率.*65%/);

    // SCREEN_TRANSITION レコードの検証
    const transitionEventType =
      transitionRecord?.eventType || transitionRecord?.イベント種別;
    const transitionUserId =
      transitionRecord?.userId || transitionRecord?.ユーザーID;
    const transitionFromScreen =
      transitionRecord?.fromScreen || transitionRecord?.遷移元画面;
    const transitionToScreen =
      transitionRecord?.toScreen || transitionRecord?.遷移先画面;
    const transitionDetails =
      transitionRecord?.details || transitionRecord?.詳細情報;
    const transitionTimestamp =
      transitionRecord?.timestamp || transitionRecord?.タイムスタンプ;

    expect(transitionEventType).toBe("SCREEN_TRANSITION");
    expect(transitionUserId).toBe(userId);
    // 遷移元画面が「作業指示・実績管理画面」と完全一致することを確認
    expect(transitionFromScreen).toBe("作業指示・実績管理画面");
    // 遷移先画面が「人員配置最適化提案・実行画面」と完全一致することを確認
    expect(transitionToScreen).toBe("人員配置最適化提案・実行画面");
    // 詳細情報に「遅延リスク生成後の遷移操作」が含まれていることを確認
    expect(transitionDetails).toBe("遅延リスク生成後の遷移操作");

    // タイムスタンプの秒単位での差異確認：レコード1がレコード2より先行していることを確認
    const riskTimestampSeconds = Math.floor(
      new Date(riskTimestamp).getTime() / 1000
    );
    const transitionTimestampSeconds = Math.floor(
      new Date(transitionTimestamp).getTime() / 1000
    );

    expect(transitionTimestampSeconds).toBeGreaterThan(riskTimestampSeconds);
  });
});