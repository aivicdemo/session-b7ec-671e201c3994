import { test, expect } from '@playwright/test';

test.describe('作業実績データ送信', () => {
  test('入力された実績開始日時が終了日時より後のとき、検証エラーが表示されて送信は進まない', async ({ page }) => {
    // 作業指示・実績管理画面を開く
    await page.goto('/panels/scr-1789461813941.html');
    await page.waitForLoadState('networkidle');

    // 新規作業実績入力フォームにアクセスする
    // パフォーマンスフォームセクションが表示されるまで待つ
    const performanceFormSection = page.locator('#performance-form-section');
    await expect(performanceFormSection).toBeVisible();

    // 作業実績データの入力フィールドで、実績開始日時を「2024-01-15 14:30:00」に設定する
    const startDatetimeInput = page.locator('input[name="perf-start-datetime"], #perf-start-datetime');
    await startDatetimeInput.fill('2024-01-15T14:30:00');

    // 実績終了日時を「2024-01-15 14:00:00」に設定する（開始日時より30分前の日時）
    const endDatetimeInput = page.locator('input[name="perf-end-datetime"], #perf-end-datetime');
    await endDatetimeInput.fill('2024-01-15T14:00:00');

    // その他の必須項目に有効なデータを入力する
    // 作業指示ID
    const workInstructionIdInput = page.locator('#perf-work-instruction-id');
    await workInstructionIdInput.fill('WI-001');

    // 実績数
    const quantityInput = page.locator('#perf-quantity');
    await quantityInput.fill('10');

    // 不良数
    const defectsInput = page.locator('#perf-defects');
    await defectsInput.fill('0');

    // ステータス
    const statusSelect = page.locator('#perf-status');
    await statusSelect.selectOption('完了');

    // 「送信」ボタンをクリックする
    const submitButton = page.locator('#perf-submit-btn, button:has-text("実績を登録")');
    await submitButton.click();

    // 期待結果の検証
    // フォームの送信が進まず、入力フォーム上に検証エラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=実績開始日時は実績終了日時より前の日時を設定してください');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveCSS('color', /rgb\(220,\s*38,\s*38\)|red/i);

    // エラー対象の入力フィールド（開始日時および終了日時）が赤枠で強調表示されることを確認
    await expect(startDatetimeInput).toHaveCSS('border-color', /rgb\(220,\s*38,\s*38\)|red/i);
    await expect(endDatetimeInput).toHaveCSS('border-color', /rgb\(220,\s*38,\s*38\)|red/i);

    // パフォーマンスフォームセクションがまだ表示されていることを確認（画面が遷移していない）
    await expect(performanceFormSection).toBeVisible();
  });
});