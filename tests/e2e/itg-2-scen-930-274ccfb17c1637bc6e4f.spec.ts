import { test, expect } from '@playwright/test';

test.describe('SCEN-930: 配置案確認完了のデータ検証', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン画面に遷移
    await page.goto('/');
    
    // ログイン処理（テスト用認証情報を使用）
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    
    // リダイレクト完了を待つ
    await page.waitForNavigation();
    
    // 最適人員配置案提案・実行画面を開く
    await page.goto('/panels/scr-1789461978707.html');
    await page.waitForLoadState('networkidle');
  });

  test('テストケース1: 配置案IDが空文字列の場合、エラーダイアログが表示される', async ({ page }) => {
    // 配置案確認完了ボタンをクリック
    await page.click('button:has-text("配置案確認完了")');
    
    // ダイアログが表示されるまで待機
    await page.waitForSelector('dialog, [role="dialog"]');
    
    // 配置案IDフィールドに空文字列を入力（デフォルト状態）
    await page.fill('input[name="placementId"]', '');
    
    // 確認内容に「承認」を入力
    await page.fill('textarea[name="confirmationContent"]', '承認');
    
    // 送信ボタンをクリック
    await page.click('button:has-text("送信")');
    
    // エラーダイアログが表示されることを確認
    await page.waitForSelector('dialog, [role="dialog"]');
    const errorMessage = await page.locator('text=配置案ID・確認内容・タイムスタンプの形式または妥当性が正しくありません').isVisible();
    expect(errorMessage).toBe(true);
    
    // エラーダイアログの閉じるボタンをクリック
    await page.click('button:has-text("閉じる")');
    
    // 確認内容入力ダイアログに戻ることを確認
    await page.waitForSelector('input[name="placementId"]');
  });

  test('テストケース2: 存在しない形式の配置案IDの場合、エラーダイアログが表示される', async ({ page }) => {
    // 配置案確認完了ボタンをクリック
    await page.click('button:has-text("配置案確認完了")');
    
    // ダイアログが表示されるまで待機
    await page.waitForSelector('dialog, [role="dialog"]');
    
    // 配置案IDフィールドに無効な値を入力
    await page.fill('input[name="placementId"]', 'INVALID-ID-999');
    
    // 確認内容に「承認」を入力
    await page.fill('textarea[name="confirmationContent"]', '承認');
    
    // 送信ボタンをクリック
    await page.click('button:has-text("送信")');
    
    // エラーダイアログが表示されることを確認
    await page.waitForSelector('dialog, [role="dialog"]');
    const errorMessage = await page.locator('text=配置案ID・確認内容・タイムスタンプの形式または妥当性が正しくありません').isVisible();
    expect(errorMessage).toBe(true);
    
    // エラーダイアログの閉じるボタンをクリック
    await page.click('button:has-text("閉じる")');
    
    // 確認内容入力ダイアログに戻ることを確認
    await page.waitForSelector('input[name="placementId"]');
  });

  test('テストケース3: 確認内容が空文字列の場合、エラーダイアログが表示される', async ({ page }) => {
    // 配置案確認完了ボタンをクリック
    await page.click('button:has-text("配置案確認完了")');
    
    // ダイアログが表示されるまで待機
    await page.waitForSelector('dialog, [role="dialog"]');
    
    // 配置案IDフィールドに有効な値を入力
    await page.fill('input[name="placementId"]', 'PLAN-001');
    
    // 確認内容フィールドに空文字列を入力（デフォルト状態）
    await page.fill('textarea[name="confirmationContent"]', '');
    
    // 送信ボタンをクリック
    await page.click('button:has-text("送信")');
    
    // エラーダイアログが表示されることを確認
    await page.waitForSelector('dialog, [role="dialog"]');
    const errorMessage = await page.locator('text=配置案ID・確認内容・タイムスタンプの形式または妥当性が正しくありません').isVisible();
    expect(errorMessage).toBe(true);
    
    // エラーダイアログの閉じるボタンをクリック
    await page.click('button:has-text("閉じる")');
    
    // 確認内容入力ダイアログに戻ることを確認
    await page.waitForSelector('input[name="placementId"]');
  });

  test('テストケース4: 許可範囲外の確認内容の場合、エラーダイアログが表示される', async ({ page }) => {
    // 配置案確認完了ボタンをクリック
    await page.click('button:has-text("配置案確認完了")');
    
    // ダイアログが表示されるまで待機
    await page.waitForSelector('dialog, [role="dialog"]');
    
    // 配置案IDフィールドに有効な値を入力
    await page.fill('input[name="placementId"]', 'PLAN-001');
    
    // 確認内容に許可されていない値を入力
    await page.fill('textarea[name="confirmationContent"]', '不明');
    
    // 送信ボタンをクリック
    await page.click('button:has-text("送信")');
    
    // エラーダイアログが表示されることを確認
    await page.waitForSelector('dialog, [role="dialog"]');
    const errorMessage = await page.locator('text=配置案ID・確認内容・タイムスタンプの形式または妥当性が正しくありません').isVisible();
    expect(errorMessage).toBe(true);
    
    // エラーダイアログの閉じるボタンをクリック
    await page.click('button:has-text("閉じる")');
    
    // 確認内容入力ダイアログに戻ることを確認
    await page.waitForSelector('input[name="placementId"]');
  });

  test('テストケース5: タイムスタンプが改ざんされた場合、エラーダイアログが表示される', async ({ page }) => {
    // 配置案確認完了ボタンをクリック
    await page.click('button:has-text("配置案確認完了")');
    
    // ダイアログが表示されるまで待機
    await page.waitForSelector('dialog, [role="dialog"]');
    
    // 配置案IDフィールドに有効な値を入力
    await page.fill('input[name="placementId"]', 'PLAN-001');
    
    // 確認内容に「承認」を入力
    await page.fill('textarea[name="confirmationContent"]', '承認');
    
    // 開発者ツールでタイムスタンプを改ざん
    await page.evaluate(() => {
      const timestampInput = document.querySelector('input[name="timestamp"]') as HTMLInputElement;
      if (timestampInput) {
        timestampInput.value = '1970-01-01T00:00:00Z';
      }
    });
    
    // 送信ボタンをクリック
    await page.click('button:has-text("送信")');
    
    // エラーダイアログが表示されることを確認
    await page.waitForSelector('dialog, [role="dialog"]');
    const errorMessage = await page.locator('text=配置案ID・確認内容・タイムスタンプの形式または妥当性が正しくありません').isVisible();
    expect(errorMessage).toBe(true);
    
    // エラーダイアログの閉じるボタンをクリック
    await page.click('button:has-text("閉じる")');
    
    // 確認内容入力ダイアログに戻ることを確認
    await page.waitForSelector('input[name="placementId"]');
  });
});