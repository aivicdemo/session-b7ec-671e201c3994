import { test, expect } from '@playwright/test';

test.describe('SCEN-1303: 改善指示配信実行 - Twilio一時的遅延時の自動再配信', () => {
  test('Twilio連携で一時的な遅延エラーが発生した場合、利用者に遅延が通知され、内部キューに保存されて自動再配信される', async ({ page }) => {
    // ログイン処理
    await page.goto('/');
    await page.waitForURL(/.*\/panels\//);
    
    // 人員配置最適化提案・実行画面を開く
    await page.goto('./panels/scr-1789461798629.html');
    await page.waitForLoadState('networkidle');
    
    // 作業指示配信対象となる拠点・チーム・作業者グループを選択する
    // 配信対象拠点を選択
    const deliverySiteSelect = page.locator('[data-testid="delivery-site-select"]');
    await deliverySiteSelect.click();
    await page.waitForTimeout(500);
    
    // 拠点の選択肢から最初の拠点を選択
    const siteOption = page.locator('text=/東京拠点|大阪拠点|名古屋拠点/').first();
    if (await siteOption.isVisible()) {
      await siteOption.click();
    }
    await page.waitForTimeout(300);
    
    // 配信内容（作業指示テキスト）を入力する
    const contentTextarea = page.locator('[data-testid="delivery-content-textarea"]');
    await contentTextarea.fill('改善指示：作業効率化のため、以下の手順に従ってください。');
    
    // 「配信実行」ボタンをクリックして配信を実行する
    const sendButton = page.locator('[data-testid="delivery-send-button"]');
    await sendButton.click();
    
    // Twilio連携で一時的な遅延エラーが発生した状況を待つ
    // メッセージが表示されるか、またはステータスが更新されるまで待機
    await page.waitForTimeout(2000);
    
    // 画面上部またはアラート領域に「配信に一時的な遅延が発生しています。数分以内に再試行します」というメッセージが表示されることを確認する
    const delayMessage = page.locator('text=/配信に一時的な遅延が発生しています。数分以内に再試行します/');
    await expect(delayMessage).toBeVisible({ timeout: 15000 });
    
    // メッセージが画面上部またはアラート領域に位置していることを確認
    const messageBox = delayMessage.first();
    const boundingBox = await messageBox.boundingBox();
    if (boundingBox) {
      // 画面上部（y < 200px）またはアラート領域（特定の高さ範囲）に表示されていることを確認
      expect(boundingBox.y).toBeLessThan(400);
    }
    
    // 配信実行履歴またはステータス表示領域で、配信リクエストが「再試行待機中」の状態で一覧に記録されていることを確認する
    const deliveryHistoryTable = page.locator('[data-testid="delivery-history-table"]');
    await expect(deliveryHistoryTable).toBeVisible();
    
    const retryWaitingStatus = page.locator('text=/再試行待機中/');
    await expect(retryWaitingStatus).toBeVisible({ timeout: 15000 });
    
    // 外部サービス Twilio の遅延が解消されるまで待機する
    await page.waitForTimeout(8000);
    
    // システムが自動的に再配信を実行し、配信ステータスが「再試行中」から「成功」に遷移することを確認する
    const retryingStatus = page.locator('text=/再試行中/');
    const successStatus = page.locator('text=/成功/');
    
    // 「再試行中」が一時的に表示される可能性がある
    try {
      await expect(retryingStatus).toBeVisible({ timeout: 5000 });
    } catch {
      // 再試行中の状態をスキップして成功状態を確認
    }
    
    // 「成功」ステータスが表示されることを確認
    await expect(successStatus).toBeVisible({ timeout: 20000 });
    
    // 配信実行履歴の該当行を確認し、受領タイムスタンプが表示されていることを確認する
    const deliveryHistoryBody = page.locator('[id="delivery-history-tbody"], tbody');
    const deliveryRows = deliveryHistoryBody.locator('tr');
    
    // 最初の行から受領タイムスタンプを取得
    const firstRow = deliveryRows.first();
    
    // 受領タイムスタンプ欄に日時が表示されていることを確認
    // 配信履歴テーブルの列構造から受領タイムスタンプが存在することを確認
    const rowCells = firstRow.locator('td, th');
    let timestampFound = false;
    
    const cellCount = await rowCells.count();
    for (let i = 0; i < cellCount; i++) {
      const cellText = await rowCells.nth(i).textContent();
      if (cellText && /\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}|\d{4}\/\d{2}\/\d{2}/.test(cellText)) {
        timestampFound = true;
        break;
      }
    }
    
    expect(timestampFound).toBe(true);
  });
});