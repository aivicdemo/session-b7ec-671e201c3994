import { test, expect } from '@playwright/test';

test.describe('人員配置最適化提案画面遷移（実績管理画面から）', () => {
  test('セッションが無効なユーザーが人員配置最適化提案画面への遷移を要求すると、遷移が拒否される', async ({ browser, baseURL }) => {
    // テスト環境でセッション管理機能を初期化し、すべてのアクティブセッションを無効化
    const apiUrl = baseURL || 'http://localhost:3000';
    try {
      await fetch(`${apiUrl}/api/test/sessions/invalidate-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      // テスト環境の初期化エンドポイントが存在しない場合も継続
    }

    // Playwrightブラウザコンテキストを起動し、セッションクッキー・認証トークンを保持しない状態を確認
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();

    // 作業指示・実績管理画面のURL（またはそこからのナビゲーション）から、人員配置最適化提案・実行画面への遷移を要求する操作を実行
    // まず作業指示・実績管理画面にアクセス
    await page.goto('/panels/scr-1789461813941.html', { waitUntil: 'networkidle' });

    // ナビゲーション要素を探してクリック、またはURL直接アクセスで遷移を要求
    const navLink = page.locator('nav a, [class*="nav"] a').filter({ has: page.locator('text=/人員配置最適化提案/') }).first();
    
    if (await navLink.isVisible().catch(() => false)) {
      // ナビゲーションリンクが見つかる場合はクリック
      await navLink.click();
    } else {
      // リンクが見つからない場合は直接アクセス
      await page.goto('/panels/scr-1789461798629.html', { waitUntil: 'networkidle' });
    }

    // ブラウザの遷移完了を待つ
    await page.waitForLoadState('networkidle');

    // セッション無効状態でのアクセス要求のため、人員配置最適化提案・実行画面への遷移が拒否され、
    // ブラウザは認証要求画面（ログイン画面またはセッション無効エラーページ）にリダイレクトされることを確認

    // ログイン画面の本体コンテンツが表示されているか確認
    const loginCard = page.locator('.login-card');
    const loginForm = page.locator('.login-form');
    const loginTitle = page.locator('.login-title');
    
    // または、セッション無効エラーページの要素を確認
    const errorContent = page.locator('[id*="error"], [class*="error"]');

    // 人員配置最適化提案・実行画面の本体コンテンツが読み込まれていないことを確認
    const proposalsContainer = page.locator('#proposals-container');
    const proposalDetailContainer = page.locator('#proposal-detail-container');
    const assignmentDetailTable = page.locator('#assignment-detail-tbody');

    // 期待結果の検証：
    // 1. 人員配置最適化提案・実行画面の本体コンテンツが一切読み込まれていない
    expect(await proposalsContainer.isVisible().catch(() => false)).toBeFalsy();
    expect(await proposalDetailContainer.isVisible().catch(() => false)).toBeFalsy();
    expect(await assignmentDetailTable.isVisible().catch(() => false)).toBeFalsy();

    // 2. ログイン画面またはセッション無効エラーページが表示されている
    const isLoginPageVisible = await loginCard.isVisible().catch(() => false) || 
                               await loginForm.isVisible().catch(() => false) ||
                               await loginTitle.isVisible().catch(() => false);
    
    const isErrorPageVisible = await errorContent.isVisible().catch(() => false);

    expect(isLoginPageVisible || isErrorPageVisible).toBeTruthy();

    // ブラウザコンテキストをクローズ
    await context.close();
  });
});