import { test, expect } from '@playwright/test';

test('認証に失敗したユーザーが画面表示をリクエストすると、アクセスが拒否される', async ({ browser }) => {
  // 認証に失敗したセッション状態でブラウザを初期化
  const context = await browser.newContext({
    storageState: {
      cookies: [
        {
          name: 'session',
          value: 'invalid-token',
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
          expires: Math.floor(Date.now() / 1000) + 3600,
        },
      ],
      origins: [],
    },
  });

  const page = await context.newPage();

  // レスポンスコードを監視
  let responseStatus: number | null = null;
  page.on('response', (response) => {
    if (response.request().resourceType() === 'document') {
      responseStatus = response.status();
    }
  });

  // 作業指示・実績管理画面のURLに直接アクセスをリクエスト
  const navigationResponse = await page.goto('/panels/scr-1789461813941.html', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  // HTTPステータスコードを確認
  const statusCode = navigationResponse?.status() || responseStatus;
  expect([401, 403]).toContain(statusCode);

  // ページのタイトル・URL・見出しテキスト・メッセージを取得して確認
  const pageTitle = await page.title();
  const pageUrl = page.url();
  const pageContent = await page.content();

  // 認証エラーを示すページへ遷移していることを確認
  const isLoginPage = pageTitle.includes('ログイン') || pageUrl.includes('login');
  const hasAuthErrorMessage =
    pageContent.includes('アクセス権がありません') ||
    pageContent.includes('認証が必要です') ||
    pageContent.includes('ログイン画面');

  expect(isLoginPage || hasAuthErrorMessage).toBeTruthy();

  // 作業指示・実績管理画面の要素が表示されていないことを確認
  const workInstructionTable = page.locator('[testId="work-instruction-list"]');
  expect(workInstructionTable).not.toBeVisible();

  await context.close();
});