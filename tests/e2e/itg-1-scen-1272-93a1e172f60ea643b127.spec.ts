import { test, expect } from '@playwright/test';

test.describe('進捗遅延リスク分析実行', () => {
  test('現在の完了率が0～100の範囲外の場合、エラーメッセージが表示される', async ({ page }) => {
    // ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    
    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 進捗遅延リスク分析実行のための入力フォームにアクセス
    // ダッシュボード上の「リスク分析実行」ボタンまたは入力フォーム表示ボタンをクリック
    const riskAnalysisButton = page.getByRole('button', { name: /リスク分析|分析実行/ });
    
    // 入力フォームが表示されるまで待機
    // または、フォームが既に表示されている場合はそのまま進行
    const progressRateInput = page.locator('[data-testid="progress-rate"], input[name="progress-rate"], input[aria-label*="完了率"]').first();
    
    // 完了率入力フォームが確認できるまで待機
    await expect(progressRateInput).toBeVisible({ timeout: 5000 }).catch(() => {
      // フォームが見つからない場合、ボタンをクリックして開く
      return riskAnalysisButton.click().then(() => page.waitForLoadState('networkidle'));
    });

    // 完了率に負の値を入力（0～100の範囲外）
    await progressRateInput.fill('-5');
    
    // リスク分析実行ボタンをクリック
    const submitButton = page.getByRole('button', { name: /リスク分析実行|分析実行|送信/ });
    await submitButton.click();
    
    // 入力フォーム下部のエラーメッセージ領域を確認
    // error-bannerまたはerror-messageというIDまたはクラスを持つ要素を探す
    const errorMessageElement = page.locator('#error-banner, .error-banner, [id*="error"], [class*="error-message"]').filter({ hasText: '進捗データが不正です' });
    
    // エラーメッセージが表示されることを確認
    await expect(errorMessageElement).toBeVisible();
    await expect(errorMessageElement).toContainText('進捗データが不正です。完了率は0～100の範囲で入力してください');

    // ページが遷移していないことを確認（フォーム送信が停止していることを確認）
    await expect(page).toHaveURL(/scr-1789461783315/);

    // 完了率入力欄をクリアして100を超える値で同じテストを実行
    await progressRateInput.clear();
    await progressRateInput.fill('105');
    
    // リスク分析実行ボタンをクリック
    await submitButton.click();
    
    // 同じエラーメッセージが表示されることを確認
    await expect(errorMessageElement).toBeVisible();
    await expect(errorMessageElement).toContainText('進捗データが不正です。完了率は0～100の範囲で入力してください');

    // ページが遷移していないことを確認（フォーム送信が停止していることを確認）
    await expect(page).toHaveURL(/scr-1789461783315/);
  });
});