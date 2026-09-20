import { test, expect } from '@playwright/test';

test('SCEN-862: 実績データ記録入力画面で入力値が検証に不合格の場合、エラーメッセージが表示されて入力画面に留まる', async ({ page }) => {
  // 作業実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  
  // 入力フィールドの情報を事前に取得
  const otherInputs = page.locator('input[type="text"], input[type="number"], textarea, select');
  const inputCount = await otherInputs.count();
  
  // 入力値を保存するためのマップ
  const inputValues = new Map<string, string>();
  
  // 必須項目である「作業タイプ」フィールドを空白のまま、その他の任意項目に正常な値を入力する
  for (let i = 0; i < inputCount; i++) {
    const input = otherInputs.nth(i);
    const inputType = await input.getAttribute('type');
    const inputName = await input.getAttribute('name');
    const inputId = await input.getAttribute('id');
    
    // 作業タイプフィールドは明示的にスキップ（空白のままにする）
    if (inputName?.toLowerCase().includes('worktype') || inputId?.toLowerCase().includes('worktype')) {
      continue;
    }
    
    // サンプル値を入力して値を記録
    let sampleValue = '';
    if (inputType === 'number') {
      sampleValue = '100';
      await input.fill(sampleValue);
    } else if (inputType === 'text' || !inputType) {
      sampleValue = 'サンプル値';
      await input.fill(sampleValue);
    }
    
    // 入力値をマップに記録
    const key = inputName || inputId || `input_${i}`;
    inputValues.set(key, sampleValue);
  }
  
  // 「保存」ボタンをクリックする
  const saveButton = page.locator('button:has-text("保存"), button:has-text("送信"), button:has-text("登録")').first();
  await saveButton.click();
  
  // 画面の状態を確認する
  // 「作業タイプ」の必須項目未入力エラーメッセージが画面上部に表示されることを確認
  const errorMessage = page.locator('text=/作業タイプ.*必須|必須.*作業タイプ/i');
  await expect(errorMessage).toBeVisible();
  
  // 作業実績データ記録・入力画面に留まったまま遷移していないことを確認
  await expect(page).toHaveURL(/scr-1789461993203/);
  
  // 入力済みの値が画面に保持されていることを確認
  for (const [key, expectedValue] of inputValues.entries()) {
    const input = page.locator(`[name="${key}"], [id="${key}"]`).first();
    const actualValue = await input.inputValue().catch(() => '');
    expect(actualValue).toBe(expectedValue);
  }
});