import { test, expect } from "@playwright/test";

test("SCEN-909: 配置案詳細表示で、配置案生成時の比較分析結果が参照され、配置案の妥当性根拠が表示される", async ({
  page,
}) => {
  // ログイン画面にアクセス
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // ログイン処理（テスト前提として認証を完了）
  await page.fill('input[placeholder*="ID"]', "testuser");
  await page.fill('input[placeholder*="パスワード"]', "password");
  await page.click("button:has-text('ログイン')");
  await page.waitForLoadState("networkidle");

  // 最適人員配置案提案・実行画面にアクセス
  await test.step("最適人員配置案提案・実行画面にアクセスする", async () => {
    await page.goto("/panels/scr-1789461978707.html");
    await page.waitForLoadState("networkidle");
  });

  // 生成済みの配置案を一覧から選択
  await test.step("生成済みの配置案を一覧から選択して、配置案詳細表示画面を開く", async () => {
    // 配置案リスト内の最初の配置案をクリック
    const proposalItem = page.locator(
      "[data-testid='proposal-list-item']:first-child"
    );
    await proposalItem.click();
    await page.waitForLoadState("networkidle");
  });

  // 配置案詳細表示画面が表示されていることを確認
  await test.step("配置案詳細表示画面が表示される", async () => {
    const detailPanel = page.locator("[data-testid='proposal-detail-panel']");
    await expect(detailPanel).toBeVisible();
  });

  // 比較分析結果セクションを確認
  await test.step("比較分析結果セクション内に『生産性改善率』の項目が表示されていることを確認する", async () => {
    const productivitySection = page.locator(
      "[data-testid='comparison-analysis-section']"
    );
    await expect(productivitySection).toBeVisible();

    const productivityRateItem = productivitySection.locator(
      "text=/生産性改善率/"
    );
    await expect(productivityRateItem).toBeVisible();

    // 生産性改善率の数値が表示されていることを確認（例：15.3%改善）
    const productivityRateValue = productivitySection.locator(
      "[data-testid='productivity-improvement-rate']"
    );
    await expect(productivityRateValue).toBeVisible();
    const rateText = await productivityRateValue.textContent();
    expect(rateText).toMatch(/[\d.]+%/);
  });

  // 統計的有意性の項目が表示されていることを確認
  await test.step("比較分析結果セクション内に『統計的有意性』の項目が表示されていることを確認する", async () => {
    const comparisonSection = page.locator(
      "[data-testid='comparison-analysis-section']"
    );

    const significanceItem = comparisonSection.locator(
      "text=/統計的有意性/"
    );
    await expect(significanceItem).toBeVisible();

    // p値と有意水準が表示されていることを確認
    const significanceValue = comparisonSection.locator(
      "[data-testid='statistical-significance']"
    );
    await expect(significanceValue).toBeVisible();
    const significanceText = await significanceValue.textContent();
    expect(significanceText).toMatch(/p[\s値]*[\d.=]+/);
  });

  // 配置案の妥当性根拠セクションが同一画面に表示されていることを確認
  await test.step("配置案の妥当性根拠セクションが同一画面に表示されていることを確認する", async () => {
    const reasonabilitySection = page.locator(
      "[data-testid='proposal-rationale-section']"
    );
    await expect(reasonabilitySection).toBeVisible();

    // 妥当性根拠が表示されていることを確認
    const rationaleText = reasonabilitySection.locator(
      "[data-testid='rationale-content']"
    );
    await expect(rationaleText).toBeVisible();
    const content = await rationaleText.textContent();
    expect(content).toBeTruthy();
    expect(content).toMatch(/生産性|統計的に有意/);
  });

  // 最終確認：両セクションが視認範囲内にあることを確認
  await test.step("配置案詳細表示画面に、生産性改善率と統計的有意性、および妥当性根拠が同一画面の視認範囲内に記載されていること", async () => {
    const detailPanel = page.locator("[data-testid='proposal-detail-panel']");

    // 比較分析結果セクションが表示範囲内にあることを確認
    const comparisonSection = page.locator(
      "[data-testid='comparison-analysis-section']"
    );
    await expect(comparisonSection).toBeInViewport();

    // 妥当性根拠セクションが表示範囲内にあることを確認
    const reasonabilitySection = page.locator(
      "[data-testid='proposal-rationale-section']"
    );
    await expect(reasonabilitySection).toBeInViewport();

    // 生産性改善率の数値が含まれていることを確認
    const improvementRateElement = page.locator(
      "[data-testid='productivity-improvement-rate']"
    );
    const rateValue = await improvementRateElement.textContent();
    expect(rateValue).toMatch(/[\d.]+%/);

    // 統計的有意性の数値が含まれていることを確認
    const significanceElement = page.locator(
      "[data-testid='statistical-significance']"
    );
    const sigValue = await significanceElement.textContent();
    expect(sigValue).toBeTruthy();

    // 妥当性根拠が生産性と統計的有意性に基づいた内容であることを確認
    const rationaleContent = page.locator(
      "[data-testid='rationale-content']"
    );
    const rationale = await rationaleContent.textContent();
    expect(rationale).toMatch(
      /(?:現配置比|統計的に有意|生産性|推奨)/
    );
  });
});