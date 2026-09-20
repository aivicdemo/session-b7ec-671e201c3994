import { test, expect } from '@playwright/test';

test.describe('SCEN-863: 実績データ記録入力権限エラー', () => {
  test('認証済みユーザーが実績データ記録入力操作を実行する権限を持たない場合、操作が拒否されて権限エラーが表示される', async ({ page }) => {
    // ステップ1: テスト用ユーザーアカウント（実績データ記録入力権限なし）で認証し、システムにログインする
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // ログインフォームが表示されることを確認
    await expect(page.locator('.login-card')).toBeVisible();
    
    // テスト用ユーザーでログイン（権限なし）
    await page.fill('input[name="userId"]', 'test-user-no-permission');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // ステップ2: 生産性ダッシュボード・分析画面から作業実績データ記録・入力画面への遷移を試みる
    // 現在のURLが生産性ダッシュボード画面であることを確認
    await expect(page).toHaveURL(/scr-1789461964046/);
    
    // 作業実績データ記録・入力画面へのナビゲーション
    await page.goto('/panels/scr-1789461993203.html');
    await page.waitForLoadState('networkidle');
    
    // ステップ3: 作業実績データ記録・入力画面で、データ入力フィールド（作業タイプ、部門、実績数値など）への入力操作を試みる
    // データ入力フィールドが表示されていることを確認
    const workTypeField = page.locator('input[name="workType"], select[name="workType"], [data-testid="work-type"]').first();
    const departmentField = page.locator('input[name="department"], select[name="department"], [data-testid="department"]').first();
    const performanceField = page.locator('input[name="performance"], input[name="performanceValue"], [data-testid="performance"]').first();
    
    // フィールドが表示されていることを確認（存在確認）
    if (await workTypeField.isVisible()) {
      await workTypeField.fill('test-work-type');
    }
    if (await departmentField.isVisible()) {
      await departmentField.fill('test-department');
    }
    if (await performanceField.isVisible()) {
      await performanceField.fill('100');
    }
    
    // ステップ4: 入力したデータを保存しようとして送信ボタンをクリックする
    const submitButton = page.locator('button[type="submit"], button:has-text("送信"), button:has-text("保存")').first();
    await submitButton.click();
    await page.waitForLoadState('networkidle');
    
    // 期待結果: 送信ボタンクリック時に、操作が拒否されて画面上に権限エラーメッセージが表示される
    const errorMessage = page.locator('[role="alert"], .error-message, .permission-error, [data-testid="error-message"]').first();
    await expect(errorMessage).toBeVisible();
    
    // エラーメッセージに権限関連のテキストが含まれることを確認
    await expect(errorMessage).toContainText(/権限|permission|拒否|denied|実行する権限/i);
    
    // データは送信されず、画面は作業実績データ記録・入力画面のままで遷移しないことを確認
    await expect(page).toHaveURL(/scr-1789461993203/);
  });
});