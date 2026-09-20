import { test, expect } from '@playwright/test';

test.describe('人員配置案配信', () => {
  test('配置案配信イベントがハンディターミナル連携ログに記録され、配信状況が追跡可能な状態になる', async ({ page }) => {
    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // 進捗遅延リスクが検出され、人員配置案が自動生成された状態を確認する
    const riskCount = page.getByTestId('kpi-risk-count');
    await expect(riskCount).toBeVisible();
    const riskCountText = await riskCount.textContent();
    expect(parseInt(riskCountText || '0')).toBeGreaterThan(0);

    // 人員配置最適化提案・実行画面に遷移し、生成された配置案が表示されていることを確認する
    await page.getByRole('link', { name: /人員配置最適化提案/ }).click();
    await page.waitForLoadState('networkidle');

    // 生成された配置案が表示されていることを確認
    const proposalContainer = page.locator('#proposals-container');
    await expect(proposalContainer).toBeVisible();

    // 配置案に対して「配信実行」ボタンをクリック
    const distributeButton = page.getByTestId('distribute-button');
    await expect(distributeButton).toBeEnabled();
    await distributeButton.click();

    // 配信確認モーダルが表示
    const distributeModal = page.locator('#distribute-modal-overlay');
    await expect(distributeModal).toBeVisible();

    // 配信を確認
    const distributeConfirmButton = page.getByTestId('distribute-modal-confirm');
    await distributeConfirmButton.click();

    // 配信実行後、作業指示・実績管理画面を開く
    await page.getByRole('link', { name: /作業指示・実績管理/ }).click();
    await page.waitForLoadState('networkidle');

    // ハンディターミナル連携ログセクションを確認する
    const handyTerminalTab = page.getByTestId('tab-handy-terminal');
    await expect(handyTerminalTab).toBeVisible();
    await handyTerminalTab.click();

    // ハンディターミナル連携ログが表示される
    const handyTerminalLogList = page.getByTestId('handy-terminal-log-list');
    await expect(handyTerminalLogList).toBeVisible();

    // 配置案配信イベントのログエントリが記録されていることを確認
    const logTbody = page.locator('#handy-terminal-log-tbody');
    const logRows = logTbody.locator('tr');
    
    // 最新のログエントリを取得（最初の行）
    const firstLogRow = logRows.first();
    await expect(firstLogRow).toBeVisible();

    // ログレコードのセル情報を確認
    const logCells = firstLogRow.locator('td');
    const logCount = await logCells.count();
    expect(logCount).toBeGreaterThanOrEqual(6);

    // 各セルのテキストを確認
    const cellTexts: string[] = [];
    for (let i = 0; i < logCount; i++) {
      const text = await logCells.nth(i).textContent();
      if (text) {
        cellTexts.push(text.trim());
      }
    }
    
    // 配信IDが存在することを確認（最初のセル）
    const distributionId = cellTexts[0];
    expect(distributionId).toBeTruthy();
    expect(distributionId).not.toBe('');
    
    // 配信タイムスタンプが存在することを確認（2番目のセル、時分秒を含む）
    const timestampCell = cellTexts[1];
    expect(timestampCell).toMatch(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}|\d{2}:\d{2}:\d{2}/);
    
    // 対象拠点が存在することを確認（3番目のセル）
    const siteCell = cellTexts[2];
    expect(siteCell).toBeTruthy();
    expect(siteCell.length).toBeGreaterThan(0);
    
    // 対象チームが存在することを確認（4番目のセル）
    const teamCell = cellTexts[3];
    expect(teamCell).toBeTruthy();
    expect(teamCell.length).toBeGreaterThan(0);
    
    // 配信ステータスが「配信完了」であることを確認（5番目のセル）
    const deliveryStatusCell = cellTexts[4];
    expect(deliveryStatusCell).toContain('配信完了');
    
    // 受領確認待機中が表示されていることを確認（6番目のセル）
    const receiptWaitingCell = cellTexts[5];
    expect(receiptWaitingCell).toContain('待機中');

    // ログエントリに対して「配信状況追跡」リンク/ボタンをクリック
    const trackingLink = firstLogRow.locator('a, button').filter({ hasText: /配信状況追跡/ }).first();
    await expect(trackingLink).toBeVisible();
    await trackingLink.click();

    // 配信状況の詳細画面が遷移または別パネルで表示されたことを確認
    await page.waitForLoadState('networkidle');

    // 詳細画面の表示を確認：モーダルまたは新しいページのいずれかが表示される
    const detailModal = page.locator('[role="dialog"]').first();
    const isModalVisible = await detailModal.isVisible().catch(() => false);
    
    let detailContent;
    if (isModalVisible) {
      detailContent = detailModal;
    } else {
      // ページ遷移した場合、現在のページコンテンツを確認
      detailContent = page.locator('.content-area').first();
    }

    await expect(detailContent).toBeVisible();

    // 詳細画面内に配信IDが表示されていることを確認
    const detailAllText = await detailContent.textContent();
    expect(detailAllText).toContain(distributionId);

    // 配信IDに紐付く受領ステータスが詳細画面内に表示されていることを確認
    // テーブルまたはリスト形式で配信IDに紐付く情報を取得
    const detailRows = detailContent.locator('tr');
    const detailRowCount = await detailRows.count();
    
    let hasReceiptStatus = false;
    let hasReceiptTimestamp = false;
    let hasReceiverInfo = false;

    // 配信IDを含む行を探して関連情報を確認
    for (let i = 0; i < detailRowCount; i++) {
      const row = detailRows.nth(i);
      const rowText = await row.textContent();
      
      if (rowText && rowText.includes(distributionId)) {
        // 配信IDに紐付く行から受領ステータスを確認
        if (rowText.match(/確認済み|未確認|配信済み|配信中|配信失敗|受領済み/)) {
          hasReceiptStatus = true;
        }
        
        // 受領タイムスタンプを確認（配信IDに紐付く行内）
        if (rowText.match(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/)) {
          hasReceiptTimestamp = true;
        }
        
        // 受領者ID情報を確認（配信IDに紐付く行内で数値パターンを確認）
        const cellsInRow = row.locator('td');
        const cellCount = await cellsInRow.count();
        for (let j = 0; j < cellCount; j++) {
          const cellText = await cellsInRow.nth(j).textContent();
          if (cellText && cellText.match(/\d{3,}/)) {
            hasReceiverInfo = true;
            break;
          }
        }
      }
    }
    
    expect(hasReceiptStatus).toBe(true);
    expect(hasReceiptTimestamp).toBe(true);
    expect(hasReceiverInfo).toBe(true);
  });
});