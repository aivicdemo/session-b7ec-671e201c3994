import { test, expect } from '@playwright/test';

test('SCEN-1253: リスク分析実行時に作業指示データの取得に失敗するとエラーメッセージが表示される', async ({ page, context }) => {
  // セットアップ：API をモックしてデータ取得を失敗させる
  let apiCallAttempted = false;
  await context.route('**/api/**', async (route) => {
    const url = route.request().url();
    // 作業指示データの取得を失敗させる
    if (url.includes('work_instruction') || url.includes('assignment')) {
      apiCallAttempted = true;
      await route.abort('failed');
    } else {
      await route.continue();
    }
  });

  // ステップ 1: 進捗・人員配置ダッシュボード画面を開く
  await page.goto('/');
  
  // ログイン処理（認証が必要な場合）
  const loginForm = page.locator('.login-form');
  if (await loginForm.isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    
    // ログイン後のリダイレクト完了を待つ
    await page.waitForURL('**/panels/scr-1789461783315.html', { timeout: 10000 });
  } else {
    // ログイン済みの場合、ダッシュボードへ遷移
    await page.waitForURL('**/panels/scr-1789461783315.html', { timeout: 10000 });
  }

  // ダッシュボード画面が読み込まれるまで待つ
  await page.waitForSelector('[data-testid="kpi-risk-count"]', { timeout: 10000 });

  // リスク分析実行前のリスク数を取得（エラー発生前の初期状態）
  const riskCountBefore = await page.locator('[data-testid="kpi-risk-count"]').textContent();
  const activePlansBefore = await page.locator('[data-testid="active-plans-table"] tbody tr').count();

  // ステップ 2: ダッシュボード上の「リスク分析を実行」ボタンをクリック
  const optimizeButton = page.locator('[data-testid="optimize-button"]');
  await optimizeButton.click();

  // ステップ 3: リスク分析実行処理が開始される
  // API 呼び出しが実行されたことを確認
  await page.waitForTimeout(1000);
  expect(apiCallAttempted).toBe(true);

  // ステップ 4: 画面の状態を確認する
  // 期待結果：エラーメッセージが「ユーザー向け通知領域」に表示される
  // 参考情報から error-banner がユーザー向け通知領域と判断
  const errorBanner = page.locator('id=error-banner');
  const errorMessage = page.locator('id=error-message');
  
  await expect(errorBanner).toBeVisible({ timeout: 10000 });
  await expect(errorMessage).toContainText('進捗データの取得に失敗しました。作業指示情報が取得できないため、リスク分析を中断します。管理者に連絡してください。');

  // 期待結果：ダッシュボード画面の状態が変わらない（分析結果が追加されない）
  const riskCountAfter = await page.locator('[data-testid="kpi-risk-count"]').textContent();
  expect(riskCountAfter).toBe(riskCountBefore);

  // 期待結果：配置案が更新されない
  const activePlansAfter = await page.locator('[data-testid="active-plans-table"] tbody tr').count();
  expect(activePlansAfter).toBe(activePlansBefore);
});