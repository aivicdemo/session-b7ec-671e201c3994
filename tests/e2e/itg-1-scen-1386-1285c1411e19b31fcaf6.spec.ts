import { test, expect } from '@playwright/test';

test('人員配置案配信操作の実行権限が検証され、権限がない場合は操作が拒否される', async ({ page, context }) => {
  // テストユーザーアカウント（人員配置案配信の実行権限を持たないロール）でシステムにログイン
  await test.step('権限なしユーザーでログイン', async () => {
    await page.goto('/');
    
    // ログイン画面でクレデンシャルを入力（権限なしユーザー）
    await page.fill('input[name="userId"]', 'test-user-no-permission');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // ログイン完了後、ダッシュボード画面への遷移を待機
    await page.waitForNavigation({ waitUntil: 'networkidle' });
  });

  // 進捗・人員配置ダッシュボード画面が表示されることを確認
  await test.step('ダッシュボード画面が表示されることを確認', async () => {
    const dashboardCard = page.locator('[data-testid="kpi-risk-count"]');
    await expect(dashboardCard).toBeVisible();
  });

  // 人員配置最適化提案・実行画面へ遷移
  await test.step('人員配置最適化提案・実行画面へ遷移', async () => {
    await page.click('a[data-navid="scr-1789461798629"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
  });

  // 「配信実行」ボタン（distribute-button）が操作可能な状態であることを確認
  await test.step('「配置案と作業指示を一括配信」ボタンが表示されていることを確認', async () => {
    const distributeButton = page.locator('[data-testid="distribute-button"]');
    await expect(distributeButton).toBeVisible();
    await expect(distributeButton).toBeEnabled();
  });

  // 配信関連のAPI呼び出しをトラッキング
  let distributionApiCallMade = false;
  page.on('request', (request) => {
    const url = request.url();
    const method = request.method();
    // 人員配置案配信に関連するAPI呼び出しを検出
    if ((url.includes('/api/assign') || url.includes('/api/distrib') || url.includes('/api/delivery')) && method === 'POST') {
      distributionApiCallMade = true;
    }
  });

  // 「配置案と作業指示を一括配信」ボタンをクリック
  await test.step('「配置案と作業指示を一括配信」ボタンをクリック', async () => {
    const distributeButton = page.locator('[data-testid="distribute-button"]');
    await distributeButton.click();
  });

  // エラーメッセージが表示されることを確認
  await test.step('「この操作を実行する権限がありません」エラーメッセージが表示されることを確認', async () => {
    // エラーメッセージの表示を待機
    const errorMessage = page.locator('[role="alert"], .error-message, [class*="error"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // エラーメッセージに権限なしに関する内容が含まれることを確認
    const messageText = await errorMessage.textContent();
    expect(messageText).toMatch(/権限|permission|実行する権限|authorized/i);
  });

  // 画面が人員配置最適化提案・実行画面に留まっていることを確認
  await test.step('人員配置最適化提案・実行画面に留まっていることを確認', async () => {
    const currentUrl = page.url();
    expect(currentUrl).toContain('scr-1789461798629');
    
    // ページのタイトルなどで画面が切り替わっていないことを確認
    const proposalContainer = page.locator('#proposals-container');
    await expect(proposalContainer).toBeVisible();
  });

  // ネットワークタブで配信関連のAPI呼び出しが送信されていないことを確認
  await test.step('配信関連のAPI呼び出しが送信されていないことを確認', async () => {
    // 配信関連のAPI呼び出しが行われていないことを確認
    expect(distributionApiCallMade).toBe(false);
  });
});