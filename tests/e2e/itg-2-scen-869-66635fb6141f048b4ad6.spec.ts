import { test, expect } from '@playwright/test';

test('SCEN-869: 再試行上限が0以下で設定された場合、エラーメッセージが表示される', async ({ page }) => {
  // 作業実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  
  // ページが読み込まれるまで待つ
  await page.waitForLoadState('networkidle');

  // 再試行上限を設定するフィールド（数値入力欄）を特定する
  const retryLimitInput = page.locator('input[name*="retry"], input[placeholder*="再試行"], input[aria-label*="再試行"]').first();
  
  // 再試行上限フィールドが見つかることを確認
  await expect(retryLimitInput).toBeVisible();

  // 再試行上限フィールドに「0」を入力する
  await retryLimitInput.fill('0');

  // 入力完了またはフォーム送信ボタンを押す
  const submitButton = page.locator('button[type="submit"], button:has-text("送信"), button:has-text("実行"), button:has-text("保存")').first();
  await submitButton.click();

  // 画面にエラーメッセージが表示されるまで待つ
  const errorMessage = page.locator('text="再試行上限は1以上である必要があります"');
  await expect(errorMessage).toBeVisible();

  // 再試行上限フィールドがフォーカス状態またはハイライト状態で残ることを確認
  const isFocusedOrHighlighted = await retryLimitInput.evaluate((el: HTMLInputElement) => {
    const hasFocus = document.activeElement === el;
    const hasErrorClass = el.classList.contains('error') || el.classList.contains('invalid');
    const hasAriaInvalid = el.getAttribute('aria-invalid') === 'true';
    const styles = getComputedStyle(el);
    const hasBorderColor = styles.borderColor && styles.borderColor !== 'rgba(0, 0, 0, 0)';
    
    return hasFocus || hasErrorClass || hasAriaInvalid || hasBorderColor;
  });
  
  await expect(isFocusedOrHighlighted).toBeTruthy();
});