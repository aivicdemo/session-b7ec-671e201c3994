import { test, expect } from '@playwright/test';

test.describe('SCEN-912: 認証済みだが権限のないユーザーが配置案実績参照を実行しようとすると、権限検証段階で処理が止まる', () => {
  test('権限なしユーザーが配置案実績参照を試行すると権限エラーが表示される', async ({ page }) => {
    // テストユーザー（認証済みだが配置案実績参照権限なし）でシステムにログインする
    await page.goto('/');
    
    // ログイン画面が表示されるまで待機
    await page.waitForSelector('input[placeholder*="ユーザー"], input[type="text"], input[placeholder*="ID"]');
    
    // ユーザー名を入力
    const userInputs = await page.locator('input[type="text"], input[type="email"]').all();
    if (userInputs.length > 0) {
      await userInputs[0].fill('test_user_no_permission');
    }
    
    // パスワードを入力
    const passwordInputs = await page.locator('input[type="password"]').all();
    if (passwordInputs.length > 0) {
      await passwordInputs[0].fill('password123');
    }
    
    // ログインボタンをクリック
    await page.click('button:has-text("ログイン"), button:has-text("Login"), button:has-text("送信")');
    
    // ログイン後の画面遷移を待機
    await page.waitForLoadState('networkidle');
    
    // 生産性ダッシュボード・分析画面へ遷移する
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');
    
    // 生産性ダッシュボード・分析画面から最適人員配置案提案・実行画面へ遷移する
    // ダッシュボード画面から配置案画面へのリンク・ボタンをクリック
    const navigationLink = await page.locator(
      'a:has-text("配置案"), button:has-text("配置案"), a:has-text("最適人員"), button:has-text("最適人員")'
    ).first();
    if (await navigationLink.isVisible()) {
      await navigationLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      // リンクが見つからない場合は直接遷移
      await page.goto('/panels/scr-1789461978707.html');
      await page.waitForLoadState('networkidle');
    }
    
    // 最適人員配置案提案・実行画面で配置案実績の参照操作を試行
    // 配置案一覧表示ボタンをクリック
    const listButton = await page.locator('button:has-text("配置案"), button:has-text("一覧"), button:has-text("参照")').first();
    if (await listButton.isVisible()) {
      await listButton.click();
    } else {
      // 過去配置案の詳細表示を試みる
      const detailButton = await page.locator('button:has-text("詳細"), a:has-text("詳細")').first();
      if (await detailButton.isVisible()) {
        await detailButton.click();
      }
    }
    
    // 権限検証段階で処理が中断され、権限エラーメッセージが表示される
    const errorMessage = page.locator(
      'text=/このユーザーアカウントには配置案実績参照の権限がありません|権限がありません|アクセス権限がありません/'
    );
    
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    // 画面遷移が発生していないことを確認
    expect(page.url()).toContain('scr-1789461978707');
    
    // 配置案実績データが一切表示されていないことを確認
    const dataTable = page.locator('table, [role="grid"], [role="table"]');
    const tableCount = await dataTable.count();
    
    if (tableCount > 0) {
      // テーブルが存在する場合、行数が0であることを確認
      const rows = await dataTable.first().locator('tbody tr, [role="row"]').count();
      expect(rows).toBe(0);
    } else {
      // テーブルが存在しないことを確認
      expect(tableCount).toBe(0);
    }
  });
});