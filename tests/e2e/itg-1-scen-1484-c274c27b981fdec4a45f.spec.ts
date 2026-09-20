import { test, expect } from '@playwright/test';

test.describe('作業指示検索フィルター実行', () => {
  test('権限のないユーザーが実行を試みると、操作が拒否される', async ({ page, context }) => {
    // ログイン画面へ遷移
    await page.goto('/');
    
    // 一般作業者ロールでログイン
    await page.fill('input[type="text"]', 'worker-user');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("ログイン")');
    
    // ログイン後、ダッシュボード画面に遷移するのを待つ
    await page.waitForURL(/.*\/panels\/scr-1789461783315\.html/);
    
    // 作業指示・実績管理画面へ遷移
    await page.click('a[href*="scr-1789461813941"]');
    await page.waitForURL(/.*\/panels\/scr-1789461813941\.html/);
    
    // フィルター条件入力欄が表示されていることを確認
    const workInstructionIdFilter = page.getByTestId('filter-work-instruction-id');
    const workerIdFilter = page.getByTestId('filter-worker-id');
    const receiptStatusFilter = page.getByTestId('filter-receipt-status');
    const searchButton = page.getByTestId('filter-search-button');
    
    await expect(workInstructionIdFilter).toBeVisible();
    await expect(workerIdFilter).toBeVisible();
    await expect(receiptStatusFilter).toBeVisible();
    await expect(searchButton).toBeVisible();
    
    // フィルター条件を入力
    await workInstructionIdFilter.fill('WI001');
    await workerIdFilter.fill('W001');
    await receiptStatusFilter.selectOption('確認済み');
    
    // ネットワークレスポンスを監視
    let httpStatus = null;
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        httpStatus = response.status();
      }
    });
    
    // 検索実行ボタンをクリック
    await searchButton.click();
    
    // エラーメッセージが表示されるのを待つ
    const errorBanner = page.locator('#error-banner');
    await expect(errorBanner).toBeVisible();
    
    const errorText = await page.locator('#error-message').textContent();
    expect(errorText).toBeTruthy();
    expect(errorText).toMatch(/この操作を実行する権限がありません|管理者に権限昇格を依頼してください|権限がありません|アクセス権限がありません/);
    
    // HTTPステータスが403であることを確認
    await page.waitForTimeout(1000);
    expect(httpStatus).toBe(403);
    
    // 検索結果テーブルが表示されていないことを確認
    const workInstructionTable = page.locator('#work-instruction-tbody');
    await expect(workInstructionTable).not.toBeVisible();
    
    // 画面遷移していないことを確認（操作前の状態のままである）
    await expect(page).toHaveURL(/.*\/panels\/scr-1789461813941\.html/);
  });
});