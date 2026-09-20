import { test, expect, Page } from "@playwright/test";

test.describe("配置案承認処理", () => {
  let page: Page;
  const targetScreenUrl = "/panels/scr-1789461978707.html";

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // ログイン処理
    await page.goto("/");
    await page.waitForURL("**/scr-*.html");
    
    // ログイン画面が表示されている場合
    const loginForm = await page.locator(".login-form").isVisible().catch(() => false);
    if (loginForm) {
      await page.fill('input[type="email"], input[placeholder*="ID"], input:first-of-type', "testuser@example.com");
      await page.fill('input[type="password"], input:last-of-type', "testpassword");
      await page.click("button:has-text('ログイン'), .login-button");
      await page.waitForNavigation();
    }
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("工程6で配置案の妥当性スコア判定が完了すると、工程7で配置計画レコードの承認ステータスと承認者ID・承認日時が更新されて画面に反映される", async () => {
    // 工程1: 最適人員配置案提案・実行画面を開く
    await test.step("最適人員配置案提案・実行画面を開く", async () => {
      await page.goto(targetScreenUrl);
      await page.waitForLoadState("networkidle");
    });

    // 工程2: 承認待ち状態の配置計画レコードを表示する
    await test.step("承認待ち状態の配置計画レコード（配置案ID、作業者割当情報を確認可能な状態）を表示する", async () => {
      // 承認待ち状態のレコードを検索・フィルタ
      const filterButton = page.locator("button:has-text('フィルタ'), [data-testid*='filter']");
      if (await filterButton.isVisible().catch(() => false)) {
        await filterButton.click();
      }

      // 承認待ちステータスのレコードが表示されるまで待機
      const pendingRecord = page.locator(
        "text=/承認待機中|pending/i, [data-status='pending'], tr:has-text('承認待機中')"
      ).first();
      await expect(pendingRecord).toBeVisible({ timeout: 10000 });
    });

    // 工程3: 詳細を開き、現在の承認ステータスと未設定フィールドを確認
    let recordId: string;
    await test.step("当該配置計画レコードの詳細を開き、現在の承認ステータスが『承認待機中』、承認者IDと承認日時が未設定であることを確認する", async () => {
      const detailButton = page.locator(
        "button:has-text('詳細'), [data-testid*='detail'], a:has-text('詳細')"
      ).first();
      await detailButton.click();
      await page.waitForLoadState("networkidle");

      // 承認ステータスが『承認待機中』であることを確認
      const statusField = page.locator(
        "text=/承認ステータス|Approval Status/i",
        { has: page.locator("text=/承認待機中|pending/i") }
      ).first();
      await expect(statusField).toBeVisible();

      // 承認ステータスの値を確認
      const statusValue = page.locator(
        "[data-field='approvalStatus'], .status-field, td:has-text('承認ステータス') + td"
      ).first();
      await expect(statusValue).toContainText(/承認待機中|pending/i);

      // 承認者IDが未設定（空白またはnull）であることを確認
      const approverIdField = page.locator(
        "[data-field='approverId'], .approver-id-field, td:has-text('承認者ID') + td"
      ).first();
      const approverIdText = await approverIdField.textContent();
      expect(approverIdText?.trim()).toMatch(/^(\s|null|—|---|$)/);

      // 承認日時が未設定であることを確認
      const approvalDateField = page.locator(
        "[data-field='approvalDate'], .approval-date-field, td:has-text('承認日時') + td"
      ).first();
      const approvalDateText = await approvalDateField.textContent();
      expect(approvalDateText?.trim()).toMatch(/^(\s|null|—|---|$)/);

      // レコードIDを取得（後で検証用）
      recordId = await page.locator(
        "[data-field='id'], .record-id, td:has-text('ID') + td"
      )
        .first()
        .textContent()
        .then((text) => text?.trim() || "");
    });

    // 工程4: 画面をリロードするか、自動更新機能による反映を待つ
    await test.step("画面をリロードするか、自動更新機能による反映を待つ", async () => {
      // 自動更新を待つ（最大30秒）
      let isUpdated = false;
      const startTime = Date.now();
      const timeout = 30000;

      while (!isUpdated && Date.now() - startTime < timeout) {
        const currentStatus = await page
          .locator("[data-field='approvalStatus'], .status-field")
          .first()
          .textContent()
          .catch(() => "");

        if (currentStatus?.includes("承認済み")) {
          isUpdated = true;
          break;
        }

        // 2秒待機してから再確認
        await page.waitForTimeout(2000);
      }

      // 自動更新がない場合、画面をリロード
      if (!isUpdated) {
        await page.reload();
        await page.waitForLoadState("networkidle");
      }
    });

    // 工程5: 承認ステータスが『承認済み』に変更されていることを確認
    await test.step("当該配置計画レコードの承認ステータスが『承認済み』に変更されていることを確認する", async () => {
      const statusValue = page.locator(
        "[data-field='approvalStatus'], .status-field, td:has-text('承認ステータス') + td"
      ).first();
      await expect(statusValue).toContainText(/承認済み|approved/i);
    });

    // 工程6: 承認者IDが表示されていることを確認
    await test.step("承認者IDフィールドにログイン中のユーザーID（またはシステムが記録した承認者のID）が表示されていることを確認する", async () => {
      const approverIdField = page.locator(
        "[data-field='approverId'], .approver-id-field, td:has-text('承認者ID') + td"
      ).first();
      const approverIdText = await approverIdField.textContent();

      // 承認者IDが空でなく、有効な値であることを確認
      expect(approverIdText?.trim()).toBeTruthy();
      expect(approverIdText?.trim()).not.toMatch(/^(null|—|---|)$/);
      // 形式例：user_12345 または同様のID形式
      expect(approverIdText?.trim()).toMatch(/^[a-zA-Z0-9_\-]+$/);
    });

    // 工程7: 承認日時が表示されていることを確認
    await test.step("承認日時フィールドに日時（『yyyy-MM-dd HH:mm:ss』形式）が表示されていることを確認する", async () => {
      const approvalDateField = page.locator(
        "[data-field='approvalDate'], .approval-date-field, td:has-text('承認日時') + td"
      ).first();
      const approvalDateText = await approvalDateField.textContent();

      // 日時が空でなく、有効な日時形式であることを確認
      expect(approvalDateText?.trim()).toBeTruthy();
      expect(approvalDateText?.trim()).not.toMatch(/^(null|—|---|)$/);
      // yyyy-MM-dd HH:mm:ss 形式の正規表現
      expect(approvalDateText?.trim()).toMatch(
        /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/
      );
    });

    // 複数回リロードしても値が保持されることを確認
    await test.step("複数回リロードしても値が保持される", async () => {
      const approverIdField = page.locator(
        "[data-field='approverId'], .approver-id-field, td:has-text('承認者ID') + td"
      ).first();
      const firstApproverId = await approverIdField.textContent();

      const approvalDateField = page.locator(
        "[data-field='approvalDate'], .approval-date-field, td:has-text('承認日時') + td"
      ).first();
      const firstApprovalDate = await approvalDateField.textContent();

      // 2回リロードを実行
      for (let i = 0; i < 2; i++) {
        await page.reload();
        await page.waitForLoadState("networkidle");

        const currentApproverIdField = page.locator(
          "[data-field='approverId'], .approver-id-field, td:has-text('承認者ID') + td"
        ).first();
        const currentApproverId = await currentApproverIdField.textContent();

        const currentApprovalDateField = page.locator(
          "[data-field='approvalDate'], .approval-date-field, td:has-text('承認日時') + td"
        ).first();
        const currentApprovalDate = await currentApprovalDateField.textContent();

        expect(currentApproverId?.trim()).toBe(firstApproverId?.trim());
        expect(currentApprovalDate?.trim()).toBe(firstApprovalDate?.trim());
      }
    });
  });
});