import { test, expect } from '@playwright/test';

test('SCEN-1532: 作業指示受領履歴表示 - マスタデータに存在しない作業者IDの処理', async ({
  page,
}) => {
  // ログイン画面に移動
  await page.goto('/');
  
  // ログインフォームが表示されるまで待機
  await page.waitForSelector('.login-form', { timeout: 10000 });
  
  // ログイン情報を入力して送信
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpass');
  await page.click('button[type="submit"]');
  
  // ダッシュボードへの自動遷移を待機
  await page.waitForURL('**/scr-1789461783315.html', { timeout: 10000 });
  
  // 作業指示・実績管理画面へ遷移
  await test.step('作業指示・実績管理画面を開く', async () => {
    await page.click('text=作業指示・実績管理');
    await page.waitForURL('**/scr-1789461813941.html', { timeout: 10000 });
  });

  // WMSから取得した受領履歴データが読み込まれるまで待機
  await test.step('受領履歴データが読み込まれるまで待機', async () => {
    // 受領履歴タブを確認
    const receiptHistoryTab = page.locator('[data-testid="tab-receipt-history"]');
    await receiptHistoryTab.waitFor({ state: 'visible', timeout: 10000 });
    
    // 受領履歴タブをクリック
    await receiptHistoryTab.click();
    
    // 受領履歴一覧が表示されるまで待機
    await page.waitForSelector('#receipt-history-tbody', { timeout: 10000 });
  });

  // レンダリング完了後、受領履歴レコードを検証
  await test.step('受領履歴レコードの表示を検証', async () => {
    const receiptHistoryTableBody = page.locator('#receipt-history-tbody');
    
    // テーブルボディが表示されているか確認
    await expect(receiptHistoryTableBody).toBeVisible();
    
    // テーブル内のすべての行を取得
    const rows = page.locator('#receipt-history-tbody tr');
    const rowCount = await rows.count();
    
    // 2つの判定パターンを確認
    const pattern1 = rowCount === 2; // パターン(1): W-99999が除外され2件のみ表示
    
    // パターン(2)の場合、W-99999を含むレコードに警告表示があるかを確認
    let pattern2 = false;
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const rowText = await row.textContent();
      
      if (rowText && rowText.includes('W-99999')) {
        // 警告アイコンまたは警告テキストが表示されているか確認
        const warningIcon = row.locator('[class*="warning"], [data-testid*="warning"]');
        const warningText = row.locator('text=作業者情報が見つかりません');
        
        const hasWarningIcon = await warningIcon.count() > 0;
        const hasWarningText = await warningText.count() > 0;
        
        if (hasWarningIcon || hasWarningText) {
          pattern2 = true;
        }
      }
    }
    
    // パターン(1)またはパターン(2)のいずれかが成立することを確認
    expect(pattern1 || pattern2).toBeTruthy();
    
    // マスタデータに存在する作業者ID（W-00001, W-00002）は警告なしで表示されていることを確認
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const rowText = await row.textContent();
      
      if (rowText && (rowText.includes('W-00001') || rowText.includes('W-00002'))) {
        // これらの作業者IDを含む行には警告表示がないことを確認
        const warningIcon = row.locator('[class*="warning"], [data-testid*="warning"]');
        const warningText = row.locator('text=作業者情報が見つかりません');
        
        await expect(warningIcon).toHaveCount(0);
        await expect(warningText).toHaveCount(0);
      }
    }
  });
});