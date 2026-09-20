import { test, expect } from '@playwright/test';

test('SCEN-1200: ダッシュボード表示操作の権限がないユーザーはアクセスが拒否される', async ({ page }) => {
  // テスト用ユーザーアカウント（ダッシュボード表示権限なし）でログイン
  await page.goto('/');
  
  // ログインフォームが表示されるまで待機
  await page.waitForSelector('input[type="text"]', { timeout: 5000 });
  
  // 権限なしユーザーのログイン情報を入力
  const userIdInput = page.locator('input[type="text"]').first();
  const passwordInput = page.locator('input[type="password"]');
  
  await userIdInput.fill('no-dashboard-user');
  await passwordInput.fill('password123');
  
  // ログインボタンをクリック
  await page.click('button:has-text("ログイン")');
  
  // ログイン成功後、ダッシュボード画面のURLに直接遷移を試みる
  const response = await page.goto('/dashboard/progress-staffing', { waitUntil: 'networkidle' });
  
  // アクセス制御の検証処理が実行されるまで待機（3秒以内）
  await page.waitForTimeout(1000);
  
  // HTTP 403 Forbidden エラーが返されたか、またはアクセス拒否画面が表示されているかを検証
  const pageContent = await page.content();
  const hasAccessDeniedMessage = pageContent.includes('このページにアクセスする権限がありません') ||
                                  pageContent.includes('アクセスが拒否されました') ||
                                  pageContent.includes('アクセス権限がありません') ||
                                  pageContent.includes('403');
  
  const isForbiddenResponse = response && response.status() === 403;
  const isForbiddenUrl = page.url().includes('403') || 
                         page.url().includes('forbidden') ||
                         page.url().includes('error');
  
  // エラー画面が表示され、かつアクセス拒否メッセージが存在することを確認
  expect(isForbiddenResponse || isForbiddenUrl).toBeTruthy();
  expect(hasAccessDeniedMessage).toBeTruthy();
  
  // ダッシュボード画面の固有コンテンツが表示されていないことを確認
  // 拠点・チーム別の進捗状況リアルタイムデータ（KPI要素）が表示されていないか確認
  const kpiRiskCount = page.locator('[data-testid="kpi-risk-count"]');
  const kpiSitesAction = page.locator('[data-testid="kpi-sites-action"]');
  const kpiActivePlans = page.locator('[data-testid="kpi-active-plans"]');
  const siteVarianceTable = page.locator('[data-testid="site-variance-table"]');
  const teamVarianceTable = page.locator('[data-testid="team-variance-table"]');
  const riskAssessmentTable = page.locator('[data-testid="risk-assessment-table"]');
  const activePlansTable = page.locator('[data-testid="active-plans-table"]');
  
  // ダッシュボード固有のコンテンツが一切閲覧できない状態を確認
  expect(await kpiRiskCount.count()).toBe(0);
  expect(await kpiSitesAction.count()).toBe(0);
  expect(await kpiActivePlans.count()).toBe(0);
  expect(await siteVarianceTable.count()).toBe(0);
  expect(await teamVarianceTable.count()).toBe(0);
  expect(await riskAssessmentTable.count()).toBe(0);
  expect(await activePlansTable.count()).toBe(0);
  
  // ブラウザのアドレスバーがダッシュボード画面のURLのままか、エラーページURLに変更されていることを確認
  const currentUrl = page.url();
  expect(
    currentUrl.includes('/dashboard/progress-staffing') || 
    currentUrl.includes('403') || 
    currentUrl.includes('forbidden') ||
    currentUrl.includes('error')
  ).toBeTruthy();
});