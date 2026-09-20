import { test, expect } from '@playwright/test';

test.describe('SCEN-1219: 人員配置最適化提案画面遷移', () => {
  test('ユーザー認証に失敗した場合、人員配置最適化提案画面への遷移が拒否される', async ({ page, context }) => {
    // ステップ1: テストブラウザを起動し、進捗・人員配置ダッシュボード画面にアクセス
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // ダッシュボード画面の初期URLを記録
    const initialUrl = page.url();

    // ステップ2: ナビゲーション操作（リンククリックを実行）
    // 認証ゲートウェイへのリクエストが到達し、失敗するシナリオを監視
    
    // ページ遷移イベントを監視
    let navigationAttempted = false;
    let navigationCompleted = false;
    
    page.on('framenavigated', () => {
      navigationCompleted = true;
    });

    // ネットワークレスポンスを監視して認証失敗を検出
    let authFailureDetected = false;
    page.on('response', (response) => {
      if ((response.status() === 401 || response.status() === 403)) {
        authFailureDetected = true;
      }
    });

    // ナビゲーション操作を実行
    const proposalNavLink = page.locator('[id="scr-1789461798629"]');
    const linkVisible = await proposalNavLink.isVisible().catch(() => false);
    
    navigationAttempted = true;
    if (linkVisible) {
      await proposalNavLink.click();
    } else {
      const proposalButton = page.locator('button:has-text("人員配置最適化提案")');
      await proposalButton.first().click();
    }

    // ステップ3: 認証ゲートウェイへのリクエストの結果を監視
    // ページ遷移の完了を待つか、タイムアウト
    await page.waitForLoadState('networkidle').catch(() => {
      // 認証失敗によりページが遷移しない場合がある
    });

    // ステップ4: 実際の画面遷移結果を確認
    const currentUrl = page.url();
    const pageContent = await page.content();

    // (1) ログイン画面へ自動リダイレクトされているか確認
    const isRedirectedToLogin = currentUrl.includes('/login') || 
                                currentUrl.includes('login.html');

    // (2) 『認証が無効です。ログインしてください』というエラーメッセージが表示されているか確認
    const authErrorMessageVisible = await page.locator(
      'text=/認証が無効です|ログインしてください/'
    ).isVisible().catch(() => false);

    // (3) HTTP 401/403エラーページの検出
    const isErrorPage = pageContent.includes('401') || 
                        pageContent.includes('403') ||
                        pageContent.includes('Unauthorized') ||
                        pageContent.includes('Forbidden');

    // (4) 人員配置最適化提案画面のコンテンツが表示されていないか確認
    const proposalContainer = page.locator('[id="proposals-container"]');
    const assignmentDetailTable = page.locator('[id="assignment-detail-tbody"]');
    const approveButton = page.locator('[id="approve-btn"]');
    const generateProposalsButton = page.locator('button:has-text("人員配置案を自動生成")');

    const proposalContentVisible = await Promise.all([
      proposalContainer.isVisible().catch(() => false),
      assignmentDetailTable.isVisible().catch(() => false),
      approveButton.isVisible().catch(() => false),
      generateProposalsButton.isVisible().catch(() => false)
    ]).then(results => results.some(v => v === true));

    // ダッシュボード画面またはログイン画面のいずれかに留まっているか確認
    const isStayOnDashboardOrLogin = currentUrl.includes('scr-1789461783315') || 
                                      isRedirectedToLogin;

    // 期待結果の検証
    // (1) 認証失敗の指標を確認
    // 以下のいずれかが成立する必要がある：
    // - 認証ゲートウェイへのリクエストが401/403で失敗
    // - ログイン画面へリダイレクト
    // - エラーメッセージ表示
    // - HTTP 401/403エラーページ
    const hasAuthFailureIndicator = authFailureDetected || 
                                     isRedirectedToLogin || 
                                     authErrorMessageVisible || 
                                     isErrorPage;
    
    expect(hasAuthFailureIndicator).toBeTruthy();

    // (2) 遷移が拒否され、ダッシュボード画面またはログイン画面のいずれかに留まっている
    expect(isStayOnDashboardOrLogin).toBeTruthy();

    // (3) 人員配置最適化提案画面のコンテンツが一切表示されていない
    expect(proposalContentVisible).toBeFalsy();
  });
});