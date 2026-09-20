import { test, expect } from '@playwright/test';

test('SCEN-1371: 人員配置案却下', async ({ page }) => {
  // ログイン処理
  await test.step('人員配置最適化提案・実行画面にログインする', async () => {
    await page.goto('/');
    
    // ログイン画面でのユーザー認証
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button:has-text("ログイン")');
    
    // ダッシュボード画面への遷移を待機
    await page.waitForURL('**/panels/scr-1789461783315.html');
    
    // ナビゲーションから人員配置最適化提案画面へ移動
    await page.click('a[href*="scr-1789461798629"]');
    await page.waitForURL('**/panels/scr-1789461798629.html');
  });

  let targetProposalId: string;
  let initialStatus: string;

  // 却下対象となる人員配置案を検索・特定する
  await test.step('却下対象となる人員配置案を検索・特定する', async () => {
    // 提案一覧が読み込まれるまで待機
    await page.waitForSelector('[id="proposals-container"]');
    
    // 提案一覧から対象案を探す
    const proposals = await page.locator('[id="proposals-container"] > div').all();
    expect(proposals.length).toBeGreaterThan(0);

    let foundProposal = false;
    for (const proposal of proposals) {
      // 提案内の状態を表すフィールドを確認
      const statusElement = await proposal.locator('[id*="logic-status"]').first();
      const statusText = await statusElement.textContent();
      
      // 提案要素全体のテキストを取得して承認状態と配信状態を確認
      const proposalText = await proposal.textContent();
      
      // 「有効」状態で「承認済み」「配信済み」ではない案を探す
      const hasValidStatus = statusText?.includes('有効') ?? false;
      const isNotApproved = !(proposalText?.includes('承認済み') ?? false);
      const isNotDistributed = !(proposalText?.includes('配信済み') ?? false);
      
      if (hasValidStatus && isNotApproved && isNotDistributed) {
        targetProposalId = await proposal.getAttribute('data-proposal-id') || '';
        initialStatus = statusText?.trim() || '';
        foundProposal = true;
        break;
      }
    }
    
    expect(foundProposal).toBe(true);
    expect(targetProposalId).toBeTruthy();
    expect(initialStatus).toContain('有効');
  });

  // 対象の人員配置案の詳細を開く
  await test.step('対象の人員配置案の詳細を開く', async () => {
    const proposalElement = page.locator(`[id="proposals-container"] [data-proposal-id="${targetProposalId}"]`);
    await proposalElement.click();
    
    // 詳細画面が表示されることを確認
    await page.waitForSelector('[id="proposal-detail-container"]');
    const detailContent = await page.locator('[id="proposal-detail-container"]').textContent();
    expect(detailContent).toBeTruthy();
  });

  // 画面上の「却下」ボタンをクリックする
  await test.step('「却下」ボタンをクリックする', async () => {
    const rejectButton = page.locator('[id="reject-btn"]');
    await expect(rejectButton).toBeVisible();
    await rejectButton.click();
  });

  // 却下確認ダイアログが表示されることを確認する
  await test.step('却下確認ダイアログが表示されることを確認する', async () => {
    const rejectModal = page.locator('[id="reject-modal-overlay"]');
    await expect(rejectModal).toBeVisible();
    
    const rejectReasonTextarea = page.locator('[id="reject-reason"]');
    await expect(rejectReasonTextarea).toBeVisible();
    
    // ダイアログ内の「却下を確定」ボタン存在確認
    const rejectConfirmButton = page.locator('[id="reject-modal-confirm"]');
    await expect(rejectConfirmButton).toBeVisible();
  });

  // ダイアログ内の「却下を確定」ボタンをクリックする
  await test.step('「却下を確定」ボタンをクリックする', async () => {
    const confirmButton = page.locator('[id="reject-modal-confirm"]');
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();
  });

  // 画面が却下完了状態に更新されることを確認する
  await test.step('画面が却下完了状態に更新されることを確認する', async () => {
    // 却下完了メッセージが表示されることを確認
    const successMessage = page.locator('text=人員配置案は却下されました');
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // 詳細画面内の状態表示が「却下」に更新されていることを確認
    const statusDisplay = page.locator('[id="logic-status"]');
    const updatedStatusText = await statusDisplay.textContent();
    expect(updatedStatusText).toContain('却下');

    // 詳細画面内に却下実行日時が記録されていることを確認
    const proposalDetail = page.locator('[id="proposal-detail-container"]');
    const detailText = await proposalDetail.textContent();
    expect(detailText).toBeTruthy();
    
    // 詳細内に日時情報が含まれていることを確認（却下実行後には日時が記録される）
    const hasTimestamp = /\d{4}-\d{2}-\d{2}/.test(detailText || '');
    expect(hasTimestamp).toBe(true);

    // 提案一覧内で対象案が「却下」状態に変更されていることを確認
    const proposalsList = page.locator('[id="proposals-container"]');
    const proposalElement = proposalsList.locator(`[data-proposal-id="${targetProposalId}"]`);
    const proposalStatus = await proposalElement.locator('[id*="logic-status"]').first().textContent();
    expect(proposalStatus).toContain('却下');
  });
});