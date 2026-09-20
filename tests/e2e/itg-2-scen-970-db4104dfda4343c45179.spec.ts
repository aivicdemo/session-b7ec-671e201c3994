import { test, expect, Page } from "@playwright/test";

test("SCEN-970: 実績データ保存時に、指定作業者の当該日付における配置計画が参照可能になる", async ({
  page,
}) => {
  // 前提: 作業実績データ記録・入力画面にアクセス
  await page.goto("/panels/scr-1789461993203.html");
  await page.waitForLoadState("networkidle");

  // Step 1: 作業実績データ記録・入力画面にアクセス
  await expect(page).toHaveURL(/scr-1789461993203/);

  // Step 2: 作業者一覧から対象作業者（例：作業者ID：A001）を選択
  const workerSelect = page.locator("select[name='worker'], input[placeholder*='作業者']").first();
  await workerSelect.click();
  await page.locator("text=A001").click();

  // Step 3: 当該日付（例：2024年1月15日）を指定
  const dateInput = page.locator("input[type='date']").first();
  await dateInput.fill("2024-01-15");

  // Step 4: 作業タイプ（例：ピッキング）と部門（例：入荷部門）を選択
  const taskTypeSelect = page.locator("select[name='taskType'], input[placeholder*='作業タイプ']").first();
  await taskTypeSelect.click();
  await page.locator("text=ピッキング").click();

  const departmentSelect = page.locator("select[name='department'], input[placeholder*='部門']").first();
  await departmentSelect.click();
  await page.locator("text=入荷部門").click();

  // Step 5: 実績データ（例：処理件数：150件、所要時間：480分）を入力フォームに記入
  const itemCountInput = page.locator("input[name*='count'], input[placeholder*='処理件数']").first();
  await itemCountInput.fill("150");

  const timeInput = page.locator("input[name*='time'], input[placeholder*='所要時間']").first();
  await timeInput.fill("480");

  // Step 6: 保存ボタンをクリックしてデータを送信
  const saveButton = page.locator("button:has-text('保存'), button[type='submit']").first();
  await saveButton.click();

  // Step 7: 保存完了のメッセージが画面に表示されることを確認
  await expect(page.locator("text=/保存|完了|成功/")).toBeVisible({ timeout: 5000 });

  // Step 8: 生産性ダッシュボード・分析画面に遷移
  await page.goto("/panels/scr-1789461964046.html");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/scr-1789461964046/);

  // Step 9: 作業者一覧から同じ対象作業者（A001）を検索・選択
  const dashboardWorkerSelect = page.locator("select[name='worker'], input[placeholder*='作業者']").first();
  await dashboardWorkerSelect.click();
  await page.locator("text=A001").click();

  // Step 10: 当該日付（2024年1月15日）のデータを表示
  const dashboardDateInput = page.locator("input[type='date']").first();
  await dashboardDateInput.fill("2024-01-15");

  // 期待結果: 配置計画（割当工程・割当時間帯・期待処理件数など）が初期割当結果として表示される
  // 割当工程、割当時間帯、期待処理件数などの要素が表示されることを確認
  await expect(
    page.locator("text=/割当工程/")
  ).toBeVisible({ timeout: 5000 });

  await expect(
    page.locator("text=/割当時間帯/")
  ).toBeVisible({ timeout: 5000 });

  await expect(
    page.locator("text=/期待処理件数/")
  ).toBeVisible({ timeout: 5000 });

  // 期待結果: 保存した実績データ（処理件数：150件、所要時間：480分）も同一画面内で確認可能
  // 実績データとして処理件数と所要時間が表示されることを確認
  await expect(
    page.locator("text=/150件/")
  ).toBeVisible({ timeout: 5000 });

  await expect(
    page.locator("text=/480分/")
  ).toBeVisible({ timeout: 5000 });
});