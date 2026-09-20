import { test, expect } from "@playwright/test";

test("SCEN-1429: 認証に失敗したユーザーはダッシュボード画面を表示できない", async ({
  page,
}) => {
  // Step 1: ブラウザを開き、作業指示・実績管理画面へのURLにアクセスする
  await page.goto("/panels/scr-1789461813941.html");

  // Step 2: 作業指示・実績管理画面が表示されたことを確認する
  const workInstructionTitle = page.locator("text=作業指示・実績管理");
  await expect(workInstructionTitle).toBeVisible({ timeout: 10000 });

  // Step 3: 画面上の「ダッシュボード表示」ボタン、または「進捗・人員配置ダッシュボード」への遷移リンクをクリックする
  const dashboardLink = page.locator(
    'a:has-text("進捗・人員配置ダッシュボード"), [navId*="scr-1789461783315"]'
  );
  await dashboardLink.first().click();

  // Step 4: ダッシュボード遷移時の認証処理が実行される
  // Step 5: 認証失敗の結果を待機する
  await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {
    // ページ読み込み完了を待つが、失敗時も続行
  });

  await page.waitForTimeout(1000);

  // 期待結果の検証: 進捗・人員配置ダッシュボード画面への遷移が阻止され、
  // ログイン画面、403 Forbidden 画面、または『認証に失敗しました』というエラーメッセージを表示するエラーページへリダイレクトされることを確認

  const currentUrl = page.url();

  // ログイン画面の判定（URL または 要素の存在で確認）
  const isLoginPage =
    currentUrl.includes("login") ||
    (await page
      .locator(".login-container, .login-card")
      .isVisible()
      .catch(() => false));

  // 403 Forbidden 画面の判定
  const is403Page =
    currentUrl.includes("403") ||
    (await page
      .locator("text=/403|Forbidden/i")
      .isVisible()
      .catch(() => false));

  // エラーメッセージページの判定
  const isErrorPage =
    (await page
      .locator("text=認証に失敗しました")
      .isVisible()
      .catch(() => false)) ||
    (await page
      .locator("text=/Authentication failed|認証に失敗/i")
      .isVisible()
      .catch(() => false));

  // ダッシュボードの主要コンテンツが表示されていないか確認
  const dashboardContentNotVisible =
    !(await page
      .locator('[data-testid="kpi-risk-count"]')
      .isVisible()
      .catch(() => false)) &&
    !(await page
      .locator('[data-testid="kpi-sites-action"]')
      .isVisible()
      .catch(() => false)) &&
    !(await page
      .locator('[data-testid="kpi-active-plans"]')
      .isVisible()
      .catch(() => false)) &&
    !(await page
      .locator("#site-variance-tbody")
      .isVisible()
      .catch(() => false)) &&
    !(await page
      .locator("#team-variance-tbody")
      .isVisible()
      .catch(() => false)) &&
    !(await page
      .locator("#risk-assessment-tbody")
      .isVisible()
      .catch(() => false)) &&
    !(await page
      .locator('[data-testid="active-plans-table"]')
      .isVisible()
      .catch(() => false));

  // 期待結果: ログイン画面、403 Forbidden 画面、またはエラーメッセージを表示するエラーページへリダイレクトされ、
  // ダッシュボードへのアクセスが阻止されていることを確認
  expect(
    (isLoginPage || is403Page || isErrorPage) && dashboardContentNotVisible
  ).toBeTruthy();
});