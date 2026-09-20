import { test, expect } from '@playwright/test';

test.describe('作業指示受領確認', () => {
  test('ユーザーが作業指示受領確認操作の権限を持たない場合、権限検証に失敗して操作が拒否されること', async ({ page, context }) => {
    // テストユーザー（権限なし）のアカウントでシステムにログインする
    await page.goto('/');
    
    // ログイン画面でテストユーザーのアカウント情報を入力
    await page.fill('input[type="email"], input[placeholder*="ユーザーID"], input[placeholder*="ログインID"]', 'testuser-no-permission@example.com');
    await page.fill('input[type="password"], input[placeholder*="パスワード"]', 'password123');
    
    // ログインボタンをクリック
    const loginButton = page.locator('button:has-text("ログイン"), button:has-text("ログインする"), .login-button');
    await loginButton.click();
    
    // ログイン後の自動遷移を待つ
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // ナビゲーションから「作業指示・実績管理画面」を開く
    const workInstructionNav = page.locator('a[href*="scr-1789461813941"], nav >> text="作業指示・実績管理"');
    await workInstructionNav.click();
    
    // 画面の読み込みを待つ
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 表示された作業指示一覧から任意の未受領作業指示を選択する
    const workInstructionTable = page.locator('table, [data-testid="work-instruction-list"], #work-instruction-tbody');
    await workInstructionTable.waitFor({ state: 'visible' });
    
    // 未受領状態の作業指示行を探す
    const unconfirmedRows = page.locator('tr:has-text("未確認"), tr:has-text("未受領")');
    const rowCount = await unconfirmedRows.count();
    
    let selectedRow;
    if (rowCount === 0) {
      // 最初の行を選択（デモデータを想定）
      selectedRow = page.locator('table tbody tr, [data-testid="work-instruction-list"] >> tbody >> tr').first();
      await selectedRow.click();
    } else {
      // 最初の未確認行を選択
      selectedRow = unconfirmedRows.first();
      await selectedRow.click();
    }
    
    // 詳細パネルが表示されるまで待機
    await page.waitForTimeout(1000);

    // クリック前のボタン状態と受領確認状態を記録
    const receiptConfirmButton = page.locator('button:has-text("受領確認"), button:has-text("確認"), [data-testid="receipt-confirm-ok"]');
    const buttonDisabledBeforeClick = await receiptConfirmButton.isDisabled().catch(() => false);
    const statusBeforeClick = await selectedRow.textContent().catch(() => '');

    // ネットワークリクエストとコンソールログをキャプチャするためのリスナーを事前登録
    let permissionDeniedResponse: { status: number; errorCode?: string; body: string } | null = null;
    const consoleMessages: string[] = [];
    
    const responseHandler = (response: any) => {
      if (response.url().includes('/api/') && (response.status() === 403 || response.status() === 400 || response.status() === 401)) {
        response.text().then((body: string) => {
          if (body.includes('ERR_PERMISSION_DENIED_WORKINSTRUCTION_RECEIPT') || 
              body.includes('ERR_PERMISSION_DENIED') ||
              response.status() === 403) {
            permissionDeniedResponse = {
              status: response.status(),
              errorCode: body.includes('ERR_PERMISSION_DENIED_WORKINSTRUCTION_RECEIPT') ? 'ERR_PERMISSION_DENIED_WORKINSTRUCTION_RECEIPT' : undefined,
              body: body
            };
          }
        }).catch(() => {});
      }
    };

    const consoleHandler = (msg: any) => {
      consoleMessages.push(msg.text());
    };

    page.on('response', responseHandler);
    page.on('console', consoleHandler);

    // 当該作業指示の詳細パネルに表示される「受領確認」ボタンをクリックする
    await receiptConfirmButton.click();
    
    // システムが権限検証処理を実行するまで3秒以上待機する
    await page.waitForTimeout(3500);

    // リスナーをクリーンアップ
    page.removeListener('response', responseHandler);
    page.removeListener('console', consoleHandler);

    // クリック後のボタン状態と受領確認状態を確認
    const buttonDisabledAfterClick = await receiptConfirmButton.isDisabled().catch(() => false);
    const statusAfterClick = await selectedRow.textContent().catch(() => '');

    // 期待結果(1) または (2) または (3) のいずれかが発生しているか検証

    // (1) 画面上に権限エラーメッセージが表示されているか確認
    const errorMessage = page.locator('text="この操作を実行する権限がありません", text="権限がありません", [data-testid*="error"], .error-message');
    const errorMessageVisible = await errorMessage.first().isVisible().catch(() => false);
    
    let conditionMet = false;

    if (errorMessageVisible) {
      // (1) 権限エラーメッセージが表示されており、ボタンがクリック後も無効状態のままになっている
      await expect(errorMessage.first()).toBeVisible();
      // クリック前は有効（またはクリック可能）で、クリック後は無効のままになっている
      // または、クリック前から無効で、クリック後も無効のままになっている
      expect(buttonDisabledAfterClick).toBe(true);
      conditionMet = true;
    } 
    
    if (!conditionMet && permissionDeniedResponse) {
      // (2) APIがHTTPステータス403またはビジネスエラーコードを返している
      expect(permissionDeniedResponse.status).toBe(403);
      
      // ビジネスエラーコードが含まれているか確認
      const hasErrorCode = permissionDeniedResponse.body.includes('ERR_PERMISSION_DENIED_WORKINSTRUCTION_RECEIPT') || 
                           permissionDeniedResponse.body.includes('ERR_PERMISSION_DENIED');
      expect(hasErrorCode).toBe(true);
      
      // 画面の受領確認状態が変化していないことを確認（クリック前後で状態が同じ）
      expect(statusBeforeClick).toMatch(/未確認|未受領/);
      expect(statusAfterClick).toMatch(/未確認|未受領/);
      expect(statusBeforeClick).toBe(statusAfterClick);
      
      conditionMet = true;
    }

    if (!conditionMet) {
      // (3) 作業指示の受領フラグが未受領のままで、受領タイムスタンプが記録されていない
      // ステータスが未受領のままであることを確認
      expect(statusAfterClick).toMatch(/未確認|未受領/);
      expect(statusBeforeClick).toBe(statusAfterClick);
      
      // タイムスタンプフィールドが存在しないか、または空であることを確認
      const timestampField = selectedRow.locator('[data-testid*="timestamp"], [data-testid*="receipt"], td:nth-child(n+5)').first();
      const timestampContent = await timestampField.textContent().catch(() => '').then(text => text?.trim() || '');
      
      // タイムスタンプが空または未設定であることを確認
      const isTimestampEmpty = timestampContent === '' || timestampContent === '選択してください' || timestampContent === '-';
      expect(isTimestampEmpty).toBe(true);
      
      // クリック前後でボタン状態と受領状態が変わらないことを確認
      expect(buttonDisabledBeforeClick).toBe(buttonDisabledAfterClick);
      
      conditionMet = true;
    }

    // いずれかの条件が満たされていることを確認
    expect(conditionMet).toBe(true);
  });
});