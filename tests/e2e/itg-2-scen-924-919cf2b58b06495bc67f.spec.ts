import { test, expect, Page } from "@playwright/test";

test.describe("配置案却下", () => {
  test("入力値の形式が不正な状態で配置案却下操作を実行しようとするとき、入力値検証に失敗し却下操作が拒否される", async ({
    page,
  }) => {
    // 最適人員配置案提案・実行画面を開く
    await page.goto("/panels/scr-1789461978707.html");

    // システムから自動生成された配置案を表示させる
    const proposalElement = await page.locator("[data-testid='proposal']").first();
    await expect(proposalElement).toBeVisible();

    // 配置案に対する却下操作を実行するための入力フィールド（却下理由など）を確認する
    const rejectButton = await page.locator("[data-testid='reject-button']").first();
    await rejectButton.click();

    const rejectReasonInput = await page.locator(
      "[data-testid='reject-reason-input']"
    );
    await expect(rejectReasonInput).toBeVisible();

    // 却下理由の入力フィールドに意図的に不正な形式の値を入力する
    // 不正なパターン：SQLインジェクションパターン
    const invalidInput = "'; DROP TABLE proposals; --";
    await rejectReasonInput.fill(invalidInput);

    // 却下ボタンを押下する
    const confirmRejectButton = await page.locator(
      "[data-testid='confirm-reject-button']"
    );
    await confirmRejectButton.click();

    // 入力値検証エラーメッセージが画面に表示されるまで待機する
    const errorMessage = await page.locator("[data-testid='validation-error']");
    await expect(errorMessage).toBeVisible();

    // エラーメッセージは不正な入力項目と具体的な許可形式を明示している
    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText).toMatch(/却下理由|入力形式|許可|文字/i);

    // 却下操作は実行されず、配置案のステータスは『却下済み』に遷移せず、配置案提案・実行画面に留まる
    const proposalStatus = await proposalElement.getAttribute("data-status");
    expect(proposalStatus).not.toBe("rejected");

    // 配置案提案・実行画面に留まることを確認
    const currentUrl = page.url();
    expect(currentUrl).toContain("scr-1789461978707");
  });

  test("入力値の形式が不正な状態で配置案却下操作を実行しようとするとき、指定文字数を超える入力で検証エラーが表示される", async ({
    page,
  }) => {
    // 最適人員配置案提案・実行画面を開く
    await page.goto("/panels/scr-1789461978707.html");

    // システムから自動生成された配置案を表示させる
    const proposalElement = await page.locator("[data-testid='proposal']").first();
    await expect(proposalElement).toBeVisible();

    // 配置案に対する却下操作を実行するための入力フィールドを確認する
    const rejectButton = await page.locator("[data-testid='reject-button']").first();
    await rejectButton.click();

    const rejectReasonInput = await page.locator(
      "[data-testid='reject-reason-input']"
    );
    await expect(rejectReasonInput).toBeVisible();

    // 指定文字数を超える文字列を入力
    const oversizedInput = "a".repeat(1000);
    await rejectReasonInput.fill(oversizedInput);

    // 却下ボタンを押下する
    const confirmRejectButton = await page.locator(
      "[data-testid='confirm-reject-button']"
    );
    await confirmRejectButton.click();

    // 入力値検証エラーメッセージが表示される
    const errorMessage = await page.locator("[data-testid='validation-error']");
    await expect(errorMessage).toBeVisible();

    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText).toMatch(/文字数|超え|最大|制限/i);

    // 却下操作は実行されず、配置案提案・実行画面に留まる
    const proposalStatus = await proposalElement.getAttribute("data-status");
    expect(proposalStatus).not.toBe("rejected");

    const currentUrl = page.url();
    expect(currentUrl).toContain("scr-1789461978707");
  });

  test("入力値の形式が不正な状態で配置案却下操作を実行しようとするとき、許可されない記号入力で検証エラーが表示される", async ({
    page,
  }) => {
    // 最適人員配置案提案・実行画面を開く
    await page.goto("/panels/scr-1789461978707.html");

    // システムから自動生成された配置案を表示させる
    const proposalElement = await page.locator("[data-testid='proposal']").first();
    await expect(proposalElement).toBeVisible();

    // 配置案に対する却下操作を実行するための入力フィールドを確認する
    const rejectButton = await page.locator("[data-testid='reject-button']").first();
    await rejectButton.click();

    const rejectReasonInput = await page.locator(
      "[data-testid='reject-reason-input']"
    );
    await expect(rejectReasonInput).toBeVisible();

    // 許可されない記号を含む入力
    const invalidCharacterInput = "<script>alert('xss')</script>";
    await rejectReasonInput.fill(invalidCharacterInput);

    // 却下ボタンを押下する
    const confirmRejectButton = await page.locator(
      "[data-testid='confirm-reject-button']"
    );
    await confirmRejectButton.click();

    // 入力値検証エラーメッセージが表示される
    const errorMessage = await page.locator("[data-testid='validation-error']");
    await expect(errorMessage).toBeVisible();

    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText).toMatch(/許可|文字種|記号|使用|禁止/i);

    // 却下操作は実行されず、配置案のステータスは変わらない
    const proposalStatus = await proposalElement.getAttribute("data-status");
    expect(proposalStatus).not.toBe("rejected");

    // 配置案提案・実行画面に留まる
    const currentUrl = page.url();
    expect(currentUrl).toContain("scr-1789461978707");
  });
});