import { test, expect } from "@playwright/test";

test.describe("SCEN-986: 正常系：検証済み実績データが実績記録テーブルに保存され、画面に保存完了メッセージが表示される", () => {
  test("実績データ保存", async ({ page }) => {
    // 前提：認証済み状態で作業実績データ記録・入力画面を開く
    await page.goto("/panels/scr-1789461993203.html");
    await page.waitForLoadState("networkidle");

    // Step1: 作業実績データ記録・入力画面を開く
    await expect(page).toHaveURL(/scr-1789461993203/);

    // バックエンド側で保存前のレコード件数を取得
    const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
    const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
    const tables = await page.evaluate(() => (window as any).AIVIC_TABLES);

    let recordCountBefore = 0;
    let recordCountAfter = 0;
    let performanceTableNum: string | null = null;
    let canCheckBackend = false;

    if (apiUrl && appId && tables && tables.length > 0) {
      // 実績記録テーブルを特定
      performanceTableNum =
        tables.find(
          (t: any) => t.tableName && t.tableName.includes("performance")
        )?.tableNumber || tables[0].tableNumber;

      const responseBefore = await page.request.get(
        `${apiUrl}/api/${performanceTableNum}?app=${appId}`
      );

      if (responseBefore.ok()) {
        const dataBefore = await responseBefore.json();
        recordCountBefore = Array.isArray(dataBefore.records)
          ? dataBefore.records.length
          : 0;
        canCheckBackend = true;
      }
    }

    // Step2-3: 作業タイプ、部門、作業者名、実績数量、作業時間などの必須項目をすべて入力し、画面上に正しく表示されていることを確認
    const workTypeInput = page
      .locator('input[name="work_type"], select[name="work_type"]')
      .first();
    await workTypeInput.fill("作業タイプA");

    const departmentInput = page
      .locator('input[name="department"], select[name="department"]')
      .first();
    await departmentInput.fill("部門A");

    const workerNameInput = page.locator('input[name="worker_name"]').first();
    await workerNameInput.fill("田中太郎");

    const quantityInput = page.locator('input[name="quantity"]').first();
    await quantityInput.fill("100");

    const workTimeInput = page.locator('input[name="work_time"]').first();
    await workTimeInput.fill("8");

    // 入力値の確認
    await expect(workTypeInput).toHaveValue(/作業タイプA/);
    await expect(departmentInput).toHaveValue(/部門A/);
    await expect(workerNameInput).toHaveValue("田中太郎");
    await expect(quantityInput).toHaveValue("100");
    await expect(workTimeInput).toHaveValue("8");

    // Step4: データ検証機能を実行する
    const validateButton = page
      .locator("button")
      .filter({ hasText: /検証|バリデーション|確認/ })
      .first();
    await validateButton.click();
    await page.waitForLoadState("networkidle");

    // Step5: 検証結果が「検証済み」状態に変わったことを確認
    const validationStatus = page
      .locator(
        '[class*="validation"], [data-testid*="validation"], text=/検証済み/'
      )
      .first();
    await expect(validationStatus).toBeVisible();

    // Step6: 「保存」ボタンを押下
    const saveButton = page
      .locator("button")
      .filter({ hasText: "保存" })
      .first();
    await saveButton.click();

    // Step7: ネットワークリクエストが発生し、レスポンスが返ってくるまで待機
    await page.waitForLoadState("networkidle");

    // 期待結果: 「保存完了しました」または「実績データを保存しました」というメッセージが表示される
    const successMessage = page.locator("text=/保存完了|実績データを保存/", {
      exact: false,
    });
    await expect(successMessage).toBeVisible();

    // メッセージの消失またはOKボタンでの閉じられることを確認
    const okButton = page.locator("button").filter({ hasText: "OK" });
    const okButtonExists = (await okButton.count()) > 0;

    if (okButtonExists) {
      await okButton.click();
      // メッセージボックスが閉じられることを確認
      await expect(successMessage).not.toBeVisible({ timeout: 2000 });
    } else {
      // メッセージが3～5秒で自動的に消えることを確認
      await expect(successMessage).not.toBeVisible({ timeout: 5000 });
    }

    // 画面が保存前の状態に戻ることを確認（入力フィールドがリセットされる）
    await expect(workTypeInput).toHaveValue("");
    await expect(departmentInput).toHaveValue("");
    await expect(workerNameInput).toHaveValue("");
    await expect(quantityInput).toHaveValue("");
    await expect(workTimeInput).toHaveValue("");

    // バックエンド側でレコードが追加されたことを確認
    if (canCheckBackend && performanceTableNum) {
      // 保存後のレコード件数を取得
      const responseAfter = await page.request.get(
        `${apiUrl}/api/${performanceTableNum}?app=${appId}`
      );

      expect(responseAfter.ok()).toBeTruthy();
      const dataAfter = await responseAfter.json();
      recordCountAfter = Array.isArray(dataAfter.records)
        ? dataAfter.records.length
        : 0;

      // 新規レコードが1件追加されたことを確認
      expect(recordCountAfter).toBe(recordCountBefore + 1);

      // 最新レコードが保存したデータであることを確認
      if (Array.isArray(dataAfter.records) && dataAfter.records.length > 0) {
        const latestRecord = dataAfter.records[0];
        expect(latestRecord).toHaveProperty("worker_name");
        expect(latestRecord.worker_name).toBe("田中太郎");
      }
    } else {
      // API確認が不可能な場合、画面を再度開いて一覧に保存したデータが表示されることを確認
      await page.reload();
      await page.waitForLoadState("networkidle");

      // 一覧で保存したデータが表示されているかを確認
      const savedDataInList = page.locator("text=/田中太郎/");
      await expect(savedDataInList).toBeVisible();
    }
  });
});