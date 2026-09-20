import { test, expect } from '@playwright/test';

test('SCEN-1502: 入力された実績数量が負数または0のとき、検証エラーが表示されて送信は進まない', async ({ page }) => {
  // 作業指示・実績管理画面にアクセス
  await page.goto('./panels/scr-1789461813941.html');
  await page.waitForLoadState('networkidle');

  // 作業実績データ入力フォームを開く
  const performanceForm = page.locator('#performance-form-section');
  await expect(performanceForm).toBeVisible();

  // 負数入力時のテスト
  await test.step('負数「-5」を入力して検証エラーを確認', async () => {
    // 実績数量フィールドに「-5」を入力
    const quantityInput = page.locator('#perf-quantity');
    await quantityInput.fill('-5');
    await expect(quantityInput).toHaveValue('-5');

    // 検証エラーメッセージを確認
    const errorBanner = page.locator('#error-banner');
    const errorMessage = page.locator('#error-message');
    
    await expect(errorBanner).toBeVisible();
    await expect(errorMessage).toContainText('実績数量は1以上の正の整数で入力してください');
    
    // エラーバナーが赤色であることを確認
    const color = await errorBanner.evaluate((el) => window.getComputedStyle(el).color);
    // RGB値が赤色（R値が高い、G値とB値が低い）であることを確認
    expect(color).toMatch(/^rgba?\(\s*([01]?\d?\d|2[0-4]\d|25[0-5])\s*,\s*([0-5]?\d|[0-9])\s*,\s*([0-5]?\d|[0-9])/);
    const rgbMatch = color.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      const [r, g, b] = [parseInt(rgbMatch[0]), parseInt(rgbMatch[1]), parseInt(rgbMatch[2])];
      expect(r).toBeGreaterThan(150);
      expect(g).toBeLessThan(100);
      expect(b).toBeLessThan(100);
    }

    // 送信ボタンは無効化される
    const submitButton = page.locator('[data-testid="performance-submit-button"]');
    await expect(submitButton).toBeDisabled();

    // 送信ボタンをクリックしてもリクエストが送信されないことを確認
    await page.context().on('response', (response) => {
      // 実績送信APIへのリクエストが送信されないことを検証
      expect(response.url()).not.toContain('performance') && expect(response.url()).not.toContain('submit');
    });
    
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('performance') || response.url().includes('submit')
    ).catch(() => null);
    
    await submitButton.click();
    const response = await Promise.race([
      responsePromise,
      new Promise(resolve => setTimeout(() => resolve(null), 1000))
    ]);
    
    expect(response).toBeNull();

    // フォーム入力状態が保持されていることを確認
    await expect(quantityInput).toHaveValue('-5');
    
    // ページ遷移がないことを確認
    expect(page.url()).toContain('scr-1789461813941.html');
  });

  // 0入力時のテスト
  await test.step('0を入力して検証エラーを確認', async () => {
    // 実績数量フィールドをクリアして「0」を入力
    const quantityInput = page.locator('#perf-quantity');
    await quantityInput.fill('0');
    await expect(quantityInput).toHaveValue('0');

    // 検証エラーメッセージを確認
    const errorBanner = page.locator('#error-banner');
    const errorMessage = page.locator('#error-message');
    
    await expect(errorBanner).toBeVisible();
    await expect(errorMessage).toContainText('実績数量は1以上の正の整数で入力してください');
    
    // エラーバナーが赤色であることを確認
    const color = await errorBanner.evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toMatch(/^rgba?\(\s*([01]?\d?\d|2[0-4]\d|25[0-5])\s*,\s*([0-5]?\d|[0-9])\s*,\s*([0-5]?\d|[0-9])/);
    const rgbMatch = color.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      const [r, g, b] = [parseInt(rgbMatch[0]), parseInt(rgbMatch[1]), parseInt(rgbMatch[2])];
      expect(r).toBeGreaterThan(150);
      expect(g).toBeLessThan(100);
      expect(b).toBeLessThan(100);
    }

    // 送信ボタンは無効化される
    const submitButton = page.locator('[data-testid="performance-submit-button"]');
    await expect(submitButton).toBeDisabled();

    // 送信ボタンをクリックしてもリクエストが送信されないことを確認
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('performance') || response.url().includes('submit')
    ).catch(() => null);
    
    await submitButton.click();
    const response = await Promise.race([
      responsePromise,
      new Promise(resolve => setTimeout(() => resolve(null), 1000))
    ]);
    
    expect(response).toBeNull();

    // フォーム入力状態が保持されていることを確認
    await expect(quantityInput).toHaveValue('0');
    
    // ページ遷移がないことを確認
    expect(page.url()).toContain('scr-1789461813941.html');
  });
});