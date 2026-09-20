import { test, expect } from '@playwright/test';

test.describe('SCEN-1332: 人員配置最適化提案画面表示 - 優先度ウェイト合計エラー', () => {
  test('優先度ウェイトの合計が100%でない場合、エラーメッセージが表示される', async ({ page }) => {
    // ブラウザのコンソールエラーを監視するため、最初にリスナーを登録
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // ログイン画面に遷移
    await page.goto('/');

    // ログイン処理
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("ログイン")');

    // 人員配置最適化提案・実行画面に遷移するまで待機
    await page.waitForURL('**/scr-1789461798629.html');
    await page.waitForLoadState('networkidle');

    // 優先度ウェイト設定フォームが表示されることを確認
    // proposals-containerを優先度ウェイト設定フォームとして確認
    const priorityWeightForm = page.locator('#proposals-container');
    await expect(priorityWeightForm).toBeVisible({ timeout: 5000 });

    // 優先度項目の入力フィールドを取得
    // 複数の優先度項目（納期、生産性、習熟度など）の入力フィールドを探す
    const weightInputs = page.locator('input[type="number"], input[type="text"][inputmode="numeric"]');

    const inputCount = await weightInputs.count();
    expect(inputCount).toBeGreaterThanOrEqual(3);

    // 各入力フィールドに優先度項目名が関連付けられていることを確認
    const firstInput = weightInputs.nth(0);
    const secondInput = weightInputs.nth(1);
    const thirdInput = weightInputs.nth(2);

    await expect(firstInput).toBeVisible();
    await expect(secondInput).toBeVisible();
    await expect(thirdInput).toBeVisible();

    // 複数の優先度項目に対して、合計が100%にならないウェイト値を入力
    // 例：納期40%、生産性30%、習熟度20%の合計90%
    await firstInput.fill('40');
    await secondInput.fill('30');
    await thirdInput.fill('20');

    // 入力値が反映されたことを確認
    await expect(firstInput).toHaveValue('40');
    await expect(secondInput).toHaveValue('30');
    await expect(thirdInput).toHaveValue('20');

    // フォーム送信ボタンをクリック
    // ボタンテキストから「人員配置案を自動生成」を選択
    await page.click('button:has-text("人員配置案を自動生成")');

    // エラーメッセージが画面に表示されることを確認
    const errorMessage = page.locator('text=優先度ウェイトの合計は100%である必要があります');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // エラーメッセージの正確なテキストを確認
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('優先度ウェイトの合計は100%である必要があります');

    // フォームが入力状態のまま保持されていることを確認
    await expect(firstInput).toHaveValue('40');
    await expect(secondInput).toHaveValue('30');
    await expect(thirdInput).toHaveValue('20');

    // ブラウザのコンソールにエラーが記録されていないことを確認
    expect(consoleErrors.length).toBe(0);
  });
});