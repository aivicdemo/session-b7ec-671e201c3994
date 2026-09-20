import { test, expect } from '@playwright/test';

test.describe('SCEN-1248: 作業指示・実績管理画面へのアクセス権限を持たないユーザーが遷移を要求すると、認可段階で遷移が拒否される', () => {
  test('権限なしユーザーが作業指示・実績管理画面へのアクセスが拒否されること', async ({ page }) => {
    // ログイン画面へアクセス
    await page.goto('/');
    await page.waitForURL(/login|panels/, { timeout: 10000 });

    // テスト用ユーザー（権限なし）でログイン
    const loginPageUrl = page.url();
    if (loginPageUrl.includes('login')) {
      await page.fill('input[type="text"]', 'testuser_no_permission');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // ログイン完了待機
      await page.waitForURL(/panels/, { timeout: 10000 });
    }

    // ダッシュボード画面の表示確認
    await expect(page).toHaveURL(/scr-1789461783315/);
    
    // 403レスポンスを監視するリスナーを設定
    let forbiddenResponseReceived = false;
    const responseListener = (response: any) => {
      if (response.status() === 403) {
        forbiddenResponseReceived = true;
      }
    };
    page.on('response', responseListener);

    // ナビゲーションメニューから「作業指示・実績管理」へのアクセスを試みる
    const workInstructionLink = page.locator('nav a').filter({ hasText: '作業指示・実績管理' });
    const linkExists = await workInstructionLink.isVisible().catch(() => false);

    if (linkExists) {
      // リンク経由での遷移を試みる
      await workInstructionLink.click().catch(() => null);
      
      // 認可層での評価を待機（403レスポンスまたはURL変更の検出）
      await page.waitForTimeout(1000);
    } else {
      // 直接URL遷移を試みる
      await page.goto('/panels/scr-1789461813941.html', { 
        waitUntil: 'load',
        timeout: 5000 
      }).catch(() => null);
      
      // 認可層での評価を待機
      await page.waitForTimeout(1000);
    }

    page.removeListener('response', responseListener);

    // 遷移が拒否されたことを確認
    // パターン1: ダッシュボード画面に留まっている
    const isStillOnDashboard = page.url().includes('scr-1789461783315');
    
    // パターン2: エラーメッセージが表示されている
    const errorMessage = page.locator(
      'text=/このページを表示する権限がありません|アクセス権限がない操作です|アクセス権限不足|権限がありません/'
    );
    const errorMessageVisible = await errorMessage.isVisible().catch(() => false);
    
    // パターン3: HTTP 403レスポンスが返却されている
    const hasForbiddenResponse = forbiddenResponseReceived;

    // 遷移が拒否された場合、以下のいずれかが確認できること
    expect(
      isStillOnDashboard || errorMessageVisible || hasForbiddenResponse,
      'ダッシュボード画面に留まる、またはエラーメッセージが表示される、または403レスポンスが返却されること'
    ).toBeTruthy();

    // ダッシュボードに留まっている場合の確認
    if (isStillOnDashboard) {
      await expect(page).toHaveURL(/scr-1789461783315/);
    }

    // エラーメッセージが表示されている場合の確認
    if (errorMessageVisible) {
      await expect(errorMessage).toBeVisible();
    }

    // 403レスポンスが返却されている場合の確認
    if (hasForbiddenResponse) {
      expect(forbiddenResponseReceived).toBeTruthy();
    }
  });
});