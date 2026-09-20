import { test, expect } from '@playwright/test';

test.describe('人員配置案承認', () => {
  test('ユーザーセッションが無効な場合、認証段階で処理が中断される', async ({ page, context }) => {
    // ログイン画面にアクセス
    await page.goto('/');
    await page.waitForURL('**/login.html', { timeout: 10000 }).catch(() => {});

    // ログイン処理
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    // ログイン後の自動遷移を待つ
    await page.waitForURL('**/scr-1789461783315.html', { timeout: 10000 });

    // ナビゲーションから人員配置最適化提案・実行画面へ遷移
    await page.click('[data-testid="scr-1789461798629"]');
    await page.waitForURL('**/scr-1789461798629.html', { timeout: 10000 });

    // セッションを無効にする：すべてのクッキーを削除
    await context.clearCookies();

    // 承認ボタンをクリック
    await page.click('[data-testid="approve-button"]');

    // セッションエラーメッセージが表示されるか確認
    const errorMessage = page.locator('text=/セッションが無効です|認証エラー/i');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // ログイン画面へ自動遷移することを確認
    await page.waitForURL('**/login.html', { timeout: 10000 });
    await expect(page).toHaveURL(/login\.html/);
  });
});