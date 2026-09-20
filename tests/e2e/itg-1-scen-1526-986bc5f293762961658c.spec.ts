import { test, expect } from "@playwright/test";

test("WMS連携ログ表示タブへのアクセスが監査ログに記録される", async ({
  page,
}) => {
  const baseURL = "http://localhost:3000";

  // ステップ1: 管理者ユーザーでシステムにログインする
  await page.goto(`${baseURL}/`);

  const loginForm = page.locator(".login-form");
  let loginUserId: string | null = null;

  if (await loginForm.isVisible()) {
    loginUserId = "admin";
    await page.fill('input[type="text"]', loginUserId);
    await page.fill('input[type="password"]', "admin123");
    await page.click(".login-button");
    await page.waitForURL("**/panels/scr-1789461783315.html");
    await page.waitForLoadState("networkidle");
  } else {
    // ログイン画面がスキップされた場合、ページから実際のユーザー情報を取得
    await page.waitForURL("**/panels/scr-1789461783315.html");
    await page.waitForLoadState("networkidle");
    loginUserId = await page.evaluate(() => {
      return (window as any).AIVIC_USER_ID || (window as any).userId || "admin";
    });
  }

  // ステップ2: 進捗・人員配置ダッシュボード画面を開く
  await page.goto(`${baseURL}/panels/scr-1789461783315.html`);
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/scr-1789461783315/);

  // API接続情報を取得
  const apiUrl = await page.evaluate(() => {
    return (window as any).AIVIC_API_URL;
  });
  const appId = await page.evaluate(() => {
    return (window as any).AIVIC_APP_ID;
  });
  const tables = await page.evaluate(() => {
    return (window as any).AIVIC_TABLES;
  });

  // 監査ログテーブル番号を取得
  let auditLogTableNumber = "audit_logs";
  if (tables && tables.audit_logs) {
    auditLogTableNumber = tables.audit_logs;
  }

  // 監査ログ取得前の時刻を記録
  const timestampBeforeTabClick = new Date();

  // ステップ3: 画面上部のタブ群から「WMS連携ログ」タブを選択してクリックする
  const wmsTab = page.locator('[data-testid="tab-wms"]');
  await expect(wmsTab).toBeVisible();
  await wmsTab.click();

  const timestampAfterTabClick = new Date();

  // ステップ4: WMS連携ログ表示タブが正常に遷移・表示されたことを確認する
  const wmsLogContent = page.locator("#tab-wms-content");
  await expect(wmsLogContent).toBeVisible();
  const wmsLogList = page.locator('[data-testid="wms-log-list"]');
  await expect(wmsLogList).toBeVisible();

  // ステップ5: ブラウザの開発者ツール、またはシステムの管理画面から監査ログテーブルを確認する
  // タブ表示完了直後に監査ログを取得（非同期処理を考慮して数秒以内にポーリング）
  let auditLogData: any = null;
  let wmsTabAccessRecord: any = null;
  const maxWaitTime = 5000; // 最大5秒待機
  const pollInterval = 500; // 500msごとにポーリング
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const auditLogResponse = await page.request.get(
      `${apiUrl}/api/${auditLogTableNumber}?app=${appId}`
    );
    auditLogData = await auditLogResponse.json();

    const records = Array.isArray(auditLogData.records)
      ? auditLogData.records
      : auditLogData.data || [];

    // タブアクセスに対応する監査ログレコードを特定
    // 時間窓: タブクリック時刻を基準に±5秒
    wmsTabAccessRecord = records.find((record: any) => {
      const isWmsTabAccess =
        (record.operation_type === "TAB_ACCESS" ||
          record.action_type === "TAB_ACCESS" ||
          record.operation === "TAB_ACCESS") &&
        (record.target === "WMS_INTEGRATION_LOG" ||
          record.resource_type === "WMS_INTEGRATION_LOG" ||
          record.target_resource === "WMS_INTEGRATION_LOG" ||
          record.resource === "WMS_INTEGRATION_LOG");

      const recordTimestamp = new Date(record.timestamp).getTime();
      const isWithinTimeWindow =
        recordTimestamp >= timestampBeforeTabClick.getTime() - 5000 &&
        recordTimestamp <= timestampAfterTabClick.getTime() + 5000;

      return isWmsTabAccess && isWithinTimeWindow;
    });

    if (wmsTabAccessRecord) {
      break;
    }

    await page.waitForTimeout(pollInterval);
  }

  expect(wmsTabAccessRecord).toBeTruthy();
  expect(wmsTabAccessRecord).not.toBeNull();

  // （1）ログレコードのタイムスタンプが現在時刻±5秒以内である
  const now = new Date().getTime();
  const recordTimestamp = new Date(wmsTabAccessRecord.timestamp).getTime();
  const timeDifference = Math.abs(now - recordTimestamp);
  expect(timeDifference).toBeLessThanOrEqual(5000);

  // （2）操作ユーザーのユーザーIDが正確に記録されている
  expect(wmsTabAccessRecord.user_id).toBeTruthy();
  expect(wmsTabAccessRecord.user_id).toBe(loginUserId);

  // （3）操作種別が「TAB_ACCESS」または同等の値として記録されている
  expect(
    wmsTabAccessRecord.operation_type === "TAB_ACCESS" ||
      wmsTabAccessRecord.action_type === "TAB_ACCESS" ||
      wmsTabAccessRecord.operation === "TAB_ACCESS"
  ).toBeTruthy();

  // （4）操作対象が「WMS_INTEGRATION_LOG」または同等の値として記録されている
  expect(
    wmsTabAccessRecord.target === "WMS_INTEGRATION_LOG" ||
      wmsTabAccessRecord.resource_type === "WMS_INTEGRATION_LOG" ||
      wmsTabAccessRecord.target_resource === "WMS_INTEGRATION_LOG" ||
      wmsTabAccessRecord.resource === "WMS_INTEGRATION_LOG"
  ).toBeTruthy();

  // （5）画面遷移前のリファラ（進捗・人員配置ダッシュボード画面）が記録されている
  const hasReferrer =
    wmsTabAccessRecord.referrer?.includes("scr-1789461783315") ||
    wmsTabAccessRecord.source_page?.includes("scr-1789461783315") ||
    wmsTabAccessRecord.previous_url?.includes("scr-1789461783315") ||
    wmsTabAccessRecord.referer?.includes("scr-1789461783315") ||
    wmsTabAccessRecord.from_page?.includes("scr-1789461783315");

  expect(hasReferrer).toBeTruthy();

  // （6）記録の作成完了がタブ表示の前に完了している（非同期処理の場合は数秒以内に完了する）
  // 監査ログレコードのタイムスタンプがタブクリック～タブ表示完了+数秒までの間に作成されたことを確認
  const recordTime = new Date(wmsTabAccessRecord.timestamp).getTime();
  expect(recordTime).toBeGreaterThanOrEqual(
    timestampBeforeTabClick.getTime()
  );
  expect(recordTime).toBeLessThanOrEqual(
    timestampAfterTabClick.getTime() + 5000
  );
});