import { test, expect } from "@playwright/test";

test.describe("SCEN-882: 実績データ記録入力 - 実行開始時刻エラー検証", () => {
  test("実行開始時刻がシステム時刻より未来の場合、エラーメッセージが表示される", async ({
    page,
  }) => {
    // 実績データ記録・入力画面を開く
    await page.goto("/panels/scr-1789461993203.html");
    await page.waitForLoadState("networkidle");

    // 現在時刻を取得
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, "0");
    const currentMinutes = String(now.getMinutes()).padStart(2, "0");
    const currentSeconds = String(now.getSeconds()).padStart(2, "0");

    // 未来時刻を生成（現在時刻より30分後）
    const futureTime = new Date(now.getTime() + 30 * 60000);
    const futureHours = String(futureTime.getHours()).padStart(2, "0");
    const futureMinutes = String(futureTime.getMinutes()).padStart(2, "0");
    const futureSeconds = String(futureTime.getSeconds()).padStart(2, "0");
    const futureTimeString = `${futureHours}:${futureMinutes}:${futureSeconds}`;

    // 実行開始時刻の入力フィールドをクリック
    const startTimeInput = page.locator('input[placeholder*="実行開始時刻"], input[name*="startTime"], input[id*="startTime"]').first();
    await startTimeInput.click();

    // 未来時刻を入力
    await startTimeInput.fill(futureTimeString);

    // 入力を確定（フォーカスを外す）
    await startTimeInput.blur();

    // エラーメッセージが表示されることを確認
    const errorMessage = page.locator(
      'text=ハンディターミナルの時刻がズレています。時刻同期を実行してください'
    );

    await expect(errorMessage).toBeVisible();
  });
});