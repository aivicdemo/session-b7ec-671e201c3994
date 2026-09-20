import { test, expect } from '@playwright/test';

test('SCEN-1193: 認証済みユーザーがダッシュボード画面にアクセスできる', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // テストユーザーの認証情報が正常に設定されていることを確認
    const testUserId = process.env.TEST_USER_ID;
    const testUserPassword = process.env.TEST_USER_PASSWORD;
    expect(testUserId).toBeTruthy();
    expect(testUserPassword).toBeTruthy();

    // ダッシュボード画面のURLにアクセス
    const response = await page.goto('/panels/scr-1789461783315.html', { waitUntil: 'networkidle' });

    // ログイン画面が表示されることを確認
    const loginCard = page.locator('.login-card');
    await expect(loginCard).toBeVisible();

    // テストユーザーの認証情報を入力
    const userIdInput = page.locator('input[placeholder*="ユーザーID"], input[name*="userId"], input[type="text"]').first();
    const passwordInput = page.locator('input[placeholder*="パスワード"], input[name*="password"], input[type="password"]');
    
    await userIdInput.fill(testUserId!);
    await passwordInput.fill(testUserPassword!);

    // ログインボタンをクリック
    const loginButton = page.locator('button:has-text("ログイン"), button.login-button');
    await loginButton.click();

    // 認証処理の完了を待つ（タイムアウト：10秒）
    await page.waitForURL('**/scr-1789461783315.html', { timeout: 10000 });

    // ダッシュボード画面への遷移が完了するまで待機
    await page.waitForLoadState('networkidle');

    // ブラウザのURLが進捗・人員配置ダッシュボード画面のURLに遷移したことを確認
    expect(page.url()).toContain('scr-1789461783315.html');

    // ページ内に『進捗・人員配置ダッシュボード』のタイトル要素がDOMに存在することを確認
    const dashboardTitle = page.locator('text=進捗・人員配置ダッシュボード').first();
    await expect(dashboardTitle).toBeVisible();

    // ページのHTTP ステータスコードが 200 であることを確認
    const finalResponse = await page.goto(page.url(), { waitUntil: 'networkidle' });
    expect(finalResponse?.status()).toBe(200);

    // ダッシュボード画面の主要なコンテンツ領域がレンダリングされていることを確認
    // 拠点・チーム別進捗ウィジェット
    const siteVarianceTable = page.locator('#site-variance-tbody');
    await expect(siteVarianceTable).toBeVisible();

    // リスク分析パネル
    const riskAssessmentTable = page.locator('#risk-assessment-tbody');
    await expect(riskAssessmentTable).toBeVisible();

    // 人員配置案表示エリア
    const activePlansTable = page.locator('#active-plans-tbody');
    await expect(activePlansTable).toBeVisible();

    // コンテンツ領域全体
    const contentArea = page.locator('.content-area');
    await expect(contentArea).toBeVisible();

  } finally {
    await context.close();
  }
});