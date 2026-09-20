import { test, expect } from "@playwright/test";

test("SCEN-838: 認証済みユーザーがダッシュボード表示アクションの実行権限を持つ場合、権限検証を通過して後続処理へ進む", async ({
  page,
}) => {
  // ステップ1: 認証済みユーザー（権限：ダッシュボード表示可能）でシステムにログインする
  await page.goto("/");

  // ログイン画面が表示されるまで待機
  await page.waitForLoadState("domcontentloaded");

  // ログイン形式を検出（フォームベースのログインと仮定）
  const userIdInput = page
    .locator(
      'input[type="text"], input[placeholder*="ユーザー"], input[placeholder*="ID"]'
    )
    .first();
  const passwordInput = page.locator('input[type="password"]').first();
  const loginButton = page
    .locator('button:has-text("ログイン"), button[type="submit"]')
    .first();

  // ダッシュボード表示権限を持つユーザーでログイン
  await userIdInput.fill("dashboard_user");
  await passwordInput.fill("password123");
  await loginButton.click();

  // ログイン後の自動遷移を待機
  await page.waitForLoadState("networkidle");

  // ステップ2: 生産性ダッシュボード・分析画面へのアクセスを試行する
  // ステップ3 & 4: 権限検証処理が実行され、バックエンド認可サービスに照会される
  let authorizationResponse = null;

  const responsePromise = page.waitForResponse((response) => {
    const url = response.url();
    return (
      url.includes("/api/") &&
      (url.includes("permission") ||
        url.includes("authorize") ||
        url.includes("access"))
    );
  });

  await page.goto("/panels/scr-1789461964046.html");

  // 権限検証処理が実行されたことを確認（応答を待機）
  try {
    authorizationResponse = await responsePromise;
  } catch (e) {
    // タイムアウトした場合は後続の検証で失敗させる
  }

  // ページの読み込み完了を待機
  await page.waitForLoadState("domcontentloaded");

  // バックエンド認可サービスからの応答が存在することを確認
  expect(authorizationResponse).not.toBeNull();

  // HTTPステータスが成功を示していることを確認
  const status = authorizationResponse!.status();
  expect([200, 201, 204]).toContain(status);

  // 応答ボディを取得して権限情報を検証
  const responseBody = await authorizationResponse!.json();
  expect(responseBody).toBeDefined();

  // ダッシュボード表示権限が「あり」であることを確認
  // 応答ボディ内に権限情報が含まれていることを確認
  const hasPermission =
    responseBody.permission?.dashboard === true ||
    responseBody.permissions?.includes("dashboard_view") ||
    responseBody.allowed === true ||
    responseBody.authorized === true;
  expect(hasPermission).toBeTruthy();

  // ダッシュボード画面へのアクセスが成功したことを確認
  await expect(page).toHaveURL("/panels/scr-1789461964046.html");

  // 期待結果: 権限検証が完了し、生産性ダッシュボード・分析画面が表示される
  // 画面が正常に読み込まれていることを確認
  const dashboardContainer = page.locator(
    "[data-testid='dashboard'], .dashboard, main"
  );
  await expect(dashboardContainer).toBeVisible();

  // 作業者の生産性データが表示されていることを確認
  const productivityData = page
    .locator(
      "[data-testid*='productivity'], [class*='productivity'], h2:has-text('生産性')"
    )
    .first();
  await expect(productivityData).toBeVisible();

  // 初期割当結果と実績の追跡比較要素が表示されていることを確認
  const allocationComparison = page
    .locator(
      "[data-testid*='allocation'], [class*='allocation'], h2:has-text('割当')"
    )
    .first();
  await expect(allocationComparison).toBeVisible();

  // 習熟度評価が表示されていることを確認
  const proficiencyEvaluation = page
    .locator(
      "[data-testid*='proficiency'], [class*='proficiency'], [class*='skill'], h2:has-text('習熟度')"
    )
    .first();
  await expect(proficiencyEvaluation).toBeVisible();

  // 品質ばらつきの可視化要素が表示されていることを確認
  const qualityVariance = page
    .locator(
      "[data-testid*='quality'], [class*='quality'], [class*='variance'], h2:has-text('品質')"
    )
    .first();
  await expect(qualityVariance).toBeVisible();

  // 後続処理（データ表示・分析機能の利用）が可能な状態であることを確認
  // インタラクティブな要素（フィルター、ボタンなど）が操作可能であることを確認
  const interactiveElements = page
    .locator("button, select, input[type='radio'], input[type='checkbox']")
    .first();
  await expect(interactiveElements).toBeEnabled();
});