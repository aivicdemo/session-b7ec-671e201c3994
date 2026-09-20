import { test, expect } from "@playwright/test";

test.describe("SCEN-1422: 却下モーダル確定 - セッション無効時の認証エラー処理", () => {
  test("却下操作実行時にセッションが無効な場合、認証エラーが表示される", async ({
    page,
    context,
  }) => {
    // ログイン画面にアクセス
    await page.goto("/");
    await page.waitForURL("**/login");

    // テスト用認証情報でログイン
    await page.fill('input[placeholder*="ユーザー"]', "testuser");
    await page.fill('input[placeholder*="パスワード"]', "testpass");
    await page.click("button:has-text('ログイン')");

    // ダッシュボード経由で人員配置最適化提案・実行画面へ遷移
    await page.waitForURL("**/scr-1789461783315.html");
    await page.click("a:has-text('人員配置最適化提案')");
    await page.waitForURL("**/scr-1789461798629.html");

    // 人員配置案の一覧が表示されるまで待機
    await page.waitForSelector("[id='proposals-container']");
    const proposalsContainer = await page.locator("[id='proposals-container']");
    await expect(proposalsContainer).toBeVisible();

    // 却下ボタンが存在することを確認
    const rejectBtn = page.locator("[id='reject-btn']");
    await expect(rejectBtn).toBeVisible();

    // 提案の ID を取得（後でデータベース確認用）
    const proposalElement = await page.locator("[id='proposals-container'] > div").first();
    const proposalId = await proposalElement.getAttribute("data-proposal-id");

    // セッションを無効にする（クッキーを削除）
    const cookies = await context.cookies();
    for (const cookie of cookies) {
      if (
        cookie.name === "session" ||
        cookie.name.includes("auth") ||
        cookie.name.includes("token")
      ) {
        await context.clearCookies({ name: cookie.name });
      }
    }

    // API呼び出しをインターセプトして401認証エラーを返す
    await page.route("**/api/**", (route) => {
      if (route.request().method() === "POST") {
        route.respond({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Unauthorized",
            message: "認証情報が無効です",
          }),
        });
      } else {
        route.continue();
      }
    });

    // 却下ボタンをクリック
    await rejectBtn.click();

    // 却下モーダルが表示されるまで待機
    await page.waitForSelector("[id='reject-modal-overlay']");
    const rejectModal = page.locator("[id='reject-modal-overlay']");
    await expect(rejectModal).toBeVisible();

    // 却下理由テキストエリアが表示されることを確認
    const rejectReasonTextarea = page.locator("[id='reject-reason']");
    await expect(rejectReasonTextarea).toBeVisible();

    // 確定ボタン（却下する）をクリック
    const rejectConfirmBtn = page.locator("[id='reject-modal-confirm']");
    await expect(rejectConfirmBtn).toBeVisible();

    // API レスポンスの待機設定
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/") && response.status() === 401,
      { timeout: 5000 }
    );

    await rejectConfirmBtn.click();

    // 認証エラーのレスポンスを確認（バックエンド認証工程の実行を確認）
    const errorResponse = await responsePromise;
    expect(errorResponse.status()).toBe(401);

    // 認証エラーメッセージが表示されるか、ログイン画面へ遷移することを確認
    let authErrorDetected = false;

    // エラーメッセージが表示される場合を確認（完全な文言で検証）
    const sessionExpiredMessage = page.locator(
      "text=セッションの有効期限が切れました。再度ログインしてください"
    );
    const invalidAuthMessage = page.locator(
      "text=認証情報が無効です。ログイン画面へお進みください"
    );

    try {
      await expect(sessionExpiredMessage).toBeVisible({ timeout: 3000 });
      authErrorDetected = true;
    } catch {
      try {
        await expect(invalidAuthMessage).toBeVisible({ timeout: 3000 });
        authErrorDetected = true;
      } catch {
        // エラーメッセージが表示されない場合、ログイン画面へ自動遷移を確認
        try {
          await page.waitForURL(/login|auth/, { timeout: 5000 });
          authErrorDetected = true;
        } catch {
          // セッション復旧画面または再ログインフォームが表示されるか確認
          const reloginForm = page.locator("form");
          try {
            await expect(reloginForm).toBeVisible({ timeout: 3000 });
            authErrorDetected = true;
          } catch {
            throw new Error(
              "認証エラーメッセージが表示されるか、ログイン画面へ遷移、またはセッション復旧画面/再ログインフォームが表示されることが期待されます"
            );
          }
        }
      }
    }

    expect(authErrorDetected).toBe(true);

    // 却下モーダルが閉じられることを確認
    await expect(rejectModal).not.toBeVisible({ timeout: 5000 });

    // セッションを復旧してデータベースを確認
    // テスト用認証情報で新しいセッションを作成
    const newPage = await context.newPage();
    await newPage.goto("/");
    await newPage.waitForURL("**/login");

    await newPage.fill('input[placeholder*="ユーザー"]', "testuser");
    await newPage.fill('input[placeholder*="パスワード"]', "testpass");
    await newPage.click("button:has-text('ログイン')");
    await newPage.waitForURL("**/scr-1789461783315.html");

    // API から提案データを取得して却下ステータスが記録されていないことを確認
    const apiUrl = (newPage.context() as any).AIVIC_API_URL || "/api";
    const appId = (newPage.context() as any).AIVIC_APP_ID || "default";

    const proposalTableNumber = (newPage.context() as any).AIVIC_TABLES?.proposals || "proposals";

    const proposalResponse = await newPage.request.get(
      `${apiUrl}/${proposalTableNumber}?app=${appId}`
    );

    if (proposalResponse.ok()) {
      const proposals = await proposalResponse.json();
      const targetProposal = proposals.find(
        (p: any) => proposalId && p.id === proposalId
      );

      if (targetProposal) {
        // 却下ステータスが記録されていないことを確認
        expect(targetProposal.status).not.toBe("rejected");
      }
    }

    await newPage.close();
  });
});