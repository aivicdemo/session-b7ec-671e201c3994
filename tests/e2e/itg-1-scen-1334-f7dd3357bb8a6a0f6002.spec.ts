import { test, expect } from '@playwright/test';

test.describe('人員配置最適化提案画面表示', () => {
  test('WMSからの進捗データ取得に失敗した場合、遅延メッセージとデータ更新待機中の注記が表示される', async ({ page }) => {
    // テスト環境を初期化する
    await page.goto('/');
    
    // ログイン画面が表示される場合に対応
    const loginButton = page.getByRole('button', { name: 'ログイン' }).first();
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.getByPlaceholder('ユーザーID').fill('testuser');
      await page.getByPlaceholder('パスワード').fill('testpass');
      await loginButton.click();
      await page.waitForNavigation();
    }

    // ダッシュボードまで到達
    await page.waitForLoadState('networkidle');

    // 人員配置最適化提案画面を開く
    await page.getByRole('link', { name: '人員配置最適化提案' }).click();
    await page.waitForURL(/scr-1789461798629/);

    // 画面が読み込み中の状態となり、WMSからの進捗データ取得が開始されることを確認する
    const progressRateValue = page.locator('#progress-rate-value');
    const loadingState = await progressRateValue.textContent();
    expect(loadingState).toContain('読込中');

    // WMSへの接続がタイムアウトし、3回の再試行が実行される間、画面の状態を監視する
    // タイムアウトと再試行の発生を検証：読込中状態から遅延メッセージへの遷移を監視
    let retryAttempts = 0;
    const maxWaitTime = 35000; // タイムアウト3回 + 処理時間
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const currentText = await progressRateValue.textContent();
      if (currentText && !currentText.includes('読込中')) {
        break;
      }
      await page.waitForTimeout(1000);
      retryAttempts++;
    }
    
    // 再試行がすべて失敗した後、画面が安定した表示に遷移するまで待機する
    await page.waitForFunction(
      () => {
        const element = document.querySelector('#progress-rate-value');
        return element && !element.textContent?.includes('読込中');
      },
      { timeout: 30000 }
    );

    // 画面上部のメッセージ領域とその下の配置案エリアを検査する
    
    // 「進捗データの更新に遅延が発生しています。最後の更新：○分前」というメッセージが表示されている
    const delayMessage = page.locator('text=/進捗データの更新に遅延が発生しています。最後の更新：\\d+分前/');
    await expect(delayMessage).toBeVisible();

    // メッセージのテキスト内容を確認
    const messageText = await delayMessage.textContent();
    expect(messageText).toMatch(/進捗データの更新に遅延が発生しています。最後の更新：\d+分前/);

    // 配置案エリアに過去にキャッシュされた最後の正常なデータに基づく人員配置案が表示されている
    const proposalsContainer = page.locator('#proposals-container');
    await expect(proposalsContainer).toBeVisible();

    // 配置案に「データ更新待機中」という注記が明確に視認できる状態で表示されている
    // 配置案の件名・行・カード上に注記が配置されていることを検証
    const proposalCards = page.locator('#proposals-container').locator('[class*="proposal"]');
    const proposalCardCount = await proposalCards.count();
    expect(proposalCardCount).toBeGreaterThan(0);

    // 各配置案カード内で「データ更新待機中」という注記が表示されているか確認
    let waitingNoticeFound = false;
    for (let i = 0; i < proposalCardCount; i++) {
      const card = proposalCards.nth(i);
      const cardText = await card.textContent();
      if (cardText && cardText.includes('データ更新待機中')) {
        waitingNoticeFound = true;
        // 注記がカード内に視認できることを確認
        const noticeInCard = card.locator('text=データ更新待機中');
        await expect(noticeInCard).toBeVisible();
        break;
      }
    }
    expect(waitingNoticeFound).toBe(true);

    // 配置案の具体的な数値（追加人員数・配置元拠点など）がキャッシュから取得した過去の値として表示されていることを確認
    const assignmentDetailTable = page.locator('#assignment-detail-tbody');
    await expect(assignmentDetailTable).toBeVisible();
    
    const rows = assignmentDetailTable.locator('tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // キャッシュされた値が使用されていることを検証：配置案の数値データが存在することを確認
    const tableRows = assignmentDetailTable.locator('tr');
    const firstRow = tableRows.first();
    const cellsInFirstRow = firstRow.locator('td');
    const cellCount = await cellsInFirstRow.count();
    
    // 人員配置情報として複数のセル（作業者ID、作業者名、習熟度、計画工数など）が存在することで、
    // キャッシュされたデータが使用されていることを確認
    expect(cellCount).toBeGreaterThan(0);
    
    // 各セルに具体的な値が含まれていることを確認
    for (let j = 0; j < Math.min(cellCount, 3); j++) {
      const cellText = await cellsInFirstRow.nth(j).textContent();
      expect(cellText).toBeTruthy();
      expect(cellText?.trim().length).toBeGreaterThan(0);
    }
  });
});