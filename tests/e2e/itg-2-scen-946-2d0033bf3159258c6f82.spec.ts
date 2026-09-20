import { test, expect } from '@playwright/test';

test.describe('配置案実行', () => {
  test('画面から送信された配置案ID・変更内容・実行日時などの入力データの形式・値域・必須項目が検証され、妥当であれば次工程へ進む', async ({ page }) => {
    // ログイン処理
    await page.goto('/');
    await page.fill('input[placeholder*="ユーザー" i]', 'testuser');
    await page.fill('input[placeholder*="パスワード" i]', 'testpass');
    await page.click('button:has-text("ログイン")');
    await page.waitForNavigation();

    // 生産性ダッシュボード・分析画面を開く
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');

    // 配置案を選択し、配置案実行ボタンをクリック
    await test.step('配置案を選択して実行ボタンをクリック', async () => {
      // 配置案の選択
      await page.click('[data-testid="deployment-plan-item"], .deployment-plan-select, [class*="plan"]');
      
      // 配置案実行ボタンをクリック
      await page.click('button:has-text("配置案実行"), [data-testid="execute-deployment-btn"]');
    });

    // 配置案実行ダイアログが表示される確認
    await page.waitForSelector('[role="dialog"], .modal, [class*="dialog"]', { timeout: 5000 });
    const dialog = page.locator('[role="dialog"], .modal, [class*="dialog"]');
    await expect(dialog).toBeVisible();

    // ダイアログに必須入力項目が表示されていることを確認
    await test.step('ダイアログに必須入力項目が表示されていることを確認', async () => {
      // 配置案ID
      await expect(page.locator('label:has-text("配置案ID"), [class*="plan-id"]')).toBeVisible();
      
      // 変更対象作業者
      await expect(page.locator('label:has-text("変更対象作業者"), [class*="worker"], [class*="employee"]')).toBeVisible();
      
      // 変更後の配置内容
      await expect(page.locator('label:has-text("変更後"), label:has-text("配置内容"), [class*="placement"], [class*="assignment"]')).toBeVisible();
      
      // 実行日時
      await expect(page.locator('label:has-text("実行日時"), label:has-text("日時"), [class*="datetime"], [class*="execution-time"]')).toBeVisible();
    });

    // ダイアログに有効な入力値を入力
    await test.step('ダイアログにすべての有効な入力値を入力', async () => {
      // 配置案ID入力
      await page.fill('input[placeholder*="配置案ID"], input[name*="plan"], input[id*="plan"]', 'DEPLOY-2024-001');
      
      // 変更対象作業者入力
      await page.fill('input[placeholder*="作業者"], input[name*="worker"], input[id*="worker"]', '作業者ID');
      
      // 変更後配置内容入力
      await page.fill('input[placeholder*="配置"], input[name*="placement"], input[id*="placement"]', 'ライン2へ配置');
      
      // 実行日時入力（未来の日時）
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateString = futureDate.toISOString().slice(0, 16);
      await page.fill('input[placeholder*="日時"], input[type="datetime-local"], input[name*="datetime"], input[id*="datetime"]', dateString);
    });

    // 実行ボタンをクリック
    await page.click('button:has-text("実行"), [data-testid="execute-btn"]');

    // ローディング状態になることを確認
    await page.waitForSelector('[class*="loading"], [class*="spinner"], .loader', { timeout: 10000 }).catch(() => {});

    // バックエンド検証の完了を待機
    await page.waitForTimeout(2000);

    // 検証成功時：確認画面へ遷移し、入力データが表示されることを確認
    await test.step('配置案実行確認画面に遷移し、入力データが表示されることを確認', async () => {
      // 確認画面への遷移を確認（scr-1789461978707.html へ遷移することを期待）
      await expect(page).toHaveURL(/scr-1789461978707\.html/);
      
      // 入力した配置案IDが表示されることを確認
      await expect(page.locator('text=DEPLOY-2024-001')).toBeVisible({ timeout: 10000 });
      
      // 入力した変更対象作業者が表示されることを確認
      await expect(page.locator('text=作業者ID')).toBeVisible();
      
      // 入力した変更内容が表示されることを確認
      await expect(page.locator('text=ライン2へ配置')).toBeVisible();
      
      // 入力した実行日時が表示されることを確認
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const expectedDatePart = futureDate.toISOString().slice(0, 10);
      await expect(page.locator(`text=${expectedDatePart}`)).toBeVisible();
    });
  });

  test('入力値が不正な形式の場合、エラーメッセージが画面上部に表示されダイアログは閉じない', async ({ page }) => {
    // ログイン処理
    await page.goto('/');
    await page.fill('input[placeholder*="ユーザー" i]', 'testuser');
    await page.fill('input[placeholder*="パスワード" i]', 'testpass');
    await page.click('button:has-text("ログイン")');
    await page.waitForNavigation();

    // 生産性ダッシュボード・分析画面を開く
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');

    // 配置案を選択し、配置案実行ボタンをクリック
    await page.click('[data-testid="deployment-plan-item"], .deployment-plan-select, [class*="plan"]');
    await page.click('button:has-text("配置案実行"), [data-testid="execute-deployment-btn"]');

    // 配置案実行ダイアログが表示される
    await page.waitForSelector('[role="dialog"], .modal, [class*="dialog"]', { timeout: 5000 });

    // 不正な値を入力
    await test.step('不正な入力値でテスト', async () => {
      // 配置案ID：不正な形式
      await page.fill('input[placeholder*="配置案ID"], input[name*="plan"], input[id*="plan"]', 'INVALID');
      
      // 変更対象作業者
      await page.fill('input[placeholder*="作業者"], input[name*="worker"], input[id*="worker"]', '作業者ID');
      
      // 変更後配置内容
      await page.fill('input[placeholder*="配置"], input[name*="placement"], input[id*="placement"]', 'ライン2へ配置');
      
      // 実行日時：過去日時
      await page.fill('input[placeholder*="日時"], input[type="datetime-local"], input[name*="datetime"], input[id*="datetime"]', '2020-01-15T09:00');
    });

    // 実行ボタンをクリック
    await page.click('button:has-text("実行"), [data-testid="execute-btn"]');

    // ローディング状態を待機
    await page.waitForSelector('[class*="loading"], [class*="spinner"], .loader', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // エラーメッセージが表示されることを確認
    await test.step('エラーメッセージが画面上部に表示され、ダイアログが閉じないことを確認', async () => {
      // 画面上部にエラーメッセージが表示される
      const errorMessage = page.locator('[role="alert"], [class*="error-message"], [class*="error"], [class*="message"]').first();
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
      
      // エラーメッセージが画面の上部に位置していることを確認
      const boundingBox = await errorMessage.boundingBox();
      expect(boundingBox?.y).toBeLessThan(300);
      
      // ダイアログがまだ表示されていることを確認
      const dialog = page.locator('[role="dialog"], .modal, [class*="dialog"]');
      await expect(dialog).toBeVisible();
    });
  });

  test('必須項目が未入力の場合、エラーメッセージが画面上部に表示されダイアログは閉じない', async ({ page }) => {
    // ログイン処理
    await page.goto('/');
    await page.fill('input[placeholder*="ユーザー" i]', 'testuser');
    await page.fill('input[placeholder*="パスワード" i]', 'testpass');
    await page.click('button:has-text("ログイン")');
    await page.waitForNavigation();

    // 生産性ダッシュボード・分析画面を開く
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');

    // 配置案を選択し、配置案実行ボタンをクリック
    await page.click('[data-testid="deployment-plan-item"], .deployment-plan-select, [class*="plan"]');
    await page.click('button:has-text("配置案実行"), [data-testid="execute-deployment-btn"]');

    // 配置案実行ダイアログが表示される
    await page.waitForSelector('[role="dialog"], .modal, [class*="dialog"]', { timeout: 5000 });

    // 一部の項目だけ入力
    await test.step('必須項目の一部を未入力のまま実行', async () => {
      // 配置案IDだけを入力
      await page.fill('input[placeholder*="配置案ID"], input[name*="plan"], input[id*="plan"]', 'DEPLOY-2024-001');
      // 他は未入力のまま
    });

    // 実行ボタンをクリック
    await page.click('button:has-text("実行"), [data-testid="execute-btn"]');

    // ローディング状態を待機
    await page.waitForSelector('[class*="loading"], [class*="spinner"], .loader', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // エラーメッセージが表示されることを確認
    await test.step('必須項目未入力のエラーメッセージが画面上部に表示され、ダイアログが閉じないことを確認', async () => {
      // 画面上部にエラーメッセージが表示される
      const errorMessage = page.locator('[role="alert"], [class*="error-message"], [class*="error"], [class*="message"]').first();
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
      
      // エラーメッセージが画面の上部に位置していることを確認
      const boundingBox = await errorMessage.boundingBox();
      expect(boundingBox?.y).toBeLessThan(300);
      
      // ダイアログがまだ表示されていることを確認
      const dialog = page.locator('[role="dialog"], .modal, [class*="dialog"]');
      await expect(dialog).toBeVisible();
    });
  });
});