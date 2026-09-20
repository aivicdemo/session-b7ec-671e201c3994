import { test, expect } from '@playwright/test';

test('SCEN-1105: 配置案IDの形式が不正な場合はバリデーションエラーメッセージを表示する', async ({ page }) => {
  // ログイン処理
  await page.goto('/');
  await page.waitForURL('**/panels/**');
  
  const currentUrl = page.url();
  if (currentUrl.includes('login') || !currentUrl.includes('scr-')) {
    // ログイン画面が表示されている場合
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    await page.waitForNavigation();
  }

  // 最適人員配置案提案・実行画面を開く
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');

  // 現在のURLを確認
  const screenUrl = page.url();
  expect(screenUrl).toContain('scr-1789461978707');

  // テストケース1: 特殊文字「@#$%」を入力
  await test.step('不正な形式1: 特殊文字「@#$%」を入力', async () => {
    const inputField = page.locator('input[id*="配置案"], input[placeholder*="配置案"], input[name*="配置案"]').first();
    await inputField.fill('@#$%');
    await page.click('button:has-text("確認")');
    
    const errorMessage = page.locator('text=/配置案IDの形式が不正/');
    await expect(errorMessage).toBeVisible();
    
    const inputValue = await inputField.inputValue();
    expect(inputValue).toBe('@#$%');
    
    const currentUrlAfterError = page.url();
    expect(currentUrlAfterError).toContain('scr-1789461978707');
  });

  // テストケース2: スペースのみを入力
  await test.step('不正な形式2: スペースのみを入力', async () => {
    const inputField = page.locator('input[id*="配置案"], input[placeholder*="配置案"], input[name*="配置案"]').first();
    await inputField.clear();
    await inputField.fill('   ');
    await page.click('button:has-text("確認")');
    
    const errorMessage = page.locator('text=/配置案IDの形式が不正/');
    await expect(errorMessage).toBeVisible();
    
    const inputValue = await inputField.inputValue();
    expect(inputValue).toBe('   ');
    
    const currentUrlAfterError = page.url();
    expect(currentUrlAfterError).toContain('scr-1789461978707');
  });

  // テストケース3: 英数字混在「12345a」を入力
  await test.step('不正な形式3: 英数字混在「12345a」を入力', async () => {
    const inputField = page.locator('input[id*="配置案"], input[placeholder*="配置案"], input[name*="配置案"]').first();
    await inputField.clear();
    await inputField.fill('12345a');
    await page.click('button:has-text("確認")');
    
    const errorMessage = page.locator('text=/配置案IDの形式が不正/');
    await expect(errorMessage).toBeVisible();
    
    const inputValue = await inputField.inputValue();
    expect(inputValue).toBe('12345a');
    
    const currentUrlAfterError = page.url();
    expect(currentUrlAfterError).toContain('scr-1789461978707');
  });
});