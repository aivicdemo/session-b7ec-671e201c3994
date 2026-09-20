import { test, expect } from '@playwright/test';

test('SCEN-879: 推奨追加作業者数が利用可能な予備作業者数を超える場合、警告メッセージが表示される', async ({ page }) => {
  // ログイン処理
  await page.goto('/');
  await page.waitForURL('**/panels/**');
  
  const loginFrame = page.frameLocator('iframe[src*="scr-1789461783315"]') || page;
  const usernameInput = loginFrame.locator('input[type="text"]').first();
  const passwordInput = loginFrame.locator('input[type="password"]');
  const loginButton = loginFrame.locator('button:has-text("ログイン"), button[type="submit"]');
  
  await usernameInput.fill('testuser');
  await passwordInput.fill('testpass');
  await loginButton.click();
  
  // 作業実績データ記録・入力画面への遷移を待機
  await page.waitForURL('**/panels/scr-1789461993203.html', { timeout: 10000 });
  
  // 新規作業実績データ入力フォームを開く
  const newRecordButton = page.locator('button:has-text("新規"), button:has-text("追加"), a:has-text("新規")').first();
  await newRecordButton.click();
  
  // フォームが表示されるまで待機
  await page.waitForSelector('form, [role="dialog"]', { timeout: 5000 });
  
  // 必須項目を入力する
  // 作業タイプを選択
  const workTypeSelect = page.locator('select[name*="workType"], select[name*="type"], [placeholder*="作業タイプ"]').first();
  await workTypeSelect.selectOption({ index: 1 });
  
  // 部門を選択
  const departmentSelect = page.locator('select[name*="department"], select[name*="dept"], [placeholder*="部門"]').first();
  await departmentSelect.selectOption({ index: 1 });
  
  // 作業者情報を入力
  const workerInput = page.locator('input[name*="worker"], input[placeholder*="作業者"]').first();
  if (workerInput) {
    await workerInput.fill('worker001');
  }
  
  // 実績数量を入力 - 推奨追加作業者数が予備作業者数を超えるように大きな値を入力
  const quantityInput = page.locator('input[type="number"], input[name*="quantity"], input[name*="amount"], input[placeholder*="数量"]').first();
  await quantityInput.fill('9999');
  
  // 入力後に自動計算フィールドが更新されるまで待機
  // 推奨追加作業者数を表示するフィールドが存在する場合それを監視
  const recommendedWorkerField = page.locator('[name*="recommended"], [class*="recommended"], [data-field*="recommended"]').first();
  if (recommendedWorkerField) {
    await page.waitForFunction(() => {
      const value = recommendedWorkerField.getAttribute('value') || recommendedWorkerField.textContent();
      return value && value !== '0' && value !== '';
    }, { timeout: 5000 }).catch(() => {
      // タイムアウトしてもフィールドが見つかったら続行
    });
  }
  
  // 保存ボタンをクリック
  const saveButton = page.locator('button:has-text("保存"), button[type="submit"]').first();
  await saveButton.click();
  
  // 警告メッセージが表示されるまで待機
  const warningMessage = page.locator(
    'text=/必要な作業者数を確保できません。優先順位変更で対応してください/i'
  ).first();
  
  // 警告メッセージが表示されていることを確認
  await expect(warningMessage).toBeVisible({ timeout: 5000 });
  
  // メッセージの内容を確認
  const messageText = await warningMessage.textContent();
  expect(messageText).toContain('必要な作業者数を確保できません');
  expect(messageText).toContain('優先順位変更で対応してください');
  
  // メッセージが赤色またはエラー表示であることを確認
  const computedStyle = await warningMessage.evaluate((el) => {
    const style = window.getComputedStyle(el);
    const bgColor = style.backgroundColor;
    const textColor = style.color;
    const borderColor = style.borderColor;
    
    // RGB値を解析して赤色かどうかを判定
    const parseColor = (colorString: string): { r: number; g: number; b: number } | null => {
      const rgbMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgbMatch) {
        return {
          r: parseInt(rgbMatch[1]),
          g: parseInt(rgbMatch[2]),
          b: parseInt(rgbMatch[3])
        };
      }
      return null;
    };
    
    const isRedColor = (colorString: string): boolean => {
      const color = parseColor(colorString);
      if (!color) return false;
      // 赤色と判定：R値が高く、G値とB値が低い
      return color.r > 150 && color.g < 100 && color.b < 100;
    };
    
    return {
      color: textColor,
      backgroundColor: bgColor,
      borderColor: borderColor,
      display: style.display,
      visibility: style.visibility,
      hasErrorClass: (el as HTMLElement).className.includes('error') || 
                     (el as HTMLElement).className.includes('alert') ||
                     (el as HTMLElement).className.includes('warning'),
      isRedText: isRedColor(textColor),
      isRedBackground: isRedColor(bgColor),
      isRedBorder: isRedColor(borderColor)
    };
  });
  
  // 表示状態の確認
  expect(computedStyle.display).not.toBe('none');
  expect(computedStyle.visibility).not.toBe('hidden');
  
  // 赤色またはエラー表示であることを確認
  const hasVisualIndicator = 
    computedStyle.hasErrorClass || 
    computedStyle.isRedText || 
    computedStyle.isRedBackground || 
    computedStyle.isRedBorder;
  
  expect(hasVisualIndicator).toBe(true);
});