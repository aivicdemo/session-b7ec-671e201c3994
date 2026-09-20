import { test, expect } from '@playwright/test';

test.describe('ハンディターミナル連携ログ表示', () => {
  test('セッション認証に失敗したユーザーがハンディターミナル連携ログ表示画面へのアクセスを試みると、アクセスが拒否される', async ({ browser, context }) => {
    test.step('テストブラウザ（Google Chrome）を起動し、システムのログイン画面にアクセスする', async () => {
      const page = await context.newPage();
      await page.goto('/', { waitUntil: 'load', timeout: 10000 });
      
      const loginCard = await page.locator('.login-card');
      await expect(loginCard).toBeVisible({ timeout: 5000 });
      
      await page.close();
    });

    test.step('セッション認証に失敗するシナリオを再現する（無効なセッショントークンを持つクッキーを設定してから直接アクセス）', async () => {
      const page = await context.newPage();
      
      await context.addCookies([
        {
          name: 'sessionToken',
          value: 'invalid-session-token-' + Date.now(),
          url: 'http://localhost',
          httpOnly: true,
        },
      ]);

      const response = await page.goto('./panels/scr-1789461813941.html', { 
        waitUntil: 'domcontentloaded', 
        timeout: 10000 
      }).catch(() => {
        return null;
      });

      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      const currentUrl = page.url();
      
      const pageContent = await page.evaluate(() => {
        return {
          bodyText: document.body.innerText,
          hasErrorBanner: !!document.getElementById('error-banner'),
          hasErrorMessage: !!document.getElementById('error-message'),
          errorBannerText: document.getElementById('error-banner')?.innerText || '',
          errorMessageText: document.getElementById('error-message')?.innerText || '',
        };
      });

      const hasLogData = await page.evaluate(() => {
        const handiTerminalContent = document.getElementById('tab-handy-terminal-content');
        if (!handiTerminalContent) return false;
        const rows = handiTerminalContent.querySelectorAll('tbody tr');
        return rows.length > 0;
      });

      const hasLoginLink = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links.some(link => 
          link.textContent.includes('ログイン') || 
          link.href.includes('login')
        );
      });

      const isLoginPage = await page.evaluate(() => {
        return document.querySelector('.login-card') !== null;
      });

      const hasAccessDeniedStatus = response && response.status() === 403;

      const hasErrorMessageText = 
        pageContent.bodyText.includes('セッション認証に失敗しました') || 
        pageContent.bodyText.includes('ログインが必要です') ||
        pageContent.errorBannerText.includes('セッション認証に失敗しました') ||
        pageContent.errorBannerText.includes('ログインが必要です') ||
        pageContent.errorMessageText.includes('セッション認証に失敗しました') ||
        pageContent.errorMessageText.includes('ログインが必要です');

      const isAccessDenied = hasAccessDeniedStatus || pageContent.hasErrorBanner || pageContent.hasErrorMessage || hasErrorMessageText || isLoginPage;

      const hasRedirectOrLink = isLoginPage || hasLoginLink;

      const noLogDataDisplayed = !hasLogData;

      expect(isAccessDenied).toBeTruthy();
      expect(hasRedirectOrLink).toBeTruthy();
      expect(noLogDataDisplayed).toBeTruthy();

      await page.close();
    });

    test.step('ログイン後にセッションを手動で無効化してからナビゲーションを試みるシナリオ', async () => {
      const page = await context.newPage();
      
      await page.goto('/', { waitUntil: 'load', timeout: 10000 });
      
      const loginCard = await page.locator('.login-card');
      await expect(loginCard).toBeVisible({ timeout: 5000 });

      // 有効なセッショントークンを設定してログイン状態をシミュレート
      await context.addCookies([
        {
          name: 'sessionToken',
          value: 'valid-session-token-' + Date.now(),
          url: 'http://localhost',
          httpOnly: true,
        },
      ]);

      // セッショントークンを削除してセッションを無効化
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name === 'sessionToken');
      if (sessionCookie) {
        await context.clearCookies({ name: 'sessionToken' });
      }

      const response = await page.goto('./panels/scr-1789461813941.html', { 
        waitUntil: 'domcontentloaded', 
        timeout: 10000 
      }).catch(() => {
        return null;
      });

      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      const pageContent = await page.evaluate(() => {
        return {
          bodyText: document.body.innerText,
          hasErrorBanner: !!document.getElementById('error-banner'),
          hasErrorMessage: !!document.getElementById('error-message'),
          errorBannerText: document.getElementById('error-banner')?.innerText || '',
          errorMessageText: document.getElementById('error-message')?.innerText || '',
        };
      });

      const hasLogData = await page.evaluate(() => {
        const handiTerminalContent = document.getElementById('tab-handy-terminal-content');
        if (!handiTerminalContent) return false;
        const rows = handiTerminalContent.querySelectorAll('tbody tr');
        return rows.length > 0;
      });

      const hasLoginLink = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links.some(link => 
          link.textContent.includes('ログイン') || 
          link.href.includes('login')
        );
      });

      const isLoginPage = await page.evaluate(() => {
        return document.querySelector('.login-card') !== null;
      });

      const hasAccessDeniedStatus = response && response.status() === 403;

      const hasErrorMessageText = 
        pageContent.bodyText.includes('セッション認証に失敗しました') || 
        pageContent.bodyText.includes('ログインが必要です') ||
        pageContent.errorBannerText.includes('セッション認証に失敗しました') ||
        pageContent.errorBannerText.includes('ログインが必要です') ||
        pageContent.errorMessageText.includes('セッション認証に失敗しました') ||
        pageContent.errorMessageText.includes('ログインが必要です');

      const isAccessDenied = hasAccessDeniedStatus || pageContent.hasErrorBanner || pageContent.hasErrorMessage || hasErrorMessageText || isLoginPage;

      const hasRedirectOrLink = isLoginPage || hasLoginLink;

      const noLogDataDisplayed = !hasLogData;

      expect(isAccessDenied).toBeTruthy();
      expect(hasRedirectOrLink).toBeTruthy();
      expect(noLogDataDisplayed).toBeTruthy();

      await page.close();
    });

    test.step('画面ロード完了を待つ（最大10秒）', async () => {
      // ロード完了待機は前のステップで実施済み
    });
  });
});