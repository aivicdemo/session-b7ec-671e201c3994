import { test, expect } from "@playwright/test";

test("SCEN-1417: 取得した人員配置案に参照整合性の問題があると、検証エラーで配信が中止される", async ({
  page,
}) => {
  // ステップ1: 人員配置最適化提案・実行画面にアクセスし、最新の人員配置案を表示する状態にする
  await page.goto("/panels/scr-1789461798629.html");

  // 配置案が読み込まれるのを待つ
  await page.waitForSelector('[id="proposals-container"]', { timeout: 10000 });

  // 配置案が表示されていることを確認
  const proposalsContainer = page.locator('[id="proposals-container"]');
  await expect(proposalsContainer).toBeVisible();

  // 配置案要素の取得
  const proposals = await proposalsContainer.locator("div[data-proposal-id]").all();
  
  // 最初の配置案を選択
  const selectedProposal = proposals[0];

  // ステップ2: 配置案が画面に表示された状態で、配信モーダル内の「確定」ボタンをクリックする
  // 選択した配置案をクリック
  await selectedProposal.click();

  // 配置案の詳細が表示されるのを待つ
  await page.waitForSelector('[id="proposal-detail-container"]');

  // 配信ボタンをクリック
  const distributeButton = page.getByTestId("distribute-button");
  await distributeButton.click();

  // 配信モーダルが表示されるのを待つ
  const distributeModal = page.locator('[id="distribute-modal-overlay"]');
  await expect(distributeModal).toBeVisible();

  // ステップ3: 配置案データに参照整合性の問題が含まれている場合、検証ロジックが実行されるまで待機する
  // 配信モーダル内の「確定」ボタンをクリック
  const distributeConfirmButton = page.getByTestId("distribute-modal-confirm");
  await distributeConfirmButton.click();

  // 検証エラーが発生するまで待つ
  // 期待結果の確認:
  // 1. エラーメッセージが赤枠で表示される
  const errorBanner = page.locator('[id="error-banner"]');
  await expect(errorBanner).toBeVisible({ timeout: 10000 });

  // 赤枠スタイルの確認（背景色または枠線が赤系であることを確認）
  const errorBannerStyle = await errorBanner.evaluate((el) => {
    const computedStyle = window.getComputedStyle(el);
    return {
      borderColor: computedStyle.borderColor,
      backgroundColor: computedStyle.backgroundColor,
      borderWidth: computedStyle.borderWidth,
    };
  });

  // 背景色または枠線が赤系（赤、RGB赤成分が高い）であることを確認
  const isRedStyled = 
    errorBannerStyle.borderColor.includes("rgb") && 
    (errorBannerStyle.borderColor.includes("255, 0") || 
     errorBannerStyle.borderColor.includes("red")) ||
    (errorBannerStyle.backgroundColor.includes("rgb") && 
     errorBannerStyle.backgroundColor.includes("255")) ||
    errorBannerStyle.borderColor.toLowerCase().includes("red");

  await expect(errorBanner).toHaveCSS("border-color", /.*rgb\(.*255.*0.*0.*\).*|.*red.*/i);

  const errorMessage = page.locator('[id="error-message"]');
  await expect(errorMessage).toContainText(
    "配置案に不整合があります。対象の拠点IDまたは作業者IDが見つかりません。管理者に確認してください"
  );

  // 2. 配信モーダルが閉じられていないことを確認
  await expect(distributeModal).toBeVisible();

  // 3. 確定ボタンがdisabled状態になっていることを確認
  await expect(distributeConfirmButton).toBeDisabled();
});