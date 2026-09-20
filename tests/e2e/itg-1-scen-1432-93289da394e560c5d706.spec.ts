import { test, expect } from "@playwright/test";

test("SCEN-1432: 納期遅延リスク判定時に、推定完了時間が納期までの残り時間を超える場合、リスクレベルが「高」と判定される", async ({
  page,
}) => {
  // ログイン画面に遷移
  await page.goto("/");
  await page.waitForSelector(".login-card");

  // ログイン操作
  await page.fill('input[type="text"]', "testuser");
  await page.fill('input[type="password"]', "testpass");
  await page.click('button:has-text("ログイン")');

  // 自動遷移完了待機
  await page.waitForURL(/.*panels\/scr-1789461813941\.html/);
  await page.waitForLoadState("networkidle");

  // 作業指示・実績管理画面で特定の拠点・チームの作業指示データを表示
  await page.waitForSelector('[data-testid="work-instruction-list"]');

  // 当該拠点・チームの進捗情報を確認
  // work-instruction-tbodyから対象行を取得し、完了数=80、残数=50、納期までの残り時間=120分を確認
  const instructionRows = page.locator("#work-instruction-tbody tr");
  const rowCount = await instructionRows.count();

  let targetDataFound = false;
  let targetSiteName = "";
  let targetTeamName = "";

  for (let i = 0; i < rowCount; i++) {
    const row = instructionRows.nth(i);
    const cells = row.locator("td");
    const cellCount = await cells.count();

    // テーブルの各セルをチェックして完了数80、残数50、残り時間120分を特定
    let completedCount = null;
    let remainingCount = null;
    let remainingTimeMinutes = null;
    const cellTexts: string[] = [];

    for (let j = 0; j < cellCount; j++) {
      const cellText = await cells.nth(j).textContent();
      cellTexts.push(cellText || "");
      if (cellText?.includes("80")) completedCount = 80;
      if (cellText?.includes("50")) remainingCount = 50;
      if (cellText?.includes("120")) remainingTimeMinutes = 120;
    }

    if (
      completedCount === 80 &&
      remainingCount === 50 &&
      remainingTimeMinutes === 120
    ) {
      targetDataFound = true;
      // 対象行から拠点名とチーム名を抽出（最初と2番目のセルと想定）
      if (cellTexts.length >= 2) {
        targetSiteName = cellTexts[0].trim();
        targetTeamName = cellTexts[1].trim();
      }
      break;
    }
  }

  expect(targetDataFound).toBe(true);

  // ダッシュボードへ遷移（システムが推定完了時間=150分で自動判定した状態で遷移されることを想定）
  await page.click('a:has-text("進捗・人員配置ダッシュボード")');
  await page.waitForURL(/.*panels\/scr-1789461783315\.html/);
  await page.waitForLoadState("networkidle");

  // ダッシュボード画面の完全な読み込み待機
  await page.waitForSelector('[data-testid="risk-assessment-table"]');
  await expect(page.locator("#risk-assessment-tbody")).toBeVisible();

  // リスク評価テーブルの行から、作業指示画面で特定した拠点・チームに対応する行を検索
  const riskAssessmentRows = page.locator("#risk-assessment-tbody tr");
  const riskRowCount = await riskAssessmentRows.count();

  let targetRiskRowFound = false;
  let riskLevelIsHigh = false;
  let hasHighRiskVisuals = false;

  for (let i = 0; i < riskRowCount; i++) {
    const row = riskAssessmentRows.nth(i);
    const rowText = await row.textContent();

    // 作業指示画面で特定した拠点名とチーム名を含む行を検索
    if (
      rowText &&
      rowText.includes(targetSiteName) &&
      rowText.includes(targetTeamName)
    ) {
      targetRiskRowFound = true;

      const cells = row.locator("td");
      const cellCount = await cells.count();
      const rowCellTexts: string[] = [];

      // セルの内容を取得
      for (let j = 0; j < cellCount; j++) {
        const cellContent = await cells.nth(j).textContent();
        rowCellTexts.push(cellContent || "");
      }

      // リスクレベルカラムで「高」が表示されていることを確認
      for (let j = 0; j < rowCellTexts.length; j++) {
        const cellContent = rowCellTexts[j];
        if (cellContent.trim() === "高") {
          riskLevelIsHigh = true;
          break;
        }
      }

      // 当該行の背景色が赤色系であることを確認、または警告アイコンがあることを確認
      const rowElement = row;
      const rowStyle = await rowElement.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor
      );

      const hasRedBackground =
        rowStyle.includes("rgb(239, 68, 68)") ||
        rowStyle.includes("rgb(220, 38, 38)") ||
        rowStyle.includes("rgb(185, 28, 28)") ||
        rowStyle.includes("rgb(229, 62, 62)") ||
        rowStyle.includes("rgb(248, 113, 113)") ||
        rowStyle.includes("rgb(255, 0, 0)");

      // 警告アイコンの有無を確認（行内のどこかに警告アイコンがある）
      const riskIcon = row.locator(
        'svg, i[class*="warning"], i[class*="alert"], i[class*="danger"], [class*="risk-icon"]'
      );
      const hasWarningIcon = (await riskIcon.count()) > 0;

      // 背景色または警告アイコンのいずれかが存在することを確認
      hasHighRiskVisuals = hasRedBackground || hasWarningIcon;

      break;
    }
  }

  expect(targetRiskRowFound).toBe(true);
  expect(riskLevelIsHigh).toBe(true);
  expect(hasHighRiskVisuals).toBe(true);
});