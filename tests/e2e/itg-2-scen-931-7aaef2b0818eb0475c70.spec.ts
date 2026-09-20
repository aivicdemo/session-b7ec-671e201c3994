import { test, expect } from "@playwright/test";

test.describe("配置案確認完了", () => {
  test("確認対象の配置案が現在の状態で確認前の状態でない場合、操作が拒否される", async ({
    browser,
  }) => {
    // ログイン処理
    const context1 = await browser.newContext();
    const page1 = context1.createPage();
    await page1.goto("/");

    // ログイン
    await page1.fill('input[placeholder*="ユーザー"]', "testuser");
    await page1.fill('input[placeholder*="パスワード"]', "testpass");
    await page1.click("button:has-text('ログイン')");
    await page1.waitForURL("**/panels/**");

    // 最適人員配置案提案・実行画面に移動
    await page1.goto("/panels/scr-1789461978707.html");
    await page1.waitForLoadState("networkidle");

    // 確認待ちの配置案を選択
    const proposalItem = page1.locator("[data-status='待機中']").first();
    await proposalItem.click();
    await page1.waitForLoadState("networkidle");

    // 配置案の詳細ページを開き、「確認開始」ボタンをクリック
    const startReviewButton = page1.locator("button:has-text('確認開始')");
    await startReviewButton.click();
    await page1.waitForLoadState("networkidle");

    // ステータスが「確認中」と表示されていることを確認
    await expect(
      page1.locator("[data-status='確認中']")
    ).toBeVisible();

    // 別のブラウザコンテキスト（セッション）から同じ配置案に対して「確認完了」操作を実行
    const context2 = await browser.newContext();
    const page2 = context2.createPage();
    await page2.goto("/");

    // ログイン
    await page2.fill('input[placeholder*="ユーザー"]', "testuser");
    await page2.fill('input[placeholder*="パスワード"]', "testpass");
    await page2.click("button:has-text('ログイン')");
    await page2.waitForURL("**/panels/**");

    // 最適人員配置案提案・実行画面に移動
    await page2.goto("/panels/scr-1789461978707.html");
    await page2.waitForLoadState("networkidle");

    // 同じ配置案を選択
    const proposalItem2 = page2.locator("[data-status='確認中']").first();
    await proposalItem2.click();
    await page2.waitForLoadState("networkidle");

    // 「確認完了」ボタンをクリック
    const completeReviewButton2 = page2.locator(
      "button:has-text('確認完了')"
    );
    await completeReviewButton2.click();
    await page2.waitForLoadState("networkidle");

    // 元のセッション・タブから、当該配置案の「確認完了」ボタンをクリック
    const completeReviewButton1 = page1.locator(
      "button:has-text('確認完了')"
    );
    await completeReviewButton1.click();
    await page1.waitForLoadState("networkidle");

    // エラーメッセージが表示されていることを確認
    const errorMessage = page1.locator(
      "text=この配置案は既に別の操作が行われています。ページをリロードしてください。"
    );
    await expect(errorMessage).toBeVisible();

    // 配置案のステータスが「確認中」のままであることを確認
    await expect(
      page1.locator("[data-status='確認中']")
    ).toBeVisible();

    // 「確認完了」に更新されていないことを確認
    const completedStatus = page1.locator("[data-status='確認完了']");
    await expect(completedStatus).not.toBeVisible();

    // クリーンアップ
    await page1.close();
    await page2.close();
    await context1.close();
    await context2.close();
  });
});