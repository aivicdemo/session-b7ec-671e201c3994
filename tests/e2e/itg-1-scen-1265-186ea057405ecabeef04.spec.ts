import { test, expect } from "@playwright/test";

test("SCEN-1265: 推定完了時間が納期までの残り時間を超える場合、リスクレベルが高に設定される", async ({
  page,
}) => {
  // 進捗・人員配置ダッシュボード画面を開く
  await page.goto("/panels/scr-1789461783315.html");
  await page.waitForLoadState("networkidle");

  // リスク表示エリアが表示されるまで待機
  await page.waitForSelector('[data-testid="risk-assessment-table"]', {
    timeout: 10000,
  });

  // WMSから現在の作業進捗データが取得されることを確認
  // 作業指示ID=WO-001の行が表示されるまで待機
  const riskTable = page.locator("#risk-assessment-tbody");

  await page
    .locator("tr")
    .filter({
      has: page.locator("text=WO-001"),
    })
    .first()
    .waitFor({ state: "visible", timeout: 10000 });

  // 作業指示ID=WO-001の行を取得
  const wo001Row = riskTable
    .locator("tr")
    .filter({
      has: page.locator("text=WO-001"),
    })
    .first();

  // WMSから取得されたデータの確認：拠点A、チームX、完了数=50、残数=150
  const fullRowTextBefore = await wo001Row.textContent();
  expect(fullRowTextBefore).toContain("A");
  expect(fullRowTextBefore).toContain("X");
  expect(fullRowTextBefore).toContain("WO-001");
  expect(fullRowTextBefore).toContain("50");
  expect(fullRowTextBefore).toContain("150");

  // ステップ3：推定完了時間=480分（8時間）、納期までの残り時間=300分（5時間）の確認
  const fullRowTextBeforeAnalysis = await wo001Row.textContent();
  expect(fullRowTextBeforeAnalysis).toContain("480");
  expect(fullRowTextBeforeAnalysis).toContain("300");

  // 進捗遅延リスク分析実行トリガーを操作（最適化ボタンをクリック）
  const optimizeButton = page.locator('[data-testid="optimize-button"]');
  await optimizeButton.click();

  // 進捗遅延リスク分析が完了するまで待機
  await page.waitForLoadState("networkidle");
  await page.waitForSelector('[data-testid="risk-assessment-table"]', {
    state: "visible",
    timeout: 10000,
  });

  // 更新されたWO-001の行を再取得
  const updatedWo001Row = riskTable
    .locator("tr")
    .filter({
      has: page.locator("text=WO-001"),
    })
    .first();

  // 期待結果の検証：ダッシュボード画面のリスク表示エリアに必要な情報が表示されることを確認
  const fullRowText = await updatedWo001Row.textContent();

  // 作業指示ID、拠点、チームの確認
  expect(fullRowText).toContain("WO-001");
  expect(fullRowText).toContain("A");
  expect(fullRowText).toContain("X");

  // リスクレベル=『高』の確認
  expect(fullRowText).toContain("高");

  // 推定完了時間=480分、納期までの残り時間=300分、遅延確率=85%の確認
  expect(fullRowText).toContain("480");
  expect(fullRowText).toContain("300");
  expect(fullRowText).toContain("85");

  // リスクレベル表示が赤色またはそれに相当する視覚的強調で表現されていることを確認
  const riskLevelCell = updatedWo001Row.locator("td").filter({
    hasText: "高",
  }).first();

  const riskLevelElement = riskLevelCell.locator("span, div").first();

  const computedColor = await riskLevelElement.evaluate((el) => {
    return window.getComputedStyle(el).color;
  });

  const computedBackgroundColor = await riskLevelElement.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });

  const hasHighRiskClass = await riskLevelElement.evaluate(
    (el) =>
      el.classList.toString().includes("high") ||
      el.getAttribute("class")?.includes("red") ||
      el.getAttribute("data-severity")?.includes("high")
  );

  const isRedColor =
    computedColor.includes("rgb(255, 0, 0)") ||
    computedColor.includes("rgb(220, 38, 38)") ||
    computedColor.includes("rgb(239, 68, 68)") ||
    computedColor.includes("rgb(248, 113, 113)") ||
    computedBackgroundColor.includes("rgb(255, 0, 0)") ||
    computedBackgroundColor.includes("rgb(220, 38, 38)") ||
    computedBackgroundColor.includes("rgb(239, 68, 68)") ||
    computedBackgroundColor.includes("rgb(248, 113, 113)") ||
    hasHighRiskClass;

  expect(isRedColor).toBeTruthy();

  // 警告メッセージの確認
  const warningMessage = page.getByText(
    "推定完了時間が納期までの残り時間を超えています"
  );
  await expect(warningMessage).toBeVisible();
});