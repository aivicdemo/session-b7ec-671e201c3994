import { test, expect } from "@playwright/test";

test("作業指示の受領履歴が取得され、受領確認状態が画面に反映される", async ({
  page,
}) => {
  // ログイン画面へ遷移
  await page.goto("/");

  // ログイン処理
  await page.fill('input[placeholder*="ユーザーID"]', "testuser");
  await page.fill('input[placeholder*="パスワード"]', "testpass");
  await page.click("button:has-text('ログイン')");

  // ログイン後の自動遷移を待つ
  await page.waitForURL("**/panels/scr-1789461783315.html");

  // 作業指示・実績管理画面へ遷移
  await page.click("nav a:has-text('作業指示・実績管理')");
  await page.waitForURL("**/panels/scr-1789461813941.html");

  // 画面が読み込まれるまで待機
  await page.waitForSelector("[data-testid='work-instruction-list']");

  // 作業指示一覧テーブルから『INST-20250115-001』を検索
  const workInstructionTable = page.locator("#work-instruction-tbody tr");

  // テーブル内で該当する行を探す
  let targetRow = null;
  const rowCount = await workInstructionTable.count();

  for (let i = 0; i < rowCount; i++) {
    const row = workInstructionTable.nth(i);
    const rowText = await row.textContent();

    if (rowText?.includes("INST-20250115-001")) {
      targetRow = row;
      break;
    }
  }

  // 見つからない場合はスクロールして検索
  if (!targetRow) {
    await page.locator("#work-instruction-tbody").scrollIntoViewIfNeeded();
    const allRows = await page.locator("#work-instruction-tbody tr").all();

    for (const row of allRows) {
      const text = await row.textContent();
      if (text?.includes("INST-20250115-001")) {
        targetRow = row;
        break;
      }
    }
  }

  // 対象行が見つかったことを確認
  expect(targetRow).toBeTruthy();

  // 作業指示一覧の『受領状態』カラムを確認
  const receiptStatusInList = await targetRow?.textContent();
  expect(receiptStatusInList).toContain("受領確認済み");

  // 作業指示一覧の『受領タイムスタンプ』カラムを確認
  expect(receiptStatusInList).toContain("2025-01-15 09:45:30");
});