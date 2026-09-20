import { test, expect } from '@playwright/test';

test('SCEN-1441: 遅延要因分類時に必要人数が0以下の場合、エラーが発生し分類が中止される', async ({ page }) => {
  // 作業指示・実績管理画面を開く
  await page.goto('/panels/scr-1789461813941.html');
  await page.waitForLoadState('networkidle');

  // 作業指示一覧テーブルが表示されていることを確認
  const workInstructionTable = page.locator('#work-instruction-tbody');
  await expect(workInstructionTable).toBeVisible();

  // テーブル内の行を取得
  const firstRow = workInstructionTable.locator('tr').first();
  await expect(firstRow).toBeVisible();

  // アクション列のボタンを探す
  // 行内の全ボタンを確認
  const actionArea = firstRow.locator('td').last();
  const delayClassificationButton = actionArea.locator('button, [role="button"]').first();

  await expect(delayClassificationButton).toBeVisible();
  await delayClassificationButton.click();

  // 遅延要因分類ダイアログ・フォームが表示されることを確認
  const dialog = page.locator('[id*="modal"], [role="dialog"], .modal-overlay').first();
  await expect(dialog).toBeVisible();

  // ダイアログ内の「必要人数」入力フィールドを取得
  const allInputs = dialog.locator('input[type="number"], input[type="text"]');
  let requiredPeopleInput = null;

  const inputCount = await allInputs.count();
  for (let i = 0; i < inputCount; i++) {
    const input = allInputs.nth(i);
    const parentLabel = await input.locator('..').locator('label').first().textContent();
    const placeholder = await input.getAttribute('placeholder');
    if ((parentLabel && parentLabel.includes('必要')) || (placeholder && placeholder.includes('必要'))) {
      requiredPeopleInput = input;
      break;
    }
  }

  // ラベルが見つからない場合、数値入力フィールドを試行
  if (!requiredPeopleInput) {
    requiredPeopleInput = dialog.locator('input[type="number"]').first();
  }

  await expect(requiredPeopleInput).toBeVisible();

  // ケース1: 「必要人数」に「0」を入力して確定
  await test.step('必要人数に0を入力して確定', async () => {
    await requiredPeopleInput.fill('0');

    // 入力確定（Enterキー）で確定
    await requiredPeopleInput.press('Enter');

    // エラーメッセージが画面に表示されることを確認
    const errorMessage = page.locator('text=/必要人数が不正です。1人以上の値を入力してください/');
    await expect(errorMessage).toBeVisible();

    // ダイアログ・フォームが入力状態のまま保持されていることを確認
    await expect(dialog).toBeVisible();

    // 入力欄がクリアされずそのまま保持されていることを確認
    await expect(requiredPeopleInput).toHaveValue('0');

    // 分類処理が実行されなかったことを確認（ダイアログがまだ開いている状態）
    await expect(dialog).toBeVisible();
  });

  // ケース2: 「必要人数」に負の値「-5」を入力して確定
  await test.step('必要人数に負の値を入力して確定', async () => {
    // フィールドをクリアして負の値を入力
    await requiredPeopleInput.clear();
    await requiredPeopleInput.fill('-5');

    // 入力確定（Enterキー）で確定
    await requiredPeopleInput.press('Enter');

    // 同一のエラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=/必要人数が不正です。1人以上の値を入力してください/');
    await expect(errorMessage).toBeVisible();

    // ダイアログ・フォームが閉じていないことを確認
    await expect(dialog).toBeVisible();

    // 入力欄がクリアされずそのまま保持されていることを確認
    await expect(requiredPeopleInput).toHaveValue('-5');

    // 分類処理が実行されなかったことを確認（ダイアログがまだ開いている状態）
    await expect(dialog).toBeVisible();
  });
});