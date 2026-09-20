import { test, expect } from "@playwright/test";

test.describe("SCEN-857: 最適人員配置案表示 - 納期超過時のエラーハンドリング", () => {
  test("既に納期を超過している場合、エラーメッセージが表示されて処理が中断される", async ({
    page,
  }) => {
    // ステップ1: 生産性ダッシュボード・分析画面にログインし、納期超過状態のプロジェクトを含むデータセットを準備
    await page.goto("/");

    // ログイン画面が表示されるまで待機
    await page.waitForSelector(".login-card");

    // テスト用の認証情報でログイン
    await page.fill('input[type="text"]', "testuser");
    await page.fill('input[type="password"]', "testpass");
    await page.click("button[type='submit']");

    // ログイン後の画面遷移が完了するまで待機
    await page.waitForNavigation();

    // 生産性ダッシュボード・分析画面への移動を確認
    await expect(page).toHaveURL(/\/panels\/scr-1789461964046/);

    // 納期超過状態のプロジェクトを含むデータセットが存在することを確認
    // 実際に要素が表示されていることを検証
    const overdueProjectElement = page.locator(
      "[data-overdue='true'], .overdue-project, [data-status='overdue']"
    );
    await expect(overdueProjectElement).toBeVisible();

    // ステップ2: 最適人員配置案提案・実行画面へ遷移
    await page.goto("/panels/scr-1789461978707.html");
    await page.waitForLoadState("networkidle");

    // ステップ3: 納期超過状態のプロジェクトを対象として、最適人員配置案の自動生成を実行するボタンをクリック
    // 納期超過プロジェクトを明示的に選択
    const projectSelector = page.locator(
      "select[name='project'], [data-testid='project-selector']"
    );

    let overdueProjectSelected = false;
    if (await projectSelector.isVisible()) {
      // セレクトボックスのすべてのオプションを確認
      const options = await projectSelector.locator("option").all();
      for (const option of options) {
        const optionText = await option.textContent();
        const optionValue = await option.getAttribute("value");
        const isOverdue = await option.getAttribute("data-overdue");

        // 納期超過フラグまたはテキストから納期超過プロジェクトを特定
        if (isOverdue === "true" || (optionText && optionText.includes("超過"))) {
          await projectSelector.selectOption(optionValue || "");
          overdueProjectSelected = true;
          break;
        }
      }

      // フラグが見つからない場合、データ属性で検索
      if (!overdueProjectSelected) {
        const overdueOption = projectSelector.locator(
          "option[data-overdue='true']"
        );
        if (await overdueOption.isVisible()) {
          const overdueValue = await overdueOption.getAttribute("value");
          await projectSelector.selectOption(overdueValue || "");
          overdueProjectSelected = true;
        }
      }
    }

    // 納期超過プロジェクトが選択されたことを確認
    // 選択に失敗した場合はテストを失敗させる
    expect(overdueProjectSelected).toBe(true);

    // 自動生成ボタンをクリック
    const generateButton = page.locator(
      "button:has-text('自動生成'), button[data-testid='generate-optimal-placement']"
    );
    await generateButton.click();

    // ステップ4: システムが納期超過の判定ロジックを実行して処理結果を返す
    // エラーメッセージが表示されるまで待機
    await page.waitForSelector("[role='alert'], .error-message, .alert");

    // 期待結果の検証: エラーメッセージが表示されている
    const errorMessage = page.locator(
      "text=/納期を超過しているため、最適人員配置案の生成はできません|納期超過|既に納期を超過/"
    );
    await expect(errorMessage).toBeVisible();

    // 期待結果の検証: 画面が最適人員配置案提案・実行画面に留まっている
    await expect(page).toHaveURL(/\/panels\/scr-1789461978707/);

    // 期待結果の検証: 最適人員配置案の生成処理が実行されていないことを確認
    // 生成結果が追加されていないことを確認
    const generatedResultsTable = page.locator(
      "[data-testid='generated-results'], .generated-results, table"
    );

    // 生成処理が中断されていることを確認
    // 結果テーブルが表示されている場合、行数が0であることを確認
    const isTableVisible = await generatedResultsTable.isVisible().catch(() => false);
    if (isTableVisible) {
      const rows = await generatedResultsTable.locator("tbody tr").count();
      expect(rows).toBe(0);
    } else {
      // 結果テーブルが表示されていないことで、処理が実行されていないことを確認
      await expect(generatedResultsTable).not.toBeVisible();
    }

    // 読み込み中状態が表示されていないことを確認
    const loadingSpinner = page.locator(
      "[data-testid='loading'], .spinner, .processing"
    );
    await expect(loadingSpinner).not.toBeVisible();

    // 処理成功のメッセージが表示されていないことを確認
    const successMessage = page.locator(
      "text=/生成完了|成功|処理が完了しました/"
    );
    await expect(successMessage).not.toBeVisible();
  });
});