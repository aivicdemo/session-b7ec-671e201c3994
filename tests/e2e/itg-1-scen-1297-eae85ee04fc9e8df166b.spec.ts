import { test, expect } from '@playwright/test';

test.describe('SCEN-1297: リスク分析結果確認 - Twilio通知配信遅延時のメッセージ表示', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン画面へアクセス
    await page.goto('/');
    
    // ログインフォームが表示されるまで待機
    await page.waitForSelector('input[type="text"]');
    
    // ログイン実行（テスト用認証情報）
    await page.fill('input[placeholder*="ユーザー"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    
    // ダッシュボード画面への自動遷移完了を待機
    await page.waitForURL(/panels\/scr-\d+\.html/);
    await page.waitForSelector('[data-testid="kpi-risk-count"]', { timeout: 10000 });
  });

  test('人員配置案を配信時のTwilio通知配信遅延でメッセージが表示される', async ({ page }) => {
    // Step 1: 進捗・人員配置ダッシュボード画面を確認
    await expect(page).toHaveTitle(/作業管理システム/);
    const kpiElement = page.locator('[data-testid="kpi-risk-count"]');
    await expect(kpiElement).toBeVisible();

    // Twilio通知配信リクエストに接続タイムアウト相当の状況をシミュレート
    await page.route('**/api/**/notify', async (route) => {
      // 接続タイムアウト相当のエラーレスポンスを返す
      await route.abort('timedout');
    });

    // Step 2: 人員配置案を配信する操作を実行
    // 人員配置最適化提案ページへ遷移
    const optimizationLink = page.locator('a, button').filter({ hasText: '人員配置最適化提案' });
    await expect(optimizationLink).toBeVisible();
    await optimizationLink.click();
    
    // 配置案生成ボタンをクリック
    const generateButton = page.locator('button:has-text("人員配置案を自動生成")');
    await expect(generateButton).toBeVisible({ timeout: 10000 });
    await generateButton.click();

    // 配置案が生成されるのを待機
    await page.waitForTimeout(2000);

    // 配置案を承認する操作を実行
    const approveButton = page.locator('[data-testid="approve-button"]');
    if (await approveButton.isVisible()) {
      await approveButton.click();
      
      // 承認モーダルが表示される場合、確認ボタンをクリック
      const approveModalConfirm = page.locator('[data-testid="approve-modal-confirm"]');
      if (await approveModalConfirm.isVisible({ timeout: 5000 }).catch(() => false)) {
        await approveModalConfirm.click();
      }
    }

    // 配置案と作業指示を一括配信する操作を実行
    const distributeButton = page.locator('[data-testid="distribute-button"]');
    if (await distributeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await distributeButton.click();
      
      // 配信モーダルが表示される場合、確認ボタンをクリック
      const distributeModalConfirm = page.locator('[data-testid="distribute-modal-confirm"]');
      if (await distributeModalConfirm.isVisible({ timeout: 5000 }).catch(() => false)) {
        await distributeModalConfirm.click();
      }
    }

    // Step 3 & 4: 画面上にメッセージが表示されることを確認
    // 参考情報から error-banner を取得
    const errorBanner = page.locator('#error-banner');
    
    // error-banner が表示されるまで待機
    await expect(errorBanner).toBeVisible({ timeout: 15000 });
    
    // メッセージ内容を取得
    const messageText = await errorBanner.textContent() || '';
    
    // 仕様で要求される正確な文言を確認
    expect(messageText).toContain('配信に一時的な遅延が発生しています。数分以内に再試行します');

    // バナーが画面上部に表示されていることを確認（固定バナー）
    const boundingBox = await errorBanner.boundingBox();
    expect(boundingBox).toBeTruthy();
    if (boundingBox) {
      expect(boundingBox.y).toBeLessThan(200); // 画面上部であることを確認
    }

    // 画面の操作が継続可能であることを確認
    // ダッシュボードリンクなど他の要素がクリック可能な状態を確認
    const dashboardLink = page.locator('button:has-text("進捗・人員配置ダッシュボード")');
    await expect(dashboardLink).toBeEnabled();
    
    // 他の操作も可能であることを確認
    const filterButton = page.locator('[data-testid="site-filter"]');
    if (await filterButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(filterButton).toBeEnabled();
    }
  });

  test('リスク分析実行時のTwilio通知配信遅延でメッセージが表示される', async ({ page }) => {
    // Step 1: 進捗・人員配置ダッシュボード画面を確認
    await expect(page).toHaveTitle(/作業管理システム/);
    const kpiElement = page.locator('[data-testid="kpi-risk-count"]');
    await expect(kpiElement).toBeVisible();

    // Twilio通知配信リクエストに接続タイムアウト相当の状況をシミュレート
    await page.route('**/api/**/notify', async (route) => {
      // 接続タイムアウト相当のエラーレスポンスを返す
      await route.abort('timedout');
    });

    // Step 2: リスク分析を実行する操作を実行
    const confirmButton = page.locator('[data-testid="confirm-results-button"]');
    if (await confirmButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(confirmButton).toBeEnabled();
      await confirmButton.click();
    } else {
      // リスク分析実行ボタンが見つからない場合は、最適化提案画面での操作を試みる
      const optimizationLink = page.locator('a, button').filter({ hasText: '人員配置最適化提案' });
      await expect(optimizationLink).toBeVisible();
      await optimizationLink.click();
      
      const generateButton = page.locator('button:has-text("人員配置案を自動生成")');
      await expect(generateButton).toBeVisible({ timeout: 10000 });
      await generateButton.click();
    }

    // Step 3 & 4: メッセージが表示されることを確認
    // 参考情報から error-banner を取得
    const errorBanner = page.locator('#error-banner');
    
    // error-banner が表示されるまで待機
    await expect(errorBanner).toBeVisible({ timeout: 15000 });
    
    // メッセージ内容を取得
    const messageText = await errorBanner.textContent() || '';
    
    // 仕様で要求される正確な文言を確認
    expect(messageText).toContain('配信に一時的な遅延が発生しています。数分以内に再試行します');

    // バナーが画面上部に表示されていることを確認
    const boundingBox = await errorBanner.boundingBox();
    expect(boundingBox).toBeTruthy();
    if (boundingBox) {
      expect(boundingBox.y).toBeLessThan(200);
    }

    // 画面の操作が継続可能であることを確認
    const filterButton = page.locator('[data-testid="site-filter"]');
    if (await filterButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(filterButton).toBeEnabled();
    }
  });
});