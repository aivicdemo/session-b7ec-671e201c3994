import { test, expect } from "@playwright/test";

test("SCEN-1410: 配信モーダル確定 - 検証済みの人員配置案と作業指示が現場リーダーに配信される", async ({
  page,
}) => {
  // ログイン
  await page.goto("/");
  await page.waitForURL(/.*login/);
  await page.fill('input[placeholder="ユーザーID"]', "testuser");
  await page.fill('input[placeholder="パスワード"]', "password");
  await page.click("button:has-text('ログイン')");
  await page.waitForURL(/.*scr-1789461783315/);

  // 1. 進捗・人員配置ダッシュボード画面を開く
  await expect(page).toHaveURL(/.*scr-1789461783315/);

  // 2. 複数拠点の進捗データと生産性データが表示されていることを確認
  const kpiRiskCount = page.getByTestId("kpi-risk-count");
  const kpiSitesAction = page.getByTestId("kpi-sites-action");
  const kpiActivePlans = page.getByTestId("kpi-active-plans");
  await expect(kpiRiskCount).toBeVisible();
  await expect(kpiSitesAction).toBeVisible();
  await expect(kpiActivePlans).toBeVisible();

  // 3. 遅延リスク予測結果と人員配置調整案が表示されていることを確認
  const siteVarianceTable = page.getByTestId("site-variance-table");
  const riskAssessmentTable = page.getByTestId("risk-assessment-table");
  await expect(siteVarianceTable).toBeVisible();
  await expect(riskAssessmentTable).toBeVisible();

  // 4. 人員配置最適化提案・実行画面へ遷移
  const optimizeButton = page.getRole("button", {
    name: "人員配置を最適化",
  });
  await optimizeButton.click();
  await page.waitForURL(/.*scr-1789461798629/);

  // 5. 自動生成された人員配置案と対応する作業指示が画面に表示されることを確認
  const assignmentDetailTable = page.getByTestId("assignment-detail-table");
  await expect(assignmentDetailTable).toBeVisible();

  // 6. 配置案の内容が画面に正確に表示されていることを確認
  const proposalDetailContainer = page.locator(
    '[id="proposal-detail-container"]'
  );
  await expect(proposalDetailContainer).toBeVisible();

  // 7. 配置案と作業指示の『配信確定』ボタンをクリック
  const distributeButton = page.getRole("button", {
    name: "配置案と作業指示を一括配信",
  });
  await distributeButton.click();

  // 配信モーダルが表示されるのを待つ
  const distributeModal = page.locator("[id='distribute-modal-overlay']");
  await expect(distributeModal).toBeVisible();

  // モーダル内の確定ボタンをクリック
  const distributeConfirmButton = page.getByTestId(
    "distribute-modal-confirm"
  );
  await distributeConfirmButton.click();

  // 8. 配信処理が実行され、数秒以内に『配信成功』メッセージが画面に表示されることを確認
  const successMessage = page.locator("text=/配信成功/");
  await expect(successMessage).toBeVisible({ timeout: 3000 });

  // 9. 配信成功メッセージに配信ID・タイムスタンプが含まれていることを確認
  const messageText = await successMessage.textContent();
  expect(messageText).toBeTruthy();
  // 配信IDパターン: 数字、英字を含む識別子
  expect(messageText).toMatch(/配信ID[:\s\-]*([A-Z0-9]+|\d+)/i);
  // タイムスタンプパターン: YYYY-MM-DD HH:MM または ISO形式
  expect(messageText).toMatch(
    /\d{4}[-\/]\d{2}[-\/]\d{2}\s+\d{1,2}:\d{2}|\d{4}[-\/]\d{2}[-\/]\d{2}T\d{2}:\d{2}/
  );

  // 10. 作業指示・実績管理画面へ遷移
  const workInstructionNav = page.getRole("link", {
    name: "作業指示・実績管理",
  });
  await workInstructionNav.click();
  await page.waitForURL(/.*scr-1789461813941/);

  // 11. 配信対象の現場リーダーに紐付いた人員配置案と作業指示が、『受領待機中』ステータスで一覧表示されることを確認
  const workInstructionList = page.getByTestId("work-instruction-list");
  await expect(workInstructionList).toBeVisible();

  // 作業指示テーブルの行を取得
  const workInstructionTbody = page.locator(
    "[id='work-instruction-tbody'] tr"
  );
  const rowCount = await workInstructionTbody.count();
  expect(rowCount).toBeGreaterThan(0);

  // 受領待機中ステータスを持つ行を確認
  let foundDeliveryTarget = false;

  for (let i = 0; i < rowCount; i++) {
    const row = workInstructionTbody.nth(i);
    const rowText = await row.textContent();

    if (rowText && rowText.includes("受領待機中")) {
      foundDeliveryTarget = true;

      // 12. 表示されたリストに配置案ID・作業指示ID・配信タイムスタンプが含まれていることを確認
      const cells = row.locator("td");
      const cellCount = await cells.count();

      const cellTexts: string[] = [];
      for (let j = 0; j < cellCount; j++) {
        const cellText = await cells.nth(j).textContent();
        if (cellText) {
          cellTexts.push(cellText.trim());
        }
      }

      // 行全体のテキストを結合
      const fullRowText = cellTexts.join(" ");

      // 配置案IDが含まれていることを確認
      const assignmentIdPattern = /[A-Z]{2,}[-_]?\d{4,}|ASS[-_]?\d{6,}|[A-Z0-9]{8,}/;
      const assignmentIdMatch = fullRowText.match(assignmentIdPattern);
      expect(assignmentIdMatch).toBeTruthy();
      const assignmentId = assignmentIdMatch?.[0];

      // 作業指示IDが含まれていることを確認
      // 配置案IDとは異なるID形式を持つ別のIDを探す
      const allIds = fullRowText.match(
        /[A-Z]{2,}[-_]?\d{4,}|[A-Z0-9]{8,}|WI[-_]?\d{6,}/g
      );
      let instructionId: string | undefined;

      if (allIds && allIds.length >= 2) {
        for (const id of allIds) {
          if (id !== assignmentId) {
            instructionId = id;
            break;
          }
        }
      }

      expect(instructionId).toBeTruthy();

      // タイムスタンプが含まれていることを確認
      const timestampPattern =
        /\d{4}[-\/]\d{2}[-\/]\d{2}\s+\d{1,2}:\d{2}|\d{4}[-\/]\d{2}[-\/]\d{2}T\d{2}:\d{2}/;
      const timestampMatch = fullRowText.match(timestampPattern);
      expect(timestampMatch).toBeTruthy();

      // 各項目に配置案ID、作業指示ID、タイムスタンプが含まれていることを確認
      expect(fullRowText).toContain(assignmentId!);
      expect(fullRowText).toContain(instructionId!);
      expect(fullRowText).toMatch(timestampPattern);

      break;
    }
  }

  expect(foundDeliveryTarget).toBe(true);
});