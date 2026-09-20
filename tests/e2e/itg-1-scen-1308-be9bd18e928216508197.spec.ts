import { test, expect } from '@playwright/test';

test.describe('SCEN-1308: 改善指示配信実行 - 人員融通提案時の遅延リスク確認', () => {
  test('他拠点からの人員融通を提案する場合、融通元拠点の進捗が遅延リスク中以上であるとき、その影響の確認が促される', async ({ page }) => {
    // Step 1: 人員配置最適化提案・実行画面を開く
    await page.goto('/panels/scr-1789461798629.html');
    
    // Step 2: 融通元拠点Aの進捗データ（進捗率70%、遅延リスク「中」）と融通先拠点Bの遅延リスク「高」の状況が画面に表示されるまで待つ
    await page.waitForSelector('[data-testid="progress-rate"]', { timeout: 10000 });
    
    const proposalContainer = page.locator('#proposals-container');
    await expect(proposalContainer).toBeVisible();
    
    const containerText = await proposalContainer.textContent();
    
    // 融通元拠点Aの進捗率70%、遅延リスク「中」が表示されていることを確認
    expect(containerText).toMatch(/進捗率.*70/);
    expect(containerText).toContain('中');
    
    // 融通先拠点Bの遅延リスク「高」が表示されていることを確認
    expect(containerText).toContain('高');
    
    // Step 3: 人員配置最適化提案エリアに『拠点Bへ3名追加配置、配置元：拠点A』という人員融通提案が表示されていることを確認する
    expect(containerText).toContain('拠点B');
    expect(containerText).toMatch(/3\s*名/);
    expect(containerText).toContain('拠点A');
    expect(containerText).toMatch(/追加配置|配置元/);

    // Step 4: その融通提案に対して「配置案を実行」ボタンをクリックする
    const distributeBtn = page.locator('[data-testid="distribute-button"]').first();
    await expect(distributeBtn).toBeVisible();
    await distributeBtn.click();

    // Step 5: 画面上に『融通元拠点（拠点A）の進捗が遅延リスク中です。融通による拠点Aへの影響を確認してください』というダイアログまたはメッセージが表示されるのを確認する
    const confirmDialog = page.locator('#distribute-modal-overlay');
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    
    const dialogContent = page.locator('#distribute-modal-content');
    await expect(dialogContent).toBeVisible();
    
    const dialogText = await dialogContent.textContent();
    
    // 仕様で指定された具体的なメッセージ文言を確認
    expect(dialogText).toMatch(/融通元拠点.*拠点A.*進捗.*遅延リスク.*中/);
    expect(dialogText).toMatch(/融通.*拠点A.*影響.*確認/);

    // Step 6: ダイアログ・メッセージ内に『融通元拠点A：遅延リスク 中（60%）、現在の進捗率 70%』という具体的な数値が表示されていることを確認する
    // 仕様で指定された具体的な数値形式を確認
    expect(dialogText).toContain('融通元拠点A');
    expect(dialogText).toContain('遅延リスク');
    expect(dialogText).toContain('中');
    expect(dialogText).toContain('60%');
    expect(dialogText).toContain('現在の進捗率');
    expect(dialogText).toContain('70%');

    // Step 7: ダイアログ・メッセージに『影響を承知して実行』『キャンセル』のようなアクション用ボタンが配置されていることを確認する
    const confirmBtn = page.locator('[data-testid="distribute-modal-confirm"]');
    const cancelBtn = page.locator('[data-testid="distribute-modal-cancel"]');
    
    await expect(confirmBtn).toBeVisible();
    await expect(cancelBtn).toBeVisible();
    
    const confirmBtnText = (await confirmBtn.textContent())?.trim() || '';
    const cancelBtnText = (await cancelBtn.textContent())?.trim() || '';
    
    // ボタンテキストが空でないことを確認
    expect(confirmBtnText.length).toBeGreaterThan(0);
    expect(cancelBtnText.length).toBeGreaterThan(0);
    
    // 仕様で指定されたボタンテキストを確認
    expect(confirmBtnText).toMatch(/影響を承知して実行/);
    expect(cancelBtnText).toMatch(/キャンセル/);
  });
});