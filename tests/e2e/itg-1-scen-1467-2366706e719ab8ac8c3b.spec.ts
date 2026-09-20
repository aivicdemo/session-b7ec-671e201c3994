import { test, expect } from '@playwright/test';

test.describe('人員配置最適化提案画面遷移（実績管理画面から）', () => {
  test('アクセス権限がないユーザーが人員配置最適化提案画面への遷移を要求すると、遷移が拒否される', async ({ page }) => {
    // ネットワークレスポンスを監視
    const responses: { url: string; status: number }[] = [];
    page.on('response', (response) => {
      responses.push({
        url: response.url(),
        status: response.status(),
      });
    });

    // テスト用ユーザーアカウントを準備し、アクセス権限がないことを確認
    await page.goto('/');

    // ユーザー情報を取得して権限がないことを事前に確認
    const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
    const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);

    // テスト用ユーザーの権限情報を事前に確認
    const permissionCheckResponse = await page.request.get(
      `${apiUrl}/api/user/permissions?app=${appId}&user=restricted-user`
    ).catch(() => null);

    if (permissionCheckResponse) {
      const permissionData = await permissionCheckResponse.json().catch(() => ({}));
      // 人員配置最適化提案画面へのアクセス権限がないことを確認
      const hasAccessToProposalScreen = permissionData?.screens?.['scr-1789461798629']?.access === true;
      expect(hasAccessToProposalScreen).toBeFalsy();
    }

    // テスト用ユーザーアカウント（アクセス権限なし）でログイン
    await page.fill('input[name="userId"]', 'restricted-user');
    await page.fill('input[name="password"]', 'password123');

    // ログインボタンをクリック
    await page.click('button:has-text("ログイン")');

    // ログイン後の自動遷移を待つ
    await page.waitForURL(/.*\/panels\/.*/, { timeout: 10000 });

    // 作業指示・実績管理画面への遷移
    const workInstructionNavLink = page
      .locator('a, button')
      .filter({ hasText: '作業指示・実績管理' })
      .first();
    await workInstructionNavLink.click();

    // 作業指示・実績管理画面が表示されることを確認
    await page.waitForURL(/.*scr-1789461813941.*/, { timeout: 10000 });
    expect(page.url()).toContain('scr-1789461813941');

    // 人員配置最適化提案画面へ遷移するリンク・ボタンをクリック前にネットワークリクエストをリセット
    responses.length = 0;

    const proposalLink = page
      .locator('a, button')
      .filter({ hasText: '人員配置最適化提案' })
      .first();

    // クリック実行
    await proposalLink.click();

    // ナビゲーション試行後の状態を確認
    // 短い待機時間で状態を確認（遷移があれば発生する）
    await page.waitForTimeout(500).catch(() => {});

    // 遷移後の状態を確認
    const currentUrl = page.url();
    const pageContent = await page.content();

    // パターン1: 403エラーページに遷移
    const isForbiddenPage = pageContent.includes('403') || pageContent.includes('Forbidden');

    // パターン2: エラーメッセージが表示
    const errorMessageLocator = page.locator(
      'text=/アクセス権限がありません|Permission Denied|権限/i'
    );
    const hasErrorMessage = await errorMessageLocator
      .isVisible()
      .catch(() => false);

    // パターン3: 権限エラー表示（アラート、エラーメッセージ、エラーバナーなど）
    const authErrorLocator = page
      .locator('[role="alert"], .error-message, .error-banner')
      .filter({
        hasText: /権限|アクセス|Permission|Forbidden/,
      });
    const hasAuthError = await authErrorLocator
      .isVisible()
      .catch(() => false);

    // パターン4: 作業指示・実績管理画面に留まっている
    const stillOnWorkInstructionScreen = currentUrl.includes('scr-1789461813941');

    // パターン5: エラー画面へリダイレクト
    const onErrorPage =
      currentUrl.includes('403') ||
      currentUrl.includes('error') ||
      currentUrl.includes('forbidden');

    // エラー表示の有無を確認（isForbiddenPage、hasErrorMessage、hasAuthError のいずれか）
    const hasErrorDisplay = isForbiddenPage || hasErrorMessage || hasAuthError;

    // 人員配置最適化提案画面には遷移していないことを確認
    const isOnProposalScreen = currentUrl.includes('scr-1789461798629');
    expect(isOnProposalScreen).toBeFalsy();

    // 仕様の期待結果：エラーページまたはエラーメッセージが表示される必須
    expect(hasErrorDisplay || onErrorPage).toBeTruthy();

    // 仕様の期待結果：ユーザーは元の画面に留まるか、エラー画面へリダイレクト
    const userStaysOrErrorRedirect = stillOnWorkInstructionScreen || onErrorPage;
    expect(userStaysOrErrorRedirect).toBeTruthy();

    // ネットワークログで人員配置最適化提案画面へのすべてのリソース取得リクエストを確認
    const proposalScreenHtmlRequests = responses.filter(
      (r) => r.url.includes('/panels/scr-1789461798629.html')
    );

    const proposalScreenApiRequests = responses.filter(
      (r) => r.url.includes('scr-1789461798629') && r.url.includes('/api/')
    );

    const allProposalRequests = [...proposalScreenHtmlRequests, ...proposalScreenApiRequests];

    // リクエストが403で拒否されているか、送信されていないかを確認
    const isForbiddenInLog = allProposalRequests.some((r) => r.status === 403);
    const requestNotSent = allProposalRequests.length === 0;

    // 仕様の期待結果：リソース取得リクエストが送信されていないか、403で拒否されている
    expect(requestNotSent || isForbiddenInLog).toBeTruthy();

    // 総合確認：エラー表示と遷移拒否が同時に成立
    expect(hasErrorDisplay || onErrorPage).toBeTruthy();
    expect(!isOnProposalScreen).toBeTruthy();
    expect(requestNotSent || isForbiddenInLog).toBeTruthy();
  });
});