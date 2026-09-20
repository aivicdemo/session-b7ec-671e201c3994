import { test, expect } from '@playwright/test';

test('SCEN-1442: ダッシュボード表示（実績管理画面から）', async ({ page }) => {
  // 作業指示・実績管理画面にアクセス
  await page.goto('/panels/scr-1789461813941.html');
  
  // ログイン画面が表示される場合はログイン
  const loginButton = page.getByRole('button', { name: /ログイン/i }).first();
  if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    const usernameInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]');
    
    await usernameInput.fill('testuser');
    await passwordInput.fill('testpassword');
    await loginButton.click();
    
    // ログイン後の遷移を待機
    await page.waitForURL(/.*/, { timeout: 10000 });
  }
  
  // 作業指示・実績管理画面が読み込まれることを確認
  await page.waitForSelector('[data-testid="work-instruction-list"]', { timeout: 10000 });
  
  // ダッシュボードへのナビゲーションボタンをクリック
  await page.getByRole('link', { name: '進捗・人員配置ダッシュボード' }).first().click();
  
  // ダッシュボード画面が読み込まれるまで待機
  await page.waitForURL(/.*scr-1789461783315/, { timeout: 10000 });
  
  // 遅延要因の自動分類処理が開始されるまで待機
  await page.waitForSelector('[data-testid="risk-assessment-table"]', { timeout: 10000 });
  
  // 過去30日間の生産性データが不足している場合の警告メッセージを最大5秒間待機
  const warningSelector = 'text=/過去実績が不足しているため、効率低下の判定精度が低下する可能性があります/';
  const warningElement = page.locator(warningSelector);
  
  // 警告メッセージが表示されるまで待機
  await warningElement.waitFor({ timeout: 5000 });
  
  // 警告メッセージが表示されていることを確認
  await expect(warningElement).toBeVisible();
  
  // 警告メッセージの背景色が黄色または橙色であることを確認
  const computedStyle = await warningElement.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return style.backgroundColor;
  });
  
  // 背景色が黄色または橙色のいずれかであることを確認
  const isWarningColor = 
    computedStyle.includes('rgb(255, 193, 7)') ||  // 黄色
    computedStyle.includes('rgb(245, 158, 11)') || // 橙色（プライマリカラー）
    computedStyle.includes('rgb(255, 152, 0)') ||  // 別の橙色
    computedStyle.includes('rgb(251, 191, 36)');   // 別の黄色
  
  expect(isWarningColor).toBe(true);
  
  // 警告が表示されても、分類処理が続行されていることを確認
  await expect(page.locator('[data-testid="risk-assessment-table"]')).toBeVisible({ timeout: 5000 });
  
  // 拠点別の分類一覧が表示されていることを確認
  await expect(page.locator('[data-testid="site-variance-table"]')).toBeVisible();
  
  // チーム別の分類一覧が表示されていることを確認
  await expect(page.locator('[data-testid="team-variance-table"]')).toBeVisible();
});