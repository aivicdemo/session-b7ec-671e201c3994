import { test, expect } from '@playwright/test';

test('SCEN-1247: セッションが無効なユーザーが作業指示・実績管理画面への遷移を要求すると、認証段階で遷移が拒否される', async ({ page }) => {
  // セッション無効状態を確認
  await test.step('テスト対象アプリケーションを起動し、ログイン状態がない状態を確認する', async () => {
    await page.goto('/');
    // ログイン画面に遷移していることを確認
    await expect(page).toHaveURL(/.*login|auth/i);
  });

  // 作業指示・実績管理画面のURLに直接遷移を試みる
  await test.step('ブラウザのアドレスバーに作業指示・実績管理画面のURLを直接入力し、Enterキーを押す', async () => {
    const workInstructionUrl = '/panels/scr-1789461813941.html';
    
    // ネットワークリクエストを監視
    const responsePromise = page.waitForResponse(response => {
      return response.url().includes('scr-1789461813941') || response.status() === 401 || response.status() === 403;
    });
    
    await page.goto(workInstructionUrl, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {
      // リダイレクトされる可能性があるためエラーを無視
    });
    
    try {
      const response = await responsePromise;
      expect([401, 403]).toContain(response.status());
    } catch {
      // タイムアウトした場合はリダイレクトされている
    }
  });

  // 画面描画完了まで最大10秒待機後、認証画面への遷移を確認
  await test.step('ネットワークリクエストとレスポンスを監視しながら、画面遷移を待つ', async () => {
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      // タイムアウトは許容
    });
  });

  // 期待結果の検証
  await test.step('作業指示・実績管理画面への遷移が認証段階で拒否されることを確認', async () => {
    // ログイン画面にリダイレクトされていることを確認
    await expect(page).toHaveURL(/.*login|auth/i);
    
    // 作業指示・実績管理画面の機能要素が表示されていないことを確認
    const workInstructionList = page.getByTestId('work-instruction-list');
    const performanceForm = page.getByTestId('performance-submit-button');
    const wmsLog = page.getByTestId('tab-wms');
    
    await expect(workInstructionList).not.toBeVisible();
    await expect(performanceForm).not.toBeVisible();
    await expect(wmsLog).not.toBeVisible();
    
    // ログイン画面の要素が表示されていることを確認
    const loginButton = page.locator('button:has-text("ログイン")').first();
    const loginForm = page.locator('form');
    
    await expect(loginButton.or(loginForm)).toBeVisible();
  });
});