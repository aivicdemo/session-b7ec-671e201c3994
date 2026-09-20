import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-982: 実績データ保存 - エラー系', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('所要時間が負の値で送信されると、入力データ検証段階で拒否される', async () => {
    // 作業実績データ記録・入力画面を開く
    await page.goto('/panels/scr-1789461993203.html');
    await page.waitForLoadState('networkidle');

    // 作業者を選択
    const workerSelect = page.locator('select[name="worker"], [data-testid="worker-select"], label:has-text("作業者") ~ select, label:has-text("作業者") ~ div input');
    await workerSelect.first().click();
    const workerOptions = page.locator('option, [role="option"]');
    const firstWorkerOption = workerOptions.nth(1);
    await firstWorkerOption.click();

    // 作業タイプを指定
    const workTypeSelect = page.locator('select[name="workType"], [data-testid="work-type-select"], label:has-text("作業タイプ") ~ select, label:has-text("作業タイプ") ~ div input');
    await workTypeSelect.first().click();
    const workTypeOptions = page.locator('option, [role="option"]');
    const firstWorkTypeOption = workTypeOptions.nth(1);
    await firstWorkTypeOption.click();

    // 部門を指定
    const departmentSelect = page.locator('select[name="department"], [data-testid="department-select"], label:has-text("部門") ~ select, label:has-text("部門") ~ div input');
    await departmentSelect.first().click();
    const departmentOptions = page.locator('option, [role="option"]');
    const firstDepartmentOption = departmentOptions.nth(1);
    await firstDepartmentOption.click();

    // 所要時間（分）に負の値を入力
    const timeInput = page.locator('input[name="time"], input[name="requiredTime"], input[type="number"][placeholder*="時間"], [data-testid="required-time-input"]');
    await timeInput.first().fill('-30');

    // 保存ボタンをクリック
    const saveButton = page.locator('button:has-text("保存"), button[type="submit"]:has-text("保存")');
    await saveButton.first().click();

    // 検証メッセージ表示エリアを確認
    const errorMessage = page.locator('[role="alert"], .error-message, .validation-error, [data-testid="error-message"]');
    
    // エラーメッセージが表示される
    await expect(errorMessage.first()).toBeVisible();
    
    // メッセージテキストに期待される内容が含まれる
    await expect(errorMessage.first()).toContainText(/所要時間は0より大きい値を入力してください|所要時間は正の値を入力してください|所要時間は0を超える値が必要です/);

    // 画面は作業実績データ記録・入力画面のままであることを確認
    await expect(page).toHaveURL(/scr-1789461993203/);

    // 入力内容が保持されていることを確認
    await expect(timeInput.first()).toHaveValue('-30');
  });
});