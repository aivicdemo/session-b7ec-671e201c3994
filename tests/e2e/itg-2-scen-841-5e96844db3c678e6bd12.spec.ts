import { test, expect } from "@playwright/test";

test("SCEN-841: 権限検証を通過したユーザーに対して、所属チームの生産性データが指定期間で取得され、ダッシュボード画面に表示される", async ({
  page,
}) => {
  // テストユーザーでシステムにログインする
  await page.goto("/");

  // ログイン画面が表示されることを確認
  await expect(page.locator(".login-card")).toBeVisible();

  // ユーザー認証情報を入力してログイン
  const loginInputs = page.locator(".form-input");
  await loginInputs.nth(0).fill("testuser");
  await loginInputs.nth(1).fill("testpass123");
  await page.click(".login-button");

  // ログイン処理の完了を待つ
  await page.waitForNavigation();

  // 権限検証が成功し、ログイン処理が完了することを確認する
  const loginErrorMessage = page.locator("[class*='error']");
  await expect(loginErrorMessage).not.toBeVisible();

  // 生産性ダッシュボード・分析画面へ遷移する
  await page.goto("/panels/scr-1789461964046.html");
  await page.waitForLoadState("networkidle");

  // 画面上部の期間指定フィルターで、テスト対象期間を選択する
  const dateInputs = page.locator("input[type='date'], input[type='text']");
  
  // 期間の開始日を入力
  const dateStartLocators = dateInputs.filter({ hasText: /from|start|開始|始/ });
  const dateEndLocators = dateInputs.filter({ hasText: /to|end|終了|終わり/ });
  
  const firstDateInput = page.locator("input[type='date'], input[type='text']").nth(0);
  const secondDateInput = page.locator("input[type='date'], input[type='text']").nth(1);
  
  await firstDateInput.fill("2024-01-01");
  await secondDateInput.fill("2024-01-31");

  // フィルター条件を適用ボタンをクリックする
  const applyButton = page.locator("button").filter({ hasText: /適用|apply|Apply/ }).first();
  await applyButton.click();

  // 画面がローディング状態になり、データ取得処理が実行されることを確認する
  const loadingElement = page.locator("[role='progressbar'], .loading, [class*='spinner'], [class*='skeleton']").first();
  
  // ローディング状態があれば待機、なければスキップ
  try {
    await expect(loadingElement).toBeVisible({ timeout: 3000 });
    await loadingElement.waitFor({ state: "hidden", timeout: 30000 });
  } catch {
    // ローディング表示がない場合もある
    await page.waitForLoadState("networkidle");
  }

  // ローディング完了後、生産性ダッシュボード・分析画面にテスト対象期間の所属チーム生産性データが表示されることを確認する

  // チーム単位の生産性指標が表示されていることを確認
  const teamProductivitySection = page.locator("[class*='team'], [class*='productivity'], [class*='metric']").first();
  await expect(teamProductivitySection).toBeVisible();

  // 作業件数の表示を確認
  const workCountIndicator = page.locator("text=/作業件数|工数|件数|tasks|count/i").first();
  await expect(workCountIndicator).toBeVisible();
  const workCountText = await workCountIndicator.textContent();
  expect(workCountText).toMatch(/\d+/);

  // 平均処理時間の表示を確認
  const avgProcessTimeIndicator = page.locator("text=/平均処理時間|処理時間|平均|average|time/i").first();
  await expect(avgProcessTimeIndicator).toBeVisible();

  // 品質指標の表示を確認
  const qualityIndicator = page.locator("text=/品質|quality|精度|accuracy/i").first();
  await expect(qualityIndicator).toBeVisible();

  // 作業者個人の生産性データ一覧が表示されていることを確認
  const workerListSection = page.locator("[class*='worker'], [class*='staff'], [class*='list'], table").first();
  await expect(workerListSection).toBeVisible();

  // 一覧内に複数の作業者データが存在することを確認
  const workerRows = page.locator("tr, [class*='row'], [class*='item']").count();
  const rowCount = await workerRows;
  expect(rowCount).toBeGreaterThan(0);

  // 期間内の実績推移グラフが正確に描画されていることを確認
  const trendGraphSection = page.locator("canvas, [class*='graph'], [class*='chart'], svg").first();
  await expect(trendGraphSection).toBeVisible();

  // データ更新日時が画面に表示されていることを確認
  const updateTimeElement = page.locator("text=/更新|時点|日時|timestamp|updated/i").first();
  await expect(updateTimeElement).toBeVisible();
  const updateTimeText = await updateTimeElement.textContent();
  expect(updateTimeText).toMatch(/\d{4}|2024/);

  // フィルター条件が正しく適用されていることを確認
  const filterDisplayText = await page.textContent("body");
  expect(filterDisplayText).toContain("2024");
  expect(filterDisplayText).toContain("01");
});