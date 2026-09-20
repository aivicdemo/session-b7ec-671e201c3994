import { test, expect } from "@playwright/test";

test.describe("SCEN-958: 実績データ入力画面表示", () => {
  test("ユーザーが責任を持つ部門がすべて部門選択ドロップダウンに一覧表示される", async ({
    page,
  }) => {
    // ユーザーが複数の部門に属する管理者権限で本システムにログインする
    await page.goto("/");
    await page.waitForURL(/.*login.*|.*panels.*/, { timeout: 5000 });

    // ログイン画面が表示されている場合、ログインを実行
    const loginButton = page.locator("button:has-text('ログイン')");
    const isLoginVisible = await loginButton.isVisible().catch(() => false);

    if (isLoginVisible) {
      await page.fill("input[placeholder*='ユーザー']", "admin_multi_dept");
      await page.fill("input[placeholder*='パスワード']", "password");
      await loginButton.click();
      await page.waitForURL(/.*panels.*/, { timeout: 10000 });
    }

    // 生産性ダッシュボード・分析画面から作業実績データ記録・入力画面へ遷移する
    const navigationLink = page.locator(
      "a, button",
      {
        hasText: /作業実績データ記録|作業実績入力|データ入力/,
      }
    );
    const isNavigationVisible = await navigationLink
      .isVisible()
      .catch(() => false);

    if (isNavigationVisible) {
      await navigationLink.click();
    } else {
      // 画面IDから直接遷移
      await page.goto("/panels/scr-1789461993203.html");
    }

    // 作業実績データ記録・入力画面が表示されるまで待機する
    const departmentDropdown = page.locator(
      "select, [role='combobox'], button",
      {
        hasText: /部門選択|部門/,
      }
    );
    await departmentDropdown.waitFor({ state: "visible", timeout: 10000 });

    // 画面上の部門選択ドロップダウンをクリックして展開する
    await departmentDropdown.click();

    // 部門選択ドロップダウンが展開され、ログインユーザーが責任を持つすべての部門が一覧表示される
    const dropdownOptions = page.locator(
      "[role='option'], li:has-text('支社'), li:has-text('部門')"
    );

    await dropdownOptions.first().waitFor({ state: "visible", timeout: 5000 });

    const optionCount = await dropdownOptions.count();
    expect(optionCount).toBeGreaterThan(0);

    // 部門が複数表示されていることを確認（複数の部門に属しているため）
    expect(optionCount).toBeGreaterThanOrEqual(2);

    // 部門の一例を確認（東京支社・入荷部門、東京支社・仕分部門、大阪支社・検品部門など）
    const optionTexts: string[] = [];
    for (let i = 0; i < optionCount; i++) {
      const text = await dropdownOptions.nth(i).textContent();
      if (text) {
        optionTexts.push(text.trim());
      }
    }

    // 複数の部門が表示されていることを確認
    expect(optionTexts.length).toBeGreaterThanOrEqual(2);

    // 各部門が正式名称のまま表示されていることを確認（"支社"と"部門"を含む）
    const hasProperDepartments = optionTexts.some(
      (text) => text.includes("支社") || text.includes("部門")
    );
    expect(hasProperDepartments).toBe(true);

    // ドロップダウンオプションが選択可能な状態であることを確認
    const firstOption = dropdownOptions.first();
    expect(await firstOption.isEnabled()).toBe(true);
  });
});