import { test, expect } from "@playwright/test";

test("SCEN-875: 処理時間が負の値の場合、エラーメッセージが表示される", async ({
  page,
}) => {
  // 作業実績データ記録・入力画面を開く
  await page.goto("/panels/scr-1789461993203.html");
  await page.waitForLoadState("networkidle");

  // 新規実績データ入力フォームを表示させる
  const newDataButton = page.locator('button:has-text("新規")');
  await newDataButton.click();
  await page.waitForLoadState("networkidle");

  // 「処理時間」フィールドに負の値（例：-30）を入力する
  const processingTimeInput = page.locator('input[name="processingTime"]');
  await processingTimeInput.fill("-30");

  // フォーム内の「保存」ボタンをクリックする
  const saveButton = page.locator('button:has-text("保存")');
  await saveButton.click();

  // 画面にエラーメッセージが表示されることを確認する
  const errorMessage = page.locator(
    'text="処理時間が負の値です。データの整合性を確認してください"'
  );
  await expect(errorMessage).toBeVisible();

  // データが保存されず、フォームが入力状態のままであることを確認
  await expect(processingTimeInput).toHaveValue("-30");
});