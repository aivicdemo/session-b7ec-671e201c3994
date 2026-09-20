import { test, expect } from "@playwright/test";

test("SCEN-1124: 配置変更の実行日時・変更前後の配置計画ID・部門ID・作業タイプID・変更理由・実行者が履歴テーブルに記録される", async ({
  page,
}) => {
  // ログイン処理
  await page.goto("/");
  await page.fill('input[placeholder*="ユーザー"]', "testuser");
  await page.fill('input[placeholder*="パスワード"]', "testpass");
  await page.click("button:has-text('ログイン')");
  await page.waitForURL(/.*panels.*/);

  // 最適人員配置案提案・実行画面を開く
  await page.goto("/panels/scr-1789461978707.html");
  await page.waitForLoadState("networkidle");

  // 配置案一覧から実行対象の配置案を選択
  const placementPlanId = "PLAN-20250115-001";
  await page.click(`text="${placementPlanId}"`);
  await page.waitForLoadState("networkidle");

  // 詳細情報を確認（変更前）
  await expect(page.locator('text=D001')).toBeVisible();
  await expect(page.locator('text=WK-PICK')).toBeVisible();
  await expect(
    page.locator('text=習熟度向上に伴う効率化')
  ).toBeVisible();

  // 変更後の配置内容を確認
  await expect(page.locator('text=D002')).toBeVisible();

  // 実行ボタンをクリック
  const executeButton = page.locator('button:has-text("実行")');
  await executeButton.click();

  // 成功メッセージを確認
  await expect(
    page.locator('text=配置変更の実行が完了しました')
  ).toBeVisible();

  // API呼び出しログを取得
  const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
  const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);

  // 履歴テーブルから最新レコードを取得
  const historyResponse = await page.request.get(
    `${apiUrl}/api/placement_change_history?app=${appId}&limit=1&sort=-created_at`
  );
  const historyData = await historyResponse.json();

  // 期待されるレコードを検証
  const latestRecord = historyData.records[0];

  expect(latestRecord).toBeDefined();
  expect(latestRecord.placement_plan_id_before).toBe(placementPlanId);
  expect(latestRecord.placement_plan_id_after).toBe("PLAN-20250115-002");
  expect(latestRecord.department_id_before).toBe("D001");
  expect(latestRecord.department_id_after).toBe("D002");
  expect(latestRecord.work_type_id).toBe("WK-PICK");
  expect(latestRecord.change_reason).toBe("習熟度向上に伴う効率化");
  expect(latestRecord.executed_by).toBeDefined();

  // 実行日時が現在日時付近であることを確認
  const executedAt = new Date(latestRecord.executed_at);
  const now = new Date();
  const timeDiff = Math.abs(now.getTime() - executedAt.getTime());
  expect(timeDiff).toBeLessThan(60000); // 1分以内
});