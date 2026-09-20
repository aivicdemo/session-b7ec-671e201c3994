import { test, expect } from '@playwright/test';

test('SCEN-979: エラー系：作業者IDが空または不正な形式で送信されると、入力データ検証段階で拒否される', async ({ page }) => {
  // リクエストの監視を開始（ボタンクリック前）
  let requestMade = false;
  const requestListener = (request: any) => {
    if ((request.method() === 'POST' || request.method() === 'PUT') && request.url().includes('/api/')) {
      requestMade = true;
    }
  };
  page.on('request', requestListener);

  // 作業実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  
  // ページが読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // 作業者IDフィールドを取得
  const workerIdField = page.locator('input[name="workerId"], input[placeholder*="作業者"], input[placeholder*="ID"]').first();
  
  // 作業者IDフィールドを空のまま（値を入力しない）に設定する
  await workerIdField.click();
  await workerIdField.clear();

  // その他の必須フィールドに有効な値を入力する
  // 作業タイプフィールド
  const workTypeField = page.locator('input[name="workType"], select[name="workType"]').first();
  const workTypeTagName = await workTypeField.evaluate(el => el.tagName);
  
  if (workTypeTagName === 'SELECT') {
    // セレクトボックスの場合
    await workTypeField.selectOption({ index: 1 });
  } else {
    // テキスト入力フィールドの場合
    await workTypeField.fill('通常作業');
  }

  // 部門フィールド
  const departmentField = page.locator('input[name="department"], select[name="department"]').first();
  const departmentTagName = await departmentField.evaluate(el => el.tagName);
  
  if (departmentTagName === 'SELECT') {
    // セレクトボックスの場合
    await departmentField.selectOption({ index: 1 });
  } else {
    // テキスト入力フィールドの場合
    await departmentField.fill('製造部');
  }

  // 作業時間フィールド
  const workTimeField = page.locator('input[name="workTime"]').first();
  await workTimeField.fill('8');

  // 「保存」ボタンをクリックする
  const saveButton = page.locator('button:has-text("保存"), button[type="submit"]:has-text("保存")').first();
  await saveButton.click();

  // ページ側のバリデーションが実行される時間を確保
  await page.waitForTimeout(300);

  // リクエスト監視を停止
  page.off('request', requestListener);

  // 作業者IDフィールドの直下にバリデーションエラーメッセージが表示されることを確認
  // フィールド直下のエラーメッセージ候補を複数取得（div, span, p, .error, [role="alert"]など）
  const errorMessageLocator = page.locator('[data-testid*="error"], .error-message, .validation-error, .field-error').filter({
    has: page.locator('text=/作業者ID(は必須項目です|が入力されていません)/')
  }).first();

  // またはフィールド直後の兄弟要素内にエラーメッセージがないか確認
  const fieldParent = workerIdField.locator('xpath=ancestor::div[contains(@class, "form") or contains(@class, "field")][1]');
  const errorInParent = fieldParent.locator('text=/作業者ID(は必須項目です|が入力されていません)/');

  // エラーメッセージが表示されていることを確認
  const isErrorVisible = await Promise.race([
    errorMessageLocator.isVisible().catch(() => false),
    errorInParent.isVisible().catch(() => false)
  ]);

  expect(isErrorVisible).toBe(true);

  // エラーメッセージの内容を確認
  const errorElement = await Promise.race([
    errorMessageLocator.isVisible().then(() => errorMessageLocator).catch(() => null),
    errorInParent.isVisible().then(() => errorInParent).catch(() => null)
  ]);

  if (errorElement) {
    const errorText = await errorElement.textContent();
    expect(errorText).toMatch(/作業者IDは必須項目です|作業者IDが入力されていません/);

    // エラーメッセージが赤色で表示されていることを確認
    const errorColor = await errorElement.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    
    // RGB値を抽出して赤色判定
    const rgbMatch = errorColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    expect(rgbMatch).toBeTruthy();
    
    if (rgbMatch) {
      const [, rStr, gStr, bStr] = rgbMatch;
      const r = parseInt(rStr, 10);
      const g = parseInt(gStr, 10);
      const b = parseInt(bStr, 10);
      
      // 赤色系の判定：R値が G値と B値より高い
      expect(r > g && r > b).toBe(true);
    }
  }
  
  // リクエストが送信されていないことを確認
  expect(requestMade).toBe(false);
});