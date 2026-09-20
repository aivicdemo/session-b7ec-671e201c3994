import { test, expect } from '@playwright/test';

test.describe('SCEN-941: 配置案承認', () => {
  test('配置案を承認すると、承認者ID・承認日時・承認コメントが記録され、割当変更履歴に保存される', async ({ page, context }) => {
    // ログイン画面にアクセス
    await page.goto('/');
    
    // ログイン処理
    const userIdInput = page.locator('input[placeholder*="ユーザーID"], input[placeholder*="ID"], input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button').filter({ hasText: /ログイン|Login/ }).first();
    
    const testUserId = 'testuser';
    await userIdInput.fill(testUserId);
    await passwordInput.fill('testpass');
    
    await loginButton.click();
    
    // ログイン後の遷移待機
    await page.waitForNavigation();
    
    // 最適人員配置案提案・実行画面にアクセス
    await page.goto('/panels/scr-1789461978707.html');
    await page.waitForLoadState('networkidle');
    
    // 承認待ち状態の配置案を表示する
    const pendingProposals = page.locator('text=/承認待ち/');
    await expect(pendingProposals.first()).toBeVisible();
    
    // 配置案の詳細を確認し、承認画面を開く
    const proposalRow = page.locator('tr, div').filter({ has: page.locator('text=/承認待ち/') }).first();
    const detailLink = proposalRow.locator('a, button').filter({ hasText: /詳細|確認/ }).first();
    await detailLink.click();
    
    await page.waitForLoadState('networkidle');
    
    // 承認画面を開く
    const approvalButton = page.locator('button').filter({ hasText: /承認/ }).first();
    await approvalButton.click();
    
    await page.waitForLoadState('networkidle');
    
    // 承認コメント欄に「承認します」と入力する
    const commentInput = page.locator('textarea, input[type="text"]').first();
    await commentInput.fill('承認します');
    
    // 承認ボタン押下直前に時刻を記録
    const approvalTimeBeforeClick = new Date();
    
    // 承認ボタンをクリックする
    const submitApprovalButton = page.locator('button').filter({ hasText: /確定|実行|送信/ }).first();
    await submitApprovalButton.click();
    
    const approvalTimeAfterClick = new Date();
    
    // 承認処理が完了し、画面が配置案一覧画面に遷移することを確認する
    await page.waitForNavigation();
    await page.waitForLoadState('networkidle');
    
    // 配置案一覧画面で当該配置案の状態が「承認済み」に更新されていることを確認する
    const approvedStatus = page.locator('text=/承認済み/');
    await expect(approvedStatus).toBeVisible();
    
    // 配置案の詳細画面を再度開く
    const approvedProposalRow = page.locator('tr, div').filter({ has: page.locator('text=/承認済み/') }).first();
    const detailLinkAgain = approvedProposalRow.locator('a, button').filter({ hasText: /詳細|確認/ }).first();
    await detailLinkAgain.click();
    
    await page.waitForLoadState('networkidle');
    
    // 詳細画面に承認者ID、承認日時、承認コメント「承認します」が表示されていることを確認する
    // 承認者IDの確認 - 「承認者ID」ラベルの直後にログイン時のユーザーIDが表示されていることを確認
    const approverIdLabel = page.locator('text=/^承認者ID/'). first();
    const approverIdValue = approverIdLabel.locator('.. >> text=' + testUserId);
    await expect(approverIdValue).toBeVisible();
    
    // 承認日時の確認（YYYY-MM-DD HH:MM:SS形式）
    const approvalDateTimeLabel = page.locator('text=/^承認日時|^承認時刻/').first();
    const approvalDateTimeContainer = approvalDateTimeLabel.locator('..');
    const approvalDateTimeText = await approvalDateTimeContainer.textContent();
    
    const dateTimeRegex = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;
    const displayedDateTime = approvalDateTimeText?.match(dateTimeRegex)?.[0];
    
    expect(displayedDateTime).toBeTruthy();
    
    // 表示された日時が承認ボタン押下時刻の範囲内であることを確認
    if (displayedDateTime) {
      const [displayedDateStr, displayedTimeStr] = displayedDateTime.split(' ');
      const displayedDate = new Date(`${displayedDateStr}T${displayedTimeStr}`);
      
      expect(displayedDate.getTime()).toBeGreaterThanOrEqual(approvalTimeBeforeClick.getTime());
      expect(displayedDate.getTime()).toBeLessThanOrEqual(approvalTimeAfterClick.getTime());
    }
    
    // 承認コメントの確認 - 「承認コメント」ラベルの直後に「承認します」が表示されていることを確認
    const commentLabel = page.locator('text=/^承認コメント|^コメント/').first();
    const commentValue = commentLabel.locator('.. >> text=承認します');
    await expect(commentValue).toBeVisible();
    
    // 割当変更履歴に保存されていることを確認
    const historySection = page.locator('text=/割当変更履歴|変更履歴/');
    await expect(historySection).toBeVisible();
    
    // 履歴テーブル内の最新レコード（最初の行）を取得して、承認者ID、承認日時、承認コメントが一つの履歴レコードとして表示されていることを確認
    const historyTable = historySection.locator('.. >> table, .. >> div[role="table"]').first();
    const historyRows = historyTable.locator('tbody tr, [role="row"]');
    const firstHistoryRow = historyRows.first();
    
    const historyRowContent = await firstHistoryRow.textContent();
    
    // 最新の履歴レコードにすべての情報が含まれていることを確認
    expect(historyRowContent).toContain(testUserId);
    expect(historyRowContent).toMatch(dateTimeRegex);
    expect(historyRowContent).toContain('承認します');
  });
});