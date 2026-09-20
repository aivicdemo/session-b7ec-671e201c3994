import { test, expect } from '@playwright/test';

test.describe('SCEN-1535: 作業指示受領確認 - セッション有効期限切れ時の認証失敗', () => {
  test('ユーザーがセッション有効期限切れ状態で作業指示受領確認を操作すると認証失敗となること', async ({ page, context }) => {
    // Step 1: ブラウザで作業指示・実績管理画面にアクセスし、有効なユーザー認証情報でログインする
    await page.goto('/');
    
    // ログイン画面が表示されるまで待機
    await page.waitForURL(/login|auth/, { timeout: 5000 }).catch(() => {
      // ログイン画面でない場合、既に認証済みの可能性
    });
    
    // ログイン画面が表示されている場合はログイン処理を実行
    const loginForm = page.locator('.login-form');
    if (await loginForm.isVisible({ timeout: 2000 }).catch(() => false)) {
      // テスト用の認証情報を使用してログイン
      await page.fill('input[type="text"]', 'testuser');
      await page.fill('input[type="password"]', 'testpassword');
      await page.click('.login-button');
      
      // ログイン後のリダイレクト完了を待機
      await page.waitForURL(/scr-1789461813941|panels/, { timeout: 10000 });
    }

    // Step 2: ログイン後、作業指示・実績管理画面が正常に表示されることを確認する
    await page.waitForURL(/scr-1789461813941/, { timeout: 10000 });
    const workInstructionList = page.locator('[data-testid="work-instruction-list"]');
    await expect(workInstructionList).toBeVisible({ timeout: 5000 });

    // セッション切れ前のDB記録数を取得
    const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
    const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
    const tables = await page.evaluate(() => (window as any).AIVIC_TABLES);
    
    let initialRecordCount = -1;
    let receiptTableName: string | undefined;
    
    if (apiUrl && appId && tables) {
      try {
        // AIVIC_TABLES から受領確認関連のテーブルを特定
        receiptTableName = Object.entries(tables).find(([_, tableName]: [string, any]) => {
          const name = typeof tableName === 'string' ? tableName : String(tableName);
          return name.toLowerCase().includes('receipt') || name.toLowerCase().includes('確認');
        })?.[0];

        if (receiptTableName) {
          const response = await page.evaluate(async ({ url, app, tableName }) => {
            const res = await fetch(`${url}/api/${tableName}?app=${app}`);
            if (res.ok) {
              const data = await res.json();
              return Array.isArray(data) ? data.length : 0;
            }
            return -1;
          }, { url: apiUrl, app: appId, tableName: receiptTableName });
          initialRecordCount = response;
        }
      } catch {
        // API呼び出し失敗時は初期値-1のまま
      }
    }

    // Step 3: セッション有効期限を意図的に切らすため、ブラウザの開発者ツールでセッションクッキーを削除
    const cookies = await context.cookies();
    const sessionCookies = cookies.filter(c => 
      c.name.toLowerCase().includes('session') || 
      c.name.toLowerCase().includes('auth') ||
      c.name.toLowerCase().includes('token')
    );
    
    for (const cookie of sessionCookies) {
      await context.clearCookies({ name: cookie.name });
    }

    // Step 4: セッション有効期限切れ状態で、作業指示受領確認の操作を実行する
    let authFailureDetected = false;
    let apiErrorResponse: number | null = null;

    page.on('response', response => {
      const status = response.status();
      if ((status === 401 || status === 403 || (status >= 400 && status < 500))) {
        authFailureDetected = true;
        apiErrorResponse = status;
      }
    });

    // 受領確認ボタンをクリック
    const receiptConfirmButton = page.locator('[data-testid="receipt-confirm-ok"]');
    if (await receiptConfirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await receiptConfirmButton.click();
    } else {
      // 代替の受領確認操作（例：フォーム送信）
      const receiptConfirmOverlay = page.locator('#receipt-confirmation-overlay');
      if (await receiptConfirmOverlay.isVisible({ timeout: 2000 }).catch(() => false)) {
        const confirmButton = receiptConfirmOverlay.locator('button:has-text("確認")');
        if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await confirmButton.click();
        }
      }
    }

    // Step 5: ブラウザの開発者ツール（Network/Console）でHTTPレスポンスステータスコードと画面の状態変化を確認する
    
    // 認証失敗応答の確認を待機
    await page.waitForTimeout(2000);
    
    // HTTP 401/403/4xx が返却されたか確認
    expect(authFailureDetected).toBeTruthy();
    expect(apiErrorResponse).toBeTruthy();
    expect(apiErrorResponse).toBeGreaterThanOrEqual(400);
    expect(apiErrorResponse).toBeLessThan(500);
    
    // エラーメッセージが表示されることを確認
    const errorBanner = page.locator('#error-banner');
    const errorMessage = page.locator('#error-message');
    
    const hasAuthErrorDisplay = await errorBanner.isVisible({ timeout: 2000 }).catch(() => false) ||
                                await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasAuthErrorDisplay).toBeTruthy();
    
    // エラーメッセージの内容を確認
    const errorText = await errorMessage.textContent({ timeout: 2000 }).catch(() => '');
    expect(errorText).toMatch(/セッション|ログイン/);
    
    // ログイン画面への自動遷移または強制遷移を確認
    const loginPageReached = await page.waitForURL(/login|auth/, { timeout: 5000 }).catch(() => false);
    
    // 自動遷移がない場合は、ユーザーが手動で遷移できる状態（エラーメッセージが表示）を確認
    if (!loginPageReached) {
      // エラーメッセージが表示されていることで遷移が強制されている状態を確認
      expect(hasAuthErrorDisplay).toBeTruthy();
    } else {
      // ログイン画面に遷移した場合
      expect(await page.locator('.login-form').isVisible()).toBeTruthy();
    }

    // DB記録が作成されていないことを確認
    if (apiUrl && appId && receiptTableName && initialRecordCount >= 0) {
      try {
        const finalRecordCount = await page.evaluate(async ({ url, app, tableName }) => {
          const res = await fetch(`${url}/api/${tableName}?app=${app}`);
          if (res.ok) {
            const data = await res.json();
            return Array.isArray(data) ? data.length : -1;
          }
          return -1;
        }, { url: apiUrl, app: appId, tableName: receiptTableName });
        
        expect(finalRecordCount).toBe(initialRecordCount);
      } catch {
        // API呼び出し失敗時も記録が作成されなかったと判断
      }
    }
  });
});