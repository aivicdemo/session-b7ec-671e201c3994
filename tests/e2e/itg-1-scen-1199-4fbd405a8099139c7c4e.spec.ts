import { test, expect } from '@playwright/test';

test('SCEN-1199: 認証されていないユーザーはダッシュボード画面へのアクセスが拒否される', async ({ browser }) => {
  // テスト環境のPlaywrightブラウザコンテキストをセットアップし、
  // 認証クッキーまたはセッショントークンを明示的に削除または設定しない状態を準備する
  const context = await browser.newContext();
  const page = await context.newPage();

  // ダッシュボード画面のURLに直接遷移を試みる
  const response = await page.goto('/panels/scr-1789461783315.html', { waitUntil: 'networkidle' });

  // ブラウザがHTTPステータスコード401または403を受信するか、認証ページへのリダイレクトが発生するまで待機する
  const statusCode = response?.status();
  const isAuthErrorStatus = statusCode === 401 || statusCode === 403;
  
  const currentUrl = page.url();
  const isRedirectedToLogin = !currentUrl.includes('/panels/scr-1789461783315.html');

  // 認証ページへのリダイレクトまたはステータスコード401/403のいずれかが発生したことを確認
  expect(isAuthErrorStatus || isRedirectedToLogin).toBeTruthy();

  // 進捗・人員配置ダッシュボード画面は表示されず、
  // 『認証が必要です』または『アクセス権限がありません』というエラーメッセージが表示されているか、
  // またはログイン画面が表示されていることを確認
  const authErrorMessage1 = page.locator('text=認証が必要です');
  const authErrorMessage2 = page.locator('text=アクセス権限がありません');
  const loginForm = page.locator('form');
  
  const hasAuthError = (await authErrorMessage1.isVisible().catch(() => false)) || 
                       (await authErrorMessage2.isVisible().catch(() => false)) ||
                       (await loginForm.isVisible().catch(() => false));
  
  expect(hasAuthError).toBeTruthy();

  // ダッシュボード内のコンテンツ（進捗状況、人員配置案、リスク警告など）は一切表示されない
  const kpiRiskCount = page.getByTestId('kpi-risk-count');
  const kpiSitesAction = page.getByTestId('kpi-sites-action');
  const kpiActivePlans = page.getByTestId('kpi-active-plans');
  
  expect(await kpiRiskCount.isVisible().catch(() => false)).toBe(false);
  expect(await kpiSitesAction.isVisible().catch(() => false)).toBe(false);
  expect(await kpiActivePlans.isVisible().catch(() => false)).toBe(false);

  await context.close();
});