import { test, expect } from '@playwright/test';

test.describe('SCEN-867: ハンディターミナルからの送信ペイロードが空またはnullの場合のエラー処理', () => {
  test('空またはnullのペイロード送信時にエラーメッセージが表示される', async ({ page }) => {
    // 作業実績データ記録・入力画面を開く
    await page.goto('/panels/scr-1789461993203.html');
    
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // ハンディターミナルからのデータ送信を実行し、空またはnullのペイロードが送信される状況を作る
    // ペイロードが空のデータ送信をシミュレート
    await page.evaluate(() => {
      // 画面上のデータ送信機能をトリガー（空ペイロード）
      const event = new CustomEvent('handy-terminal-data', {
        detail: { payload: null }
      });
      window.dispatchEvent(event);
    });

    // 「データ送信」または「実績送信」ボタンをクリックして、空のペイロードを送信する
    const submitButton = page.locator('button:has-text("データ送信"), button:has-text("実績送信")').first();
    await submitButton.click();

    // 画面上にエラーメッセージ「作業実績データが空です。ハンディターミナルの記録を確認してください」が表示されることを確認
    const errorMessage = page.locator('text=作業実績データが空です。ハンディターミナルの記録を確認してください');
    await expect(errorMessage).toBeVisible();

    // 送信が中断され、データは保存されていないことを確認
    // エラーメッセージが表示されている状態で、正常な保存成功メッセージが表示されていないことを確認
    const successMessage = page.locator('text=送信完了').or(page.locator('text=保存しました'));
    await expect(successMessage).not.toBeVisible();
  });

  test('空文字列のペイロード送信時にエラーメッセージが表示される', async ({ page }) => {
    // 作業実績データ記録・入力画面を開く
    await page.goto('/panels/scr-1789461993203.html');
    
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // ハンディターミナルからのデータ送信を実行し、空のペイロードが送信される状況を作る
    await page.evaluate(() => {
      const event = new CustomEvent('handy-terminal-data', {
        detail: { payload: '' }
      });
      window.dispatchEvent(event);
    });

    // 「データ送信」または「実績送信」ボタンをクリック
    const submitButton = page.locator('button:has-text("データ送信"), button:has-text("実績送信")').first();
    await submitButton.click();

    // エラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=作業実績データが空です。ハンディターミナルの記録を確認してください');
    await expect(errorMessage).toBeVisible();

    // 送信が中断されていることを確認
    const successMessage = page.locator('text=送信完了').or(page.locator('text=保存しました'));
    await expect(successMessage).not.toBeVisible();
  });
});