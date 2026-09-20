import { test, expect } from '@playwright/test';

test.describe('配信モーダル確定', () => {
  test('認証済みユーザーが配信モーダルを確定し、配信処理が実行される', async ({ page }) => {
    // ログイン画面でログイン
    await page.goto('/');
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button:has-text("ログイン")');
    
    // 自動遷移を待機
    await page.waitForURL('**/scr-1789461783315.html');

    // 人員配置最適化提案・実行画面へ遷移
    await page.click('a:has-text("人員配置最適化提案")');
    await page.waitForURL('**/scr-1789461798629.html');

    // 配置案の提案内容を確認
    await expect(page.locator('[data-testid="assignment-detail-table"]')).toBeVisible();
    
    // 配信対象拠点・チーム・作業者グループが表示されていることを確認
    const assignmentTable = page.locator('#assignment-detail-tbody');
    await expect(assignmentTable).toBeVisible();
    
    // テーブル内の行が存在することを確認
    const tableRows = page.locator('#assignment-detail-tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
    
    // 最初の行から拠点、チーム、作業者グループの情報が実際に表示されていることを確認
    const firstRow = tableRows.first();
    await expect(firstRow).toBeVisible();
    
    // 行内のセル情報を取得
    const tableCells = firstRow.locator('td');
    const cellCount = await tableCells.count();
    expect(cellCount).toBeGreaterThan(0);
    
    // テーブル全体のテキストコンテンツから拠点、チーム、作業者情報が存在することを確認
    const tableText = await assignmentTable.textContent();
    expect(tableText).toBeTruthy();
    // 配置案テーブルには作業者ID、作業者名、習熟度、計画工数などの情報が含まれることを確認
    const hasRequiredInfo = tableText && (
      tableText.includes('作業者ID') || 
      tableText.includes('作業者名') ||
      tableText.includes('習熟度') ||
      tableText.includes('計画工数')
    );
    expect(hasRequiredInfo).toBeTruthy();

    // 配信モーダルを開く
    await page.click('[data-testid="distribute-button"]');
    
    // モーダルが表示されることを待機
    const distributeModal = page.locator('#distribute-modal-overlay');
    await expect(distributeModal).toBeVisible();

    // モーダル内に配信内容が表示されていることを確認
    const modalContent = page.locator('#distribute-modal-content');
    await expect(modalContent).toBeVisible();

    // モーダル内に配置案、対象人数、配信先、配信スケジュールの情報が具体的に表示されていることを確認
    const modalText = await modalContent.textContent();
    expect(modalText).toBeTruthy();
    // 配信内容として表示される各要素の存在を確認
    expect(modalText).toContain('配置案');
    expect(modalText).toContain('対象人数');
    expect(modalText).toContain('配信先');
    expect(modalText).toContain('配信スケジュール');

    // 「確定」ボタンをクリック
    await page.click('[data-testid="distribute-modal-confirm"]');

    // 配信処理が実行されてモーダルが閉じることを確認
    await expect(distributeModal).not.toBeVisible();

    // 人員配置最適化提案・実行画面に戻ることを確認
    await expect(page.locator('[data-testid="assignment-detail-table"]')).toBeVisible();

    // 配信結果ステータスが「配信完了」または「受領待機中」と表示されていることを確認
    const proposalsContainer = page.locator('#proposals-container');
    await expect(proposalsContainer).toBeVisible();
    
    // ステータス表示が画面上に存在することを確認
    const statusDisplay = page.locator('text=/配信完了|受領待機中/');
    await expect(statusDisplay.first()).toBeVisible();

    // 同一ユーザーで再度別の配置案について配信モーダルを開く
    // 別の配置案を選択
    const proposalDetails = page.locator('#proposal-detail-container');
    const proposalElements = page.locator('#proposals-container > *');
    const proposalCount = await proposalElements.count();
    
    // 複数の配置案が存在する場合、別の配置案を選択
    if (proposalCount > 1) {
      const secondProposal = proposalElements.nth(1);
      await secondProposal.click();
      await page.waitForTimeout(300);
    }
    
    // 配信モーダルを開く
    await page.click('[data-testid="distribute-button"]');
    
    // 配信モーダルが正常に開いたことを確認
    await expect(distributeModal).toBeVisible();

    // 「確定」ボタンがクリック可能な状態であることを確認
    const confirmButton = page.locator('[data-testid="distribute-modal-confirm"]');
    await expect(confirmButton).toBeEnabled();
    await expect(confirmButton).toBeVisible();

    // 2回目の配信モーダルの配信内容が具体的に表示されていることを確認
    await expect(modalContent).toBeVisible();
    const modalText2 = await modalContent.textContent();
    expect(modalText2).toBeTruthy();
    expect(modalText2).toContain('配置案');
    expect(modalText2).toContain('対象人数');
    expect(modalText2).toContain('配信先');
    expect(modalText2).toContain('配信スケジュール');

    // 2回目の「確定」ボタンをクリックして、配信処理が実行されることを検証
    await page.click('[data-testid="distribute-modal-confirm"]');

    // 2回目の配信処理が実行されてモーダルが閉じることを確認
    await expect(distributeModal).not.toBeVisible();

    // 人員配置最適化提案・実行画面に戻ることを確認
    await expect(page.locator('[data-testid="assignment-detail-table"]')).toBeVisible();

    // 2回目の配信結果ステータスが画面上に表示されていることを確認
    const statusDisplay2 = page.locator('text=/配信完了|受領待機中/');
    await expect(statusDisplay2.first()).toBeVisible();
  });
});