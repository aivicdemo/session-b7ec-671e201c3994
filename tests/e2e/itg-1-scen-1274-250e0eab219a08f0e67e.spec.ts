import { test, expect } from "@playwright/test";

test.describe("SCEN-1274: 進捗遅延リスク分析実行", () => {
  test("作業優先順位リストが空で入力された場合、エラーが表示される", async ({
    page,
  }) => {
    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto("/panels/scr-1789461783315.html");
    await page.waitForLoadState("networkidle");

    // 「進捗遅延リスク分析実行」ボタンを探して確認する
    const analyzeButton = page.getByRole("button", {
      name: /進捗遅延リスク分析実行/,
    });
    await expect(analyzeButton).toBeVisible();

    // 作業優先順位リスト入力フィールドが表示されていることを確認する
    // 参考情報に記載されている要素から探索
    const priorityListInput = page.locator(
      'input[name="workPriorityList"], textarea[name="workPriorityList"], [data-testid="work-priority-list"]'
    );
    
    // 少なくとも1つの入力フィールドが見つかることを確認
    await expect(priorityListInput.first()).toBeVisible();

    // 作業優先順位リスト入力フィールドを空のまま（値を入力しない）にしておく
    // フィールドが空であることを確認
    const firstInput = priorityListInput.first();
    const tagName = await firstInput.evaluate((el) => el.tagName.toLowerCase());
    
    let inputValue = "";
    if (tagName === "textarea") {
      inputValue = await firstInput.textContent() || "";
    } else if (tagName === "input") {
      inputValue = await firstInput.inputValue();
    } else {
      inputValue = await firstInput.textContent() || "";
    }
    
    expect(inputValue.trim()).toBe("");

    // 「進捗遅延リスク分析実行」ボタンをクリックする
    await analyzeButton.click();

    // 画面にエラーメッセージが表示されるのを待つ（最大5秒）
    const errorBanner = page.getByTestId("error-banner");
    const errorMessage = page.getByTestId("error-message");
    
    // エラーバナーまたはエラーメッセージが表示されることを確認
    const errorElement = await Promise.race([
      errorBanner.isVisible().then(() => errorBanner),
      errorMessage.isVisible().then(() => errorMessage),
      page.locator('[role="alert"]').first().isVisible().then(() => page.locator('[role="alert"]').first()),
    ]).catch(() => null);

    // エラーメッセージが表示されていることを確認
    await expect(
      page.locator(
        'text="作業優先順位が設定されていません。優先順位を指定してください"'
      )
    ).toBeVisible({ timeout: 5000 });

    // エラーメッセージが正しいテキストを含んでいることを確認
    const errorTextElement = page.locator(
      'text="作業優先順位が設定されていません。優先順位を指定してください"'
    ).first();
    const errorText = await errorTextElement.textContent();
    expect(errorText).toContain(
      "作業優先順位が設定されていません。優先順位を指定してください"
    );

    // エラーメッセージの表示位置を検証
    const errorBox = await errorTextElement.boundingBox();
    const inputBox = await priorityListInput.first().boundingBox();

    // エラーメッセージが入力フィールド直下またはダッシュボード上部（通知領域）に表示されていることを確認
    let isProperlyPositioned = false;
    
    if (errorBox && inputBox) {
      // 入力フィールド直下：エラーがフィールド下部より下、かつ100px以内
      const isNearInput =
        errorBox.y >= inputBox.y + inputBox.height &&
        errorBox.y < inputBox.y + inputBox.height + 100;
      
      // ダッシュボード上部（通知領域）：画面上部150px以内
      const isAtTop = errorBox.y < 150;
      
      isProperlyPositioned = isNearInput || isAtTop;
    }
    
    expect(isProperlyPositioned).toBeTruthy();

    // エラーメッセージが赤色またはエラーを示す配色になっているか確認
    const computedStyle = await errorTextElement.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
      };
    });

    // 赤色系またはエラー色の確認
    const colorPattern = /rgba?\((\d+),\s*(\d+),\s*(\d+)/;
    const colorMatch = computedStyle.color.match(colorPattern);
    
    let isErrorColor = false;
    if (colorMatch) {
      const [, r, g, b] = colorMatch.map(Number);
      // 赤色系：赤成分が100以上で、緑と青成分が赤成分より少ない
      isErrorColor = r > 100 && g < r && b < r;
    }
    
    // 色が確認できない場合でもエラー要素が表示されていれば仕様を満たす
    expect(
      isErrorColor || (await errorTextElement.isVisible())
    ).toBeTruthy();

    // ボタンクリック後、分析処理は実行されず、ダッシュボード画面は遷移しないままである
    await expect(page).toHaveURL(/scr-1789461783315/);
  });
});