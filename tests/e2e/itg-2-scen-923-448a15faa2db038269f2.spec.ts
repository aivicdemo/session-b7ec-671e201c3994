import { test, expect } from '@playwright/test';

test.describe('配置案却下', () => {
  test('必須項目が未入力の状態で配置案却下操作を実行しようとするとき、入力値検証に失敗し却下操作が拒否される', async ({ page }) => {
    // 最適人員配置案提案・実行画面にアクセス
    await page.goto('/panels/scr-1789461978707.html');
    
    // 配置案一覧から却下対象の配置案を選択
    const proposalItem = page.locator('[data-testid="proposal-item"]').first();
    await proposalItem.click();
    
    // 配置案の詳細を表示し、却下操作を実行するボタンをクリック
    const rejectButton = page.locator('button:has-text("却下")');
    await rejectButton.click();
    
    // 却下理由を入力するモーダル・ダイアログが表示されることを確認
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // 却下理由フィールドを特定
    const reasonField = page.locator('textarea[placeholder*="却下理由"], input[placeholder*="却下理由"]').first();
    await expect(reasonField).toBeVisible();
    
    // 却下操作前のステータスを取得
    const statusElement = page.locator('[data-testid="proposal-status"]').first();
    const statusBefore = await statusElement.textContent();
    
    // 却下理由フィールドを空白のままにして、確認・送信ボタンをクリック
    const confirmButton = modal.locator('button:has-text("確定"), button:has-text("送信")').first();
    await confirmButton.click();
    
    // 入力値検証エラーメッセージが表示されることを確認
    const errorMessage = page.locator('[role="alert"], .error-message');
    await expect(errorMessage).toBeVisible();
    
    // モーダル・ダイアログが閉じられていないことを確認
    await expect(modal).toBeVisible();
    
    // 却下理由フィールドがフォーカス状態または赤枠で強調表示されていることを確認
    const reasonFieldAfterValidation = page.locator('textarea[placeholder*="却下理由"], input[placeholder*="却下理由"]').first();
    const isFocused = await reasonFieldAfterValidation.evaluate(el => el === document.activeElement);
    const hasErrorClass = await reasonFieldAfterValidation.evaluate(el => 
      el.classList.contains('error') || 
      window.getComputedStyle(el).borderColor.includes('rgb(239, 68, 68)') ||
      window.getComputedStyle(el).borderColor.includes('rgb(220, 38, 38)') ||
      window.getComputedStyle(el).boxShadow.includes('rgb(239, 68, 68)') ||
      window.getComputedStyle(el).boxShadow.includes('rgb(220, 38, 38)')
    );
    
    expect(isFocused || hasErrorClass).toBeTruthy();
    
    // 配置案のステータスが変更されていないことを確認
    const statusAfter = await statusElement.textContent();
    expect(statusAfter).toBe(statusBefore);
  });
});