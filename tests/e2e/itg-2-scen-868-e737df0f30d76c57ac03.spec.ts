import { test, expect } from '@playwright/test';

test('SCEN-868: 許容遅延値が0以下で設定された場合、エラーメッセージが表示される', async ({ page }) => {
  // 作業実績データ記録・入力画面にアクセス
  await page.goto('/panels/scr-1789461993203.html');
  
  // 許容遅延値の入力フィールドを特定
  const toleranceDelayInput = page.locator('input[name*="tolerance"], input[placeholder*="許容遅延"], input[aria-label*="許容遅延"]').first();
  
  // 許容遅延値の入力フィールドに「-5」と入力
  await toleranceDelayInput.fill('-5');
  
  // 入力フィールドからフォーカスを外す
  await toleranceDelayInput.blur();
  
  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=許容遅延値は正の数である必要があります');
  await expect(errorMessage).toBeVisible();
  
  // 入力フィールドがエラー状態で視覚的にハイライトされることを確認
  await expect(toleranceDelayInput).toHaveClass(/error|invalid|danger/);
});