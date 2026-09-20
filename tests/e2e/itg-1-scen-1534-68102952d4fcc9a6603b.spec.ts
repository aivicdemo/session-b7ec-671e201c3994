import { test, expect } from "@playwright/test";

test.describe("SCEN-1534: 作業指示受領確認", () => {
  test("作業指示受領確認画面から操作を開始し、認証・権限検証を経て受領履歴に記録され、受領状態が更新されて監査証跡が残ること", async ({
    page,
  }) => {
    // ログイン
    await page.goto("/");
    await page.waitForURL("**/login**");

    // ユーザーID入力
    await page.fill('input[placeholder*="ユーザーID"]', "WORKER-0001");
    // パスワード入力
    await page.fill('input[placeholder*="パスワード"]', "password");
    // ログインボタンクリック
    await page.click('button:has-text("ログイン")');
    await page.waitForURL("**/panels/**");
    await page.waitForLoadState("networkidle");

    // 作業指示・実績管理画面に遷移
    await page.click('a:has-text("作業指示・実績管理")');
    await page.waitForLoadState("networkidle");

    // 受領対象となる作業指示を1件選択
    const workInstructionRows = await page.locator(
      '[data-testid="work-instruction-list"] tbody tr'
    );
    await expect(workInstructionRows.first()).toBeVisible();

    const firstRow = workInstructionRows.first();
    await firstRow.click();
    await page.waitForLoadState("networkidle");

    // 対象作業指示IDを取得
    const instructionId = await firstRow.locator("td").first().textContent();
    const trimmedInstructionId = instructionId?.trim();

    // 受領確認前の受領状態を取得
    const receiptStatusBefore = await firstRow
      .locator('[data-testid="performance-status"]')
      .textContent();

    // 受領確認ボタンを取得
    const receiptConfirmButton = page.locator(
      '[data-testid="receipt-confirm-ok"]'
    );
    await expect(receiptConfirmButton).toBeVisible();

    // 受領確認ボタンをクリック
    await receiptConfirmButton.click();
    await page.waitForLoadState("networkidle");

    // 認証・権限検証チェックポイントが通過することを確認
    // エラーバナーが表示されていないことを確認
    const errorBanner = page.locator('[id="error-banner"]');
    await expect(errorBanner).not.toBeVisible();

    // 受領確認モーダルが閉じることで認証・権限検証成功を確認
    const receiptConfirmationOverlay = page.locator(
      '[id="receipt-confirmation-overlay"]'
    );
    await expect(receiptConfirmationOverlay).not.toBeVisible();

    // ユーザーロール『作業者』の検証
    const userArea = page.locator('[class="shell-user-area"]');
    const userName = await userArea
      .locator('[class="shell-user-name"]')
      .textContent();
    expect(userName).toBeTruthy();

    // 拠点『東京-01』の検証
    const siteFilter = page.locator('[data-testid="site-filter"]');
    const selectedSite = await siteFilter.textContent();
    expect(selectedSite).toContain("東京-01");

    // 対象作業指示の拠点が『東京-01』と一致することを確認
    const instructionSite = await firstRow.locator("td").nth(1).textContent();
    expect(instructionSite).toContain("東京-01");

    // 作業指示の受領状態が『未受領』から『受領済（日時）』に更新されたことを確認
    await page.waitForTimeout(500);
    const receiptStatusAfter = await firstRow
      .locator('[data-testid="performance-status"]')
      .textContent();

    expect(receiptStatusAfter).toContain("受領済");
    expect(receiptStatusAfter).toMatch(
      /受領済\(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\)/
    );
    expect(receiptStatusAfter).not.toBe(receiptStatusBefore);

    // 受領状態から実行時刻を抽出
    const timeMatch = receiptStatusAfter?.match(
      /受領済\((\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\)/
    );
    const executionTime = timeMatch ? timeMatch[1] : null;

    // 受領履歴タブを確認
    await page.click('[data-testid="tab-receipt-history"]');
    await page.waitForLoadState("networkidle");

    const receiptHistoryTable = page.locator(
      '[data-testid="receipt-history-list"]'
    );
    await expect(receiptHistoryTable).toBeVisible();

    // 受領履歴に新しいエントリが記録されていることを確認
    const receiptHistoryRows = await receiptHistoryTable.locator("tbody tr");
    const rowCount = await receiptHistoryRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 最新の受領履歴エントリを確認
    const latestHistoryRow = receiptHistoryRows.first();
    const historyContent = await latestHistoryRow.textContent();

    expect(historyContent).toContain("受領確認");
    expect(historyContent).toContain("WORKER-0001");
    expect(historyContent).toContain("東京-01");
    expect(historyContent).toContain(trimmedInstructionId);
    expect(historyContent).toContain("成功");
    if (executionTime) {
      expect(historyContent).toContain(executionTime);
    }

    // 監査証跡パネルを展開して詳細エントリを確認
    const auditTrailPanel = page.locator('[id="audit-trail-panel"]');

    // パネルが展開されていない場合は展開ボタンをクリック
    const auditTrailToggle = page.locator('[id="audit-trail-toggle"]');
    const isPanelVisible = await auditTrailPanel.isVisible();
    if (!isPanelVisible) {
      await auditTrailToggle.click();
      await page.waitForTimeout(300);
    }

    await expect(auditTrailPanel).toBeVisible();

    // 監査証跡パネルの詳細エントリを確認
    const auditTrailContent = await auditTrailPanel.textContent();
    expect(auditTrailContent).toContain("操作種別: 受領確認");
    expect(auditTrailContent).toContain("操作者: WORKER-0001");
    expect(auditTrailContent).toContain("拠点: 東京-01");
    expect(auditTrailContent).toContain(`対象作業指示: ${trimmedInstructionId}`);
    expect(auditTrailContent).toContain("ステータス: 成功");
    if (executionTime) {
      expect(auditTrailContent).toContain(`実行時刻: ${executionTime}`);
    }

    // 1つの詳細エントリとして全要素が同時に表示されていることを確認
    expect(auditTrailContent).toMatch(
      /操作種別:\s*受領確認[\s\S]*操作者:\s*WORKER-0001[\s\S]*拠点:\s*東京-01[\s\S]*ステータス:\s*成功/
    );
  });
});