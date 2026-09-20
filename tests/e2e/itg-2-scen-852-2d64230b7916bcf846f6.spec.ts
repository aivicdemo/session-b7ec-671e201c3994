import { test, expect } from "@playwright/test";

test("SCEN-852: 納期まで15分以下の進捗遅延が検出された場合、画面にcriticalリスクレベルで表示される", async ({
  page,
}) => {
  // Step 1: 生産性ダッシュボード・分析画面を開く
  await page.goto("/panels/scr-1789461964046.html");
  await page.waitForLoadState("networkidle");

  // Step 2: 最適人員配置案提案・実行画面へ遷移する
  await page.goto("/panels/scr-1789461978707.html");
  await page.waitForLoadState("networkidle");

  // Step 3: 画面が読み込まれ、自動生成された人員配置案が表示されるまで待機する
  await page.waitForSelector(
    "[data-testid='allocation-list'], [data-testid='allocation-card'], .allocation-item",
    { timeout: 10000 }
  );

  // Step 4: 画面上の配置案リストまたは詳細領域を確認し、納期15分以下の遅延案件が表示されている行またはカードを目視する
  // criticalリスクレベルの要素を探す
  const criticalElements = await page.locator(
    "[data-risk-level='critical'], .risk-critical, [class*='critical']"
  );

  // Expected Result: criticalリスクレベルが表示されていることを確認
  await expect(criticalElements.first()).toBeVisible();

  // criticalリスク要素の視認可能性と視覚的区別を確認
  const criticalElement = criticalElements.first();

  // 背景色を取得
  const backgroundColor = await criticalElement.evaluate(
    (el) => window.getComputedStyle(el).backgroundColor
  );

  // ラベル要素またはバッジの存在を確認
  const riskLabelElement = await criticalElement.locator(
    "[data-testid='risk-label'], .risk-label, [class*='badge'], [class*='label']"
  );

  // 背景色が赤色であるか、またはラベルに'critical'が含まれているかのいずれかを確認
  let isCriticalDisplayed = false;

  // 背景色が赤系であるかチェック
  const isRedBackground =
    backgroundColor.includes("rgb(220, 38, 38)") || // red-600相当
    backgroundColor.includes("rgb(239, 68, 68)") || // red-500相当
    backgroundColor.includes("rgb(248, 113, 113)") || // red-400相当
    backgroundColor.includes("rgb(255, 0, 0)"); // 純粋な赤

  if (isRedBackground) {
    isCriticalDisplayed = true;
  }

  // ラベルに'critical'が含まれているかチェック
  if ((await riskLabelElement.count()) > 0) {
    const riskLabelText = await riskLabelElement.textContent();
    if (riskLabelText?.toLowerCase().includes("critical")) {
      isCriticalDisplayed = true;
    }
  }

  // 背景色またはラベルのいずれかでcriticalが表示されていることを確認
  expect(isCriticalDisplayed).toBe(true);

  // 他のリスクレベルとの視覚的区別を確認（warningやinfoの要素が存在する場合）
  const warningElements = await page.locator(
    "[data-risk-level='warning'], .risk-warning"
  );
  const infoElements = await page.locator(
    "[data-risk-level='info'], .risk-info"
  );

  // criticalとwarning/infoが異なる視覚スタイルを持つことを確認
  if ((await warningElements.count()) > 0) {
    const warningBgColor = await warningElements
      .first()
      .evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(backgroundColor).not.toBe(warningBgColor);
  }

  if ((await infoElements.count()) > 0) {
    const infoBgColor = await infoElements
      .first()
      .evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(backgroundColor).not.toBe(infoBgColor);
  }
});