import { test, expect } from "@playwright/test";

test("SCEN-953: 配置案ID取得時に対応するレコードが存在しない場合、エラーとして処理が中断される", async ({
  page,
}) => {
  // 最適人員配置案提案・実行画面を開く
  await page.goto("/panels/scr-1789461978707.html");
  await page.waitForLoadState("networkidle");

  // 配置案一覧から任意の配置案を選択する
  const placementCaseItems = page.locator("[data-testid='placement-case-item']");
  const itemCount = await placementCaseItems.count();

  if (itemCount === 0) {
    test.skip();
  }

  const firstItem = placementCaseItems.first();
  
  // 配置案IDを取得
  const placementCaseId = await firstItem.getAttribute("data-placement-case-id");
  
  await firstItem.click();

  // 詳細表示ボタンクリック後に、対応するレコードが存在しない状態を作出するため、
  // 詳細ボタンクリック時のAPI呼び出しをインターセプトする
  await page.route(
    (url) => url.toString().includes(`/api/`) && url.toString().includes(`placement`),
    async (route) => {
      const request = route.request();
      if (request.url().includes(placementCaseId)) {
        // 対応するレコードが存在しないを示す404またはエラーレスポンスを返す
        await route.abort("notfound");
      } else {
        await route.continue();
      }
    }
  );

  // 配置案の詳細情報を確認するため、詳細表示ボタンをクリックする
  const detailButton = page.locator(
    "[data-testid='placement-case-detail-button']"
  );
  await detailButton.click();

  // 画面の応答を確認する
  // エラーメッセージが表示されることを確認
  const errorDialog = page.locator(
    "[role='dialog'] >> text=/指定された配置案が見つかりません|配置案が見つかりません/"
  );
  const errorToast = page.locator(
    "[role='alert'] >> text=/指定された配置案が見つかりません|配置案が見つかりません/"
  );

  const errorMessageVisible =
    (await errorDialog.isVisible().catch(() => false)) ||
    (await errorToast.isVisible().catch(() => false));

  expect(errorMessageVisible).toBe(true);

  // 配置案一覧画面が継続して表示されている状態を確認
  const placementCaseList = page.locator("[data-testid='placement-case-list']");
  await expect(placementCaseList).toBeVisible();
});