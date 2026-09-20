import { test, expect } from '@playwright/test';

test.describe('SCEN-1425: 却下モーダル確定', () => {
  test('却下対象の人員配置案が無効な状態にある場合、状態異常を通知する画面が表示される', async ({ page }) => {
    // 人員配置最適化提案・実行画面を開く
    await page.goto('/panels/scr-1789461798629.html');
    await page.waitForLoadState('networkidle');

    // 無効な状態の人員配置案を却下対象として選択する
    const proposalsContainer = page.locator('#proposals-container');
    await expect(proposalsContainer).toBeVisible();

    // 提案一覧内のすべての提案要素を取得
    const proposals = page.locator('#proposals-container [class*="proposal"]');
    const proposalCount = await proposals.count();

    let selectedProposal = null;
    
    // 無効な状態（配置案ステータス='INVALID'または必須フィールド欠落）の提案を探して選択
    for (let i = 0; i < proposalCount; i++) {
      const proposal = proposals.nth(i);
      
      // 配置案ステータスを確認（INVALID状態を検出）
      const riskLevelElement = proposal.locator('#risk-level');
      const delayDaysElement = proposal.locator('#delay-days');
      const recommendedActionElement = proposal.locator('#recommended-action');
      
      // 必須フィールドの欠落または無効な状態を確認
      const hasRiskLevel = await riskLevelElement.count() > 0;
      const hasDelayDays = await delayDaysElement.count() > 0;
      const hasRecommendedAction = await recommendedActionElement.count() > 0;
      
      // 無効な状態：必須フィールドが欠落している、または値が空の場合
      if (!hasRiskLevel || !hasDelayDays || !hasRecommendedAction) {
        await proposal.click();
        selectedProposal = proposal;
        break;
      }
      
      // またはINVALIDステータスの検出
      const logicStatusElement = proposal.locator('#logic-status');
      const statusExists = await logicStatusElement.count() > 0;
      if (statusExists) {
        const statusText = await logicStatusElement.textContent();
        if (statusText && statusText.includes('INVALID')) {
          await proposal.click();
          selectedProposal = proposal;
          break;
        }
      }
    }

    // 選択された提案が表示されていることを確認
    const proposalDetailContainer = page.locator('#proposal-detail-container');
    await expect(proposalDetailContainer).toBeVisible();

    // 却下ボタンをクリック
    const rejectBtn = page.locator('#reject-btn');
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();

    // 却下モーダルが表示されるまで待機
    const rejectModal = page.locator('#reject-modal-overlay');
    await expect(rejectModal).toBeVisible();

    // 却下モーダルの確定ボタンをクリック
    const rejectConfirmBtn = page.locator('#reject-modal-confirm');
    await expect(rejectConfirmBtn).toBeVisible();
    await rejectConfirmBtn.click();

    // 状態異常通知ダイアログが表示されるまで待機
    // 状態異常検出ダイアログを特定
    const stateErrorDialog = page.locator('[class*="modal"], [role="dialog"]').filter({ 
      has: page.locator('text=状態異常検出') 
    });
    await expect(stateErrorDialog).toBeVisible({ timeout: 5000 });

    // ダイアログのタイトルを検証
    const dialogTitle = stateErrorDialog.locator('h1, h2, [class*="title"]');
    await expect(dialogTitle.first()).toContainText('状態異常検出');

    // ダイアログの本文を検証
    const dialogMessage = stateErrorDialog.locator('p, [class*="message"], [class*="content"]');
    await expect(dialogMessage.first()).toContainText('選択した人員配置案が無効な状態です。進捗データとの整合性が取れていません。管理者に連絡してください。');

    // 確認ボタン「了解」が表示されていることを確認
    const confirmBtn = stateErrorDialog.locator('button:has-text("了解")');
    await expect(confirmBtn).toBeVisible();

    // ダイアログ表示中：却下モーダルが依然として画面上に残存していることを確認（処理が確定していない）
    await expect(rejectModal).toBeVisible();

    // ダイアログ表示中：人員配置案が画面上に残存していることを確認
    await expect(proposalDetailContainer).toBeVisible();

    // 「了解」ボタンをクリックしてダイアログを閉じる
    await confirmBtn.click();

    // ダイアログが閉じたことを確認
    await expect(stateErrorDialog).not.toBeVisible();

    // 人員配置最適化提案・実行画面に戻っていることを確認
    await expect(proposalDetailContainer).toBeVisible();

    // 却下モーダルも依然存在することで、処理が確定していないことを確認
    await expect(rejectModal).toBeVisible();
  });
});