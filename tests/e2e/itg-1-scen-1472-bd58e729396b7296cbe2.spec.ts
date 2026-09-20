import { test, expect } from "@playwright/test";

test.describe("作業指示実績管理画面表示", () => {
  test("作業指示ID「WI-20250115-001」に対応する実績データが画面に表示される", async ({
    page,
  }) => {
    // ログイン画面へアクセス
    await page.goto("/");
    await page.waitForURL("**/panels/**");

    // 作業指示・実績管理画面へ遷移
    const workInstructionNav = page.locator("nav").getByText("作業指示・実績管理");

    if (await workInstructionNav.isVisible().catch(() => false)) {
      await workInstructionNav.click();
      await page.waitForLoadState("networkidle");
    } else {
      await page.goto("/panels/scr-1789461813941.html");
      await page.waitForLoadState("networkidle");
    }

    // 画面左側のナビゲーションまたはフィルタから拠点「本社DC」を選択
    // ワーカーサマリーリストから本社DCを探して選択
    const workerSummaryList = page.locator('[id="worker-summary-list"]');
    const honshaDCOption = workerSummaryList.locator("text=本社DC").first();
    
    if (await honshaDCOption.isVisible().catch(() => false)) {
      await honshaDCOption.click();
      await page.waitForLoadState("networkidle");
    }

    // 作業指示一覧テーブルから作業指示ID「WI-20250115-001」の行を確認
    const instructionTable = page.locator('[id="work-instruction-tbody"]');
    const targetRow = instructionTable
      .locator('text="WI-20250115-001"')
      .first()
      .locator("xpath=ancestor::tr");

    await expect(targetRow).toBeVisible();

    // 対象行の実績データ表示エリアに実績数「150」が表示されていることを確認
    const quantityInRow = targetRow.locator("text=150");
    await expect(quantityInRow).toBeVisible();

    // 対象行に作業者ID「W001」が表示されていることを確認
    const workerIdInRow = targetRow.locator("text=W001");
    await expect(workerIdInRow).toBeVisible();

    // 対象行にタイムスタンプ「2025-01-15 10:30:00」が表示されていることを確認
    const timestampInRow = targetRow.locator("text=2025-01-15 10:30:00");
    await expect(timestampInRow).toBeVisible();

    // 対象行の進捗率表示エリアに「75%」が表示されていることを確認
    const progressRateInRow = targetRow.locator("text=75%");
    await expect(progressRateInRow).toBeVisible();

    // 総合的な確認：対象行に必要な情報がすべて含まれていることを確認
    const rowText = await targetRow.textContent();
    expect(rowText).toContain("WI-20250115-001");
    expect(rowText).toContain("150");
    expect(rowText).toContain("W001");
    expect(rowText).toContain("2025-01-15 10:30:00");
    expect(rowText).toContain("75%");
  });
});