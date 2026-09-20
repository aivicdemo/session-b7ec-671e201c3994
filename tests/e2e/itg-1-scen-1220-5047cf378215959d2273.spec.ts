import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-1220: 人員配置最適化提案画面遷移', () => {
  let page: Page;
  const LOGIN_URL = '/';
  const DASHBOARD_URL = '/panels/scr-1789461783315.html';
  const PROPOSAL_URL = '/panels/scr-1789461798629.html';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('認証済みだがアクセス権限がないユーザーが遷移を要求した場合、画面表示が拒否される', async () => {
    // テストユーザー（認証済み・アクセス権限なし）でシステムにログイン
    await test.step('テストユーザー（認証済み・アクセス権限なし）でシステムにログインする', async () => {
      await page.goto(LOGIN_URL);

      // ログインフォームが表示されるまで待機
      await page.waitForSelector('.login-card', { timeout: 5000 });

      // ユーザー名とパスワードを入力
      await page.fill('input[placeholder*="ユーザー"]', 'testuser_no_permission');
      await page.fill('input[type="password"]', 'password123');

      // ログインボタンをクリック
      await page.click('button:has-text("ログイン")');

      // ログイン完了を待つ
      await page.waitForNavigation({ waitUntil: 'networkidle' });
    });

    // 進捗・人員配置ダッシュボード画面を表示
    await test.step('進捗・人員配置ダッシュボード画面を表示する', async () => {
      await page.goto(DASHBOARD_URL);

      // ダッシュボード画面が表示されるまで待機
      await page.waitForSelector('[data-testid="kpi-risk-count"]', { timeout: 5000 });

      // ダッシュボード画面に表示されていることを確認
      const dashboardContent = await page.locator('[data-testid="kpi-risk-count"]');
      await expect(dashboardContent).toBeVisible();
    });

    // コンソールエラーを記録するリスナーを設定
    const consoleMessages: Array<{ type: string; text: string }> = [];
    page.on('console', (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    // 人員配置最適化提案・実行画面への遷移を要求
    await test.step('人員配置最適化提案・実行画面への遷移を要求する', async () => {
      // ナビゲーションメニューから遷移を要求
      const proposalNavItem = page.locator('nav [data-nav-id="scr-1789461798629"]');

      if (await proposalNavItem.isVisible({ timeout: 1000 }).catch(() => false)) {
        await proposalNavItem.click();
      } else {
        // ナビゲーションが見当たらない場合、URL直接入力で遷移を要求
        await page.goto(PROPOSAL_URL);
      }
    });

    // 画面遷移の処理完了を待つ（最大10秒）
    await test.step('画面遷移の処理完了を待つ', async () => {
      // エラーメッセージまたはダイアログが表示されるまで待機（最大10秒）
      const errorLocators = [
        page.locator('text=/このページへのアクセス権限がありません|権限がありません|403|Forbidden/i'),
        page.locator('[role="alertdialog"]'),
        page.locator('[role="alert"]'),
        page.locator('.error-banner'),
        page.locator('.toast-error')
      ];

      let errorFound = false;
      const startTime = Date.now();
      const maxWaitTime = 10000;

      while (!errorFound && Date.now() - startTime < maxWaitTime) {
        for (const locator of errorLocators) {
          if (await locator.isVisible({ timeout: 500 }).catch(() => false)) {
            errorFound = true;
            break;
          }
        }
        if (!errorFound) {
          await page.waitForTimeout(100);
        }
      }
    });

    // 期待結果の検証
    await test.step('人員配置最適化提案・実行画面は表示されず、エラーが表示される', async () => {
      // 現在のURLがダッシュボードのままであることを確認
      const currentUrl = page.url();
      expect(currentUrl).toContain('scr-1789461783315');
      expect(currentUrl).not.toContain('scr-1789461798629');

      // エラーメッセージまたはダイアログが画面上に表示されているか確認
      const errorLocators = [
        page.locator('text=/このページへのアクセス権限がありません|権限がありません|403|Forbidden/i'),
        page.locator('[role="alertdialog"]'),
        page.locator('[role="alert"]'),
        page.locator('.error-banner'),
        page.locator('.toast-error')
      ];

      let errorFound = false;
      for (const locator of errorLocators) {
        if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
          errorFound = true;
          break;
        }
      }

      expect(errorFound).toBe(true);

      // ブラウザのコンソールにエラーログが記録されていることを確認
      const errorLogs = consoleMessages.filter(msg => msg.type === 'error');
      expect(errorLogs.length).toBeGreaterThan(0);

      // 遷移先画面の要素がレンダリングされていないことを確認
      const proposalScreenElements = [
        page.locator('[data-testid="progress-rate"]'),
        page.locator('[data-testid="generate-proposals-btn"]'),
        page.locator('[data-testid="assignment-detail-table"]')
      ];

      for (const element of proposalScreenElements) {
        await expect(element).not.toBeVisible();
      }

      // ダッシュボード画面の主要な要素がまだ表示されていることを確認
      const dashboardElement = page.locator('[data-testid="kpi-risk-count"]');
      await expect(dashboardElement).toBeVisible();
    });
  });
});