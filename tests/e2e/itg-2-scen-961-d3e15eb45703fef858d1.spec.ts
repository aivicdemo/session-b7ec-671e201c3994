import { test, expect } from '@playwright/test';

test.describe('SCEN-961: 実績データ入力時配置案参照', () => {
  test('認証に成功した作業者が実績データ入力画面から配置案参照を開始すると、ユーザー権限が検証されて以降の処理が進行する', async ({ page }) => {
    // Step 1: テストユーザーで本システムにログインし、認証を完了する
    await page.goto('/');
    await page.waitForURL(/login|auth/);
    
    // ログインフォームの入力
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass');
    await page.click('button[type="submit"]');
    
    // ログイン後の自動遷移を待機
    await page.waitForNavigation();

    // Step 2: 生産性ダッシュボード・分析画面から作業実績データ記録・入力画面に遷移する
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');
    
    // 作業実績データ記録・入力画面への遷移リンクをクリック
    const inputScreenLink = page.locator('a, button').filter({ 
      has: page.locator('text=作業実績データ記録・入力|実績データ入力') 
    }).first();
    await inputScreenLink.click();
    await page.waitForNavigation();

    // Step 3: 作業実績データ記録・入力画面で、実績データ入力フォームが表示されていることを確認する
    await page.waitForLoadState('networkidle');
    const inputForm = page.locator('form, [class*="form"], [class*="input"]').first();
    await expect(inputForm).toBeVisible();

    // Step 4: 作業実績データ記録・入力画面内の『配置案参照』ボタンをクリックして、配置案参照処理を開始する
    const referenceButton = page.locator('button').filter({ 
      hasText: /配置案参照|配置案を参照/ 
    }).first();
    await expect(referenceButton).toBeVisible();
    
    // Step 5: システムがログイン中のユーザー権限情報を取得し、権限検証処理を実行する
    // ボタンクリックにより権限検証と画面遷移が開始される
    const navigationPromise = page.waitForNavigation();
    await referenceButton.click();
    
    // Step 6: 権限検証が完了し、最適人員配置案提案・実行画面への遷移処理が開始される
    // ボタンクリック後の自動遷移を待機
    await navigationPromise;
    await page.waitForLoadState('networkidle');

    // 期待結果: 最適人員配置案提案・実行画面が表示され、初期データが正常に読み込まれたことを確認
    // 遷移先URLが配置案参照画面であることを確認
    await expect(page).toHaveURL(/scr-1789461978707/);
    
    // 配置案一覧またはフィルタ条件入力フォームが正常に読み込まれたことを確認
    const placementContent = page.locator('[class*="placement"], [class*="proposal"], table, form').first();
    await expect(placementContent).toBeVisible();

    // ページが正常に読み込まれたことを確認
    const pageTitle = page.locator('h1, h2, [class*="title"]').first();
    await expect(pageTitle).toBeVisible();
  });
});