import { test, expect } from "@playwright/test";

test.describe("SCEN-952: 配置案実行の全工程が開始から完了まで順序通り進行し、入力が引き継がれ、記録が残される", () => {
  const proposalExecutionScreenUrl =
    "/panels/scr-1789461978707.html";
  const productivityDashboardUrl = "/panels/scr-1789461964046.html";
  const workResultsScreenUrl = "/panels/scr-1789461993203.html";

  test("配置案実行の全工程が完了し、入力が引き継がれ、記録が残される", async ({
    page,
  }) => {
    // Step 1: 最適人員配置案提案・実行画面を開く
    await test.step("最適人員配置案提案・実行画面を開く", async () => {
      await page.goto(proposalExecutionScreenUrl);
      await page.waitForLoadState("networkidle");
    });

    // Step 2: 画面に表示されている配置案の詳細情報を確認
    let proposalDetails: {
      proposalId: string;
      proposalDateTime: string;
      workers: string[];
      changes: string;
    };

    await test.step("配置案の詳細情報を確認", async () => {
      const proposalCard = page.locator('[data-testid="proposal-card"]').first();
      await expect(proposalCard).toBeVisible();

      const proposalId = await proposalCard
        .locator('[data-testid="proposal-id"]')
        .textContent();
      const proposalDateTime = await proposalCard
        .locator('[data-testid="proposal-datetime"]')
        .textContent();
      const workersElement = await proposalCard
        .locator('[data-testid="worker-list"]')
        .textContent();
      const changesElement = await proposalCard
        .locator('[data-testid="allocation-changes"]')
        .textContent();

      proposalDetails = {
        proposalId: proposalId || "",
        proposalDateTime: proposalDateTime || "",
        workers: workersElement ? workersElement.split(",") : [],
        changes: changesElement || "",
      };

      expect(proposalId).toBeTruthy();
      expect(proposalDateTime).toBeTruthy();
    });

    // Step 3: 配置案に対して「実行」ボタンをクリック
    let executionId: string;

    await test.step("「実行」ボタンをクリック", async () => {
      const executeButton = page
        .locator('[data-testid="proposal-card"]')
        .first()
        .locator('button:has-text("実行")');
      await executeButton.click();
    });

    // Step 4: 配置案実行の開始確認ダイアログが表示される
    await test.step("配置案実行の開始確認ダイアログが表示される", async () => {
      const confirmDialog = page.locator(
        '[data-testid="execution-confirm-dialog"]'
      );
      await expect(confirmDialog).toBeVisible();
      await expect(
        confirmDialog.locator("text=実行を開始しますか")
      ).toBeVisible();
    });

    // Step 5: ダイアログ内の「実行を開始」ボタンをクリック
    await test.step("「実行を開始」ボタンをクリック", async () => {
      const startButton = page.locator(
        'button:has-text("実行を開始")'
      );
      await startButton.click();
    });

    // Step 6: 配置案実行が開始され、進捗インジケーターが表示される
    await test.step("進捗インジケーターが表示される", async () => {
      const progressIndicator = page.locator(
        '[data-testid="execution-progress"]'
      );
      await expect(progressIndicator).toBeVisible();

      const stepText = await progressIndicator.textContent();
      expect(stepText).toMatch(/ステップ\s*1\s*\/\s*5/);
    });

    // Step 7: 各ステップが順序通り進行し、完了するまで待機
    await test.step("各ステップが順序通り進行する", async () => {
      const progressIndicator = page.locator(
        '[data-testid="execution-progress"]'
      );

      for (let step = 1; step <= 5; step++) {
        const stepPattern = new RegExp(
          `ステップ\\s*${step}\\s*\\/\\s*5`
        );
        await expect(progressIndicator).toContainText(stepPattern);

        if (step < 5) {
          await page.waitForTimeout(500);
        }
      }
    });

    // Step 8: 配置案実行が完了し、「実行完了」状態が表示される
    await test.step("配置案実行が完了する", async () => {
      const completionMessage = page.locator(
        '[data-testid="execution-completed"]'
      );
      await expect(completionMessage).toBeVisible();
      await expect(completionMessage).toContainText("実行完了");

      const executionIdElement = page.locator(
        '[data-testid="execution-id"]'
      );
      executionId = (await executionIdElement.textContent()) || "";
      expect(executionId).toBeTruthy();
    });

    // Step 9: 生産性ダッシュボードまたは配置案画面に遷移
    await test.step("画面遷移が発生する", async () => {
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      const isOnDashboard = currentUrl.includes(
        "scr-1789461964046"
      );
      const isOnProposalScreen = currentUrl.includes(
        "scr-1789461978707"
      );
      expect(
        isOnDashboard || isOnProposalScreen
      ).toBeTruthy();
    });

    // Step 10: 作業実績データ記録・入力画面を開き、割当情報が正しく引き継がれているか確認
    await test.step("作業実績データ記録・入力画面で割当情報を確認", async () => {
      await page.goto(workResultsScreenUrl);
      await page.waitForLoadState("networkidle");

      const allocationInfoRows = page.locator(
        '[data-testid="allocation-record"]'
      );
      await expect(allocationInfoRows.first()).toBeVisible();

      const recordCount = await allocationInfoRows.count();
      expect(recordCount).toBeGreaterThan(0);

      for (const worker of proposalDetails.workers) {
        const workerRecord = page.locator(
          `[data-testid="allocation-record"]:has-text("${worker.trim()}")`
        );
        await expect(workerRecord.first()).toBeVisible();
      }

      const timestampElements = page.locator(
        '[data-testid="allocation-timestamp"]'
      );
      const timestampCount = await timestampElements.count();
      expect(timestampCount).toBeGreaterThan(0);

      for (let i = 0; i < Math.min(timestampCount, 3); i++) {
        const timestamp = await timestampElements.nth(i).textContent();
        expect(timestamp).toBeTruthy();
      }
    });

    // Step 11: 最適人員配置案提案・実行画面の配置案履歴またはログ画面を開く
    await test.step("配置案履歴/ログ画面を開く", async () => {
      await page.goto(proposalExecutionScreenUrl);
      await page.waitForLoadState("networkidle");

      const historyButton = page.locator(
        'button:has-text("履歴")'
      );
      if (await historyButton.isVisible()) {
        await historyButton.click();
        await page.waitForLoadState("networkidle");
      }
    });

    // Step 12: 当該配置案の実行記録が記録・表示されているか確認
    await test.step("実行記録が記録・表示されているか確認", async () => {
      const executionHistoryRows = page.locator(
        '[data-testid="execution-history-row"]'
      );
      await expect(executionHistoryRows.first()).toBeVisible();

      const recordFound = page.locator(
        `[data-testid="execution-history-row"]:has-text("${executionId}")`
      );
      await expect(recordFound.first()).toBeVisible();

      const statusCell = recordFound
        .first()
        .locator('[data-testid="execution-status"]');
      await expect(statusCell).toContainText("完了");

      const startTimeCell = recordFound
        .first()
        .locator('[data-testid="execution-start-time"]');
      await expect(startTimeCell).toBeVisible();

      const endTimeCell = recordFound
        .first()
        .locator('[data-testid="execution-end-time"]');
      await expect(endTimeCell).toBeVisible();

      const stepsResultCell = recordFound
        .first()
        .locator('[data-testid="execution-steps-result"]');
      const stepsResult = await stepsResultCell.textContent();
      expect(stepsResult).toBeTruthy();
    });
  });
});