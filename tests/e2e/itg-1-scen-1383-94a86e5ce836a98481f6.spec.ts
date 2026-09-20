import { test, expect } from "@playwright/test";

test("SCEN-1383: 承認判定の完了後、監査ログに実行者・実行時刻・操作内容が記録される", async ({
  page,
}) => {
  // ステップ1: テスト環境にログインし、管理者権限で『進捗・人員配置ダッシュボード』を開く
  await page.goto("/");
  await page.waitForURL(/panels\/scr-1789461783315\.html/);

  // ログイン画面の場合はログイン処理を実行
  const loginCard = await page.locator(".login-card").isVisible().catch(() => false);
  if (loginCard) {
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "admin_password");
    await page.click("button:has-text('ログイン')");
    await page.waitForURL(/panels\/scr-1789461783315\.html/);
  }

  // ユーザーIDを取得（ログイン情報から）
  const userId = await page.evaluate(() => (window as any).AIVIC_USER_ID || "admin");

  // ステップ2: 『人員配置最適化提案・実行画面』に遷移する
  await page.click("text=人員配置最適化提案");
  await page.waitForURL(/panels\/scr-1789461798629\.html/);

  // ステップ3: システムが生成した人員配置案を確認し、『承認』ボタンをクリックする
  await page.waitForSelector("[data-testid='approve-button']", { timeout: 10000 });
  
  // ボタンクリック時刻を記録
  const clickTime = new Date();
  await page.click("[data-testid='approve-button']");

  // ステップ4: 承認の確認ダイアログで『確定』を押下する
  await page.waitForSelector("[data-testid='approve-modal-confirm']", { timeout: 5000 });
  await page.click("[data-testid='approve-modal-confirm']");

  // ステップ5: 人員配置案の承認処理が完了し、画面に『承認が完了しました』メッセージが表示されたことを確認する
  await page.waitForSelector("[data-testid='success-banner']", { timeout: 10000 });
  const successMessage = await page.locator("[data-testid='success-banner']").textContent();
  expect(successMessage).toContain("承認が完了しました");

  // ステップ6・7: システムの監査ログテーブル（audit_log）にアクセスし、最新レコードを確認
  const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
  const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);

  const auditLogResponse = await page.request.get(
    `${apiUrl}/api/audit_log?app=${appId}&sort=-created_at&limit=1`
  );
  expect(auditLogResponse.ok()).toBeTruthy();

  const auditLogData = await auditLogResponse.json();
  const records = Array.isArray(auditLogData) ? auditLogData : auditLogData.records || [];

  expect(records.length).toBeGreaterThan(0);

  const latestRecord = records[0];
  expect(latestRecord).toBeDefined();

  // 実行者IDの確認
  expect(latestRecord.user_id).toBe(userId);

  // 操作内容の確認
  expect(latestRecord.operation).toMatch(/人員配置案承認|approve_assignment/i);

  // タイムスタンプフィールドが存在することを確認
  const timestampField = latestRecord.created_at;
  expect(timestampField).toBeDefined();

  // ISO 8601またはシステム標準形式であることを検証
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  const unixTimestampRegex = /^\d{10,13}$/;
  const timestampString = String(timestampField);
  const isValidFormat =
    iso8601Regex.test(timestampString) || unixTimestampRegex.test(timestampString);
  expect(isValidFormat).toBeTruthy();

  // タイムスタンプがボタンクリック時刻の±1秒以内であることを確認
  let recordTime: Date;
  if (iso8601Regex.test(timestampString)) {
    recordTime = new Date(timestampString);
  } else if (unixTimestampRegex.test(timestampString)) {
    const timestamp = parseInt(timestampString);
    recordTime = new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000);
  } else {
    throw new Error("Invalid timestamp format");
  }

  const timeDifferenceMs = Math.abs(recordTime.getTime() - clickTime.getTime());
  expect(timeDifferenceMs).toBeLessThanOrEqual(1000);
});