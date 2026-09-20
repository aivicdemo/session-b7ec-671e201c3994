import { test, expect } from "@playwright/test";

test.describe("SCEN-895: 配置案確認画面表示", () => {
  test("権限検証に成功したユーザーの所属チーム・拠点に対応する配置計画が取得される", async ({
    page,
  }) => {
    // ステップ1: ログイン画面で、東京拠点に所属するセンター長ユーザーでログインする
    await page.goto("/");
    await page.waitForURL(/login/);

    const userIdInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("ログイン"), button:has-text("LOGIN")');

    await userIdInput.fill("tokyo_center_001");
    await passwordInput.fill("password123");
    await loginButton.click();

    // ログイン後の自動遷移を待機
    await page.waitForNavigation({ waitUntil: "networkidle" });

    // ステップ2: 生産性ダッシュボード・分析画面から「最適人員配置案提案・実行画面」へ遷移する
    const optimizationLink = page.locator(
      'a:has-text("最適人員配置案"), button:has-text("最適人員配置案"), [role="link"]:has-text("最適人員配置案")'
    );
    await optimizationLink.click();

    // ステップ3: 配置案確認画面が表示されるまで待機する
    await page.waitForNavigation({ waitUntil: "networkidle" });
    await page.waitForLoadState("domcontentloaded");

    // 期待結果: 配置案確認画面に遷移後、画面に表示される配置計画に『東京拠点』の識別情報が表示される
    const tokyoLocationIndicator = page.locator(
      'text=/東京拠点|Tokyo|東京/'
    );
    await expect(tokyoLocationIndicator).toBeVisible();

    // 期待結果: ログインしたユーザーの所属チームに紐づいた作業者リストが表示される
    const workerList = page.locator(
      '[data-testid="worker-list"], .worker-list, table tbody tr, [role="row"]'
    );
    await expect(workerList).toHaveCount(await workerList.count());
    expect(await workerList.count()).toBeGreaterThan(0);

    // 期待結果: 配置案データが表示される
    const placementPlan = page.locator(
      '[data-testid="placement-plan"], .placement-plan, .assignment-data'
    );
    await expect(placementPlan).toBeVisible();

    // 期待結果: 対象拠点が東京拠点のみに限定され、他拠点の配置案は表示されない
    const osaka = page.locator('text=/大阪拠点|Osaka|大阪/');
    const fukuoka = page.locator('text=/福岡拠点|Fukuoka|福岡/');

    await expect(osaka).not.toBeVisible();
    await expect(fukuoka).not.toBeVisible();

    // ユーザーの所属チームが表示されていることを確認
    const teamInfo = page.locator(
      'text=/チーム|Team|入出荷|ピッキング/'
    );
    await expect(teamInfo).toBeVisible();
  });
});