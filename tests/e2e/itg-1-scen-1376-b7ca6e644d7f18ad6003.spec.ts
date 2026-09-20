import { test, expect } from '@playwright/test';

test.describe('SCEN-1376: 人員配置案却下', () => {
  test('既に承認・配信済みの人員配置案に対して却下ボタンを操作するとエラーが発生する', async ({ page }) => {
    // 前提：ブラウザで進捗・人員配置ダッシュボードにログイン
    await page.goto('/');
    
    // ログイン画面からログイン処理
    await page.fill('input[placeholder*="ユーザーID"]', 'testuser');
    await page.fill('input[placeholder*="パスワード"]', 'password');
    await page.click('button:has-text("ログイン")');
    
    // ダッシュボード画面への自動遷移を待機
    await page.waitForURL('**/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');
    
    // ダッシュボードから人員配置最適化提案・実行画面へ遷移
    await page.click('a[href*="scr-1789461798629"]');
    await page.waitForURL('**/scr-1789461798629.html');
    await page.waitForLoadState('networkidle');
    
    // ステータスが『承認済み・配信済み』の人員配置案を選択
    // 表示されている人員配置案の中から配信済み状態のものを特定
    const proposalRow = page.locator('text="承認済み・配信済み"').first();
    await proposalRow.click();
    
    // 選択した人員配置案の詳細パネルが表示されるまで待機
    await page.waitForSelector('[id="proposal-detail-container"]');
    
    // 『却下』ボタンをクリック
    const rejectButton = page.locator('button:has-text("配置案を却下")');
    await rejectButton.click();
    
    // エラーダイアログが表示されることを待機
    // error-banner または error-message 要素でエラー表示を確認
    const errorBanner = page.locator('[id="error-banner"]');
    const errorMessage = page.locator('[id="error-message"]');
    
    // どちらかのエラー要素が表示されるまで待機
    await Promise.race([
      errorBanner.waitFor({ state: 'visible', timeout: 5000 }),
      errorMessage.waitFor({ state: 'visible', timeout: 5000 })
    ]).catch(() => {
      // フォールバック：エラーテキストが表示されるか確認
      return page.locator('text="この人員配置案は既に承認・配信済みのため却下できません"').waitFor({ state: 'visible', timeout: 5000 });
    });
    
    // エラーメッセージの内容を確認
    const errorContent = page.locator('text="この人員配置案は既に承認・配信済みのため却下できません"');
    await expect(errorContent).toBeVisible();
    
    // エラーコードが表示されていることを確認
    const errorCode = page.locator('text=/ERR_STAFFING_PLAN_ALREADY_DISTRIBUTED/');
    await expect(errorCode).toBeVisible();
    
    // 画面が人員配置最適化提案・実行画面のまま留まっていることを確認
    await expect(page).toHaveURL('**/scr-1789461798629.html');
    
    // 人員配置案のステータスが『承認済み・配信済み』のまま変更されていないことを確認
    const statusAfter = page.locator('text="承認済み・配信済み"').first();
    await expect(statusAfter).toBeVisible();
    
    // 却下ボタンが再度操作可能な状態に戻っていることを確認
    await expect(rejectButton).toBeEnabled();
  });
});