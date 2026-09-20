import { test, expect } from "@playwright/test";

test("SCEN-973: 認証されていないユーザーが実績データ入力画面を操作すると、以降の処理が実行されない", async ({
  browser,
  baseURL,
}) => {
  // Step 1: ブラウザを開き、作業実績データ記録・入力画面のURLにアクセスする
  const context1 = await browser.createContext();
  const page1 = context1.newPage();
  await page1.goto(`${baseURL}/panels/scr-1789461993203.html`);

  // Step 2: ログイン画面が表示されたことを確認し、ページを閉じるか別タブで遷移して認証状態を解除する
  await expect(page1).toHaveURL(/.*login|auth/i);
  const loginTitle = page1.locator("text=ログイン");
  await expect(loginTitle).toBeVisible();

  // ページを閉じて認証状態を解除
  await page1.close();
  await context1.close();

  // Step 3: 認証なしの状態で作業実績データ記録・入力画面のURLに直接アクセスする
  const context2 = await browser.createContext();
  const page2 = context2.newPage();

  // 保存前のデータベース記録件数を取得
  const apiUrl = await page2.evaluate(() => window.AIVIC_API_URL);
  const appId = await page2.evaluate(() => window.AIVIC_APP_ID);
  
  let recordsBeforeOperation = 0;
  try {
    const response = await page2.request.get(`${apiUrl}/api/実績?app=${appId}`);
    if (response.ok()) {
      const data = await response.json();
      recordsBeforeOperation = Array.isArray(data) ? data.length : 0;
    }
  } catch (e) {
    // API呼び出し失敗時は0とする
    recordsBeforeOperation = 0;
  }

  // POST呼び出しを監視
  let postResponseStatus = null;
  page2.on("response", (response) => {
    if (
      response.url().includes("/api/") &&
      response.request().method() === "POST"
    ) {
      postResponseStatus = response.status();
    }
  });

  await page2.goto(`${baseURL}/panels/scr-1789461993203.html`, {
    waitUntil: "domcontentloaded",
  });

  // Step 4: ページが読み込まれたら、実績データ入力フォーム上の任意の入力項目（例：作業タイプ選択ドロップダウン）をクリックする
  const inputField = page2.locator("input, textarea, select").first();
  await inputField.click();

  // Step 5: 入力フォームに値を入力し、保存ボタンをクリックする
  await inputField.fill("テスト");

  const saveButton = page2
    .locator("button:has-text('保存'), button[type='submit']")
    .first();
  await saveButton.click();

  // Expected Result: 保存ボタンクリック後、画面がログイン画面にリダイレクトされる
  await expect(page2).toHaveURL(/.*login|auth/i);

  // ログイン画面のメッセージを確認（認証が必要 または セッションが無効）
  const authMessage = page2.locator(
    "text=/認証が必要です|セッションが無効です/i"
  );
  await expect(authMessage).toBeVisible();

  // ログイン画面が表示されていることを確認
  const loginPageTitle = page2.locator("text=ログイン");
  await expect(loginPageTitle).toBeVisible();

  // 保存後、データベースに記録されていないことを確認
  await page2.waitForTimeout(1000);
  
  let recordsAfterOperation = 0;
  try {
    const response = await page2.request.get(`${apiUrl}/api/実績?app=${appId}`);
    if (response.ok()) {
      const data = await response.json();
      recordsAfterOperation = Array.isArray(data) ? data.length : 0;
    }
  } catch (e) {
    recordsAfterOperation = 0;
  }

  // 記録件数が増えていないことを確認
  expect(recordsAfterOperation).toBe(recordsBeforeOperation);

  // POST処理が実行されていない、またはエラーレスポンスが返されていることを確認
  if (postResponseStatus !== null) {
    expect([401, 403, 302, 307]).toContain(postResponseStatus);
  }

  await context2.close();
});