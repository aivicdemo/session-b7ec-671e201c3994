import { test, expect } from '@playwright/test';

test('SCEN-1392: 人員配置案のステータスが『配信済み』に更新され、配信日時と配信者が記録される', async ({ page }) => {
  // ログイン画面へ遷移
  await page.goto('/');
  
  // ログイン情報を入力して送信（サンプルユーザー）
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  
  // ダッシュボードが読み込まれるまで待機
  await page.waitForURL('**/panels/scr-1789461783315.html');
  
  // ログイン中のユーザー名を取得
  const loggedInUserName = await page.locator('.shell-user-name').textContent();
  
  // ステップ1: 人員配置最適化提案・実行画面を開く
  await page.click('text=人員配置最適化提案');
  await page.waitForURL('**/panels/scr-1789461798629.html');
  
  // 配置案一覧が読み込まれるまで待機
  await page.waitForSelector('[id="proposals-container"]');
  
  // ステップ2: 配置案一覧から、ステータスが『提案済み』の人員配置案を1件選択する
  const proposalRows = page.locator('[id="proposals-container"] > div');
  const proposalCount = await proposalRows.count();
  expect(proposalCount).toBeGreaterThan(0);
  
  // ステータスが『提案済み』の配置案を探して選択
  let selectedProposal = null;
  for (let i = 0; i < proposalCount; i++) {
    const proposal = proposalRows.nth(i);
    const statusText = await proposal.textContent();
    if (statusText?.includes('提案済み')) {
      selectedProposal = proposal;
      await proposal.click();
      break;
    }
  }
  
  expect(selectedProposal).not.toBeNull();
  
  // ステップ3: 選択した配置案の詳細情報を確認し、配置対象拠点・チーム・配置内容が表示されていることを確認する
  const detailContainer = page.locator('[id="proposal-detail-container"]');
  await expect(detailContainer).toBeVisible();
  
  const assignmentTable = page.locator('[id="assignment-detail-tbody"]');
  await expect(assignmentTable).toBeVisible();
  
  const tableRows = assignmentTable.locator('tr');
  const rowCount = await tableRows.count();
  expect(rowCount).toBeGreaterThan(0);
  
  // 配置対象拠点・チーム・配置内容が表示されていることを確認
  const firstRow = tableRows.first();
  const rowContent = await firstRow.textContent();
  expect(rowContent).toBeTruthy();
  expect(rowContent?.length).toBeGreaterThan(0);
  
  // ステップ4: 画面上の『配信する』ボタンをクリックする
  const distributeButton = page.locator('[data-testid="distribute-button"]');
  await expect(distributeButton).toBeEnabled();
  
  // 配信実行時刻を記録
  const deliveryTimeBeforeClick = new Date();
  await distributeButton.click();
  
  // ステップ5: 配信完了ダイアログが画面に表示され、『配信が完了しました』というメッセージが表示される
  const confirmModal = page.locator('[id="distribute-modal-overlay"]');
  await expect(confirmModal).toBeVisible();
  
  const modalContent = page.locator('[id="distribute-modal-content"]');
  await expect(modalContent).toBeVisible();
  
  const successMessage = page.locator('text=配信が完了しました');
  await expect(successMessage).toBeVisible();
  
  const confirmButton = page.locator('[data-testid="distribute-modal-confirm"]');
  await expect(confirmButton).toBeVisible();
  
  // 配信を確認
  await confirmButton.click();
  
  // 配信実行完了時刻を記録（ダイアログ確認後）
  const deliveryTimeAfterClick = new Date();
  
  // ステップ6: ダイアログを閉じて配置案一覧画面に戻る
  await page.waitForSelector('[id="proposals-container"]');
  await expect(page.locator('[id="proposals-container"]')).toBeVisible();
  
  // 期待結果: 配置案一覧の該当行において、ステータスが『配信済み』に更新され、配信日時と配信者が記録・表示される
  // 配信済みの配置案を確認
  const updatedProposalRows = page.locator('[id="proposals-container"] > div');
  const updatedProposalCount = await updatedProposalRows.count();
  expect(updatedProposalCount).toBeGreaterThan(0);
  
  // ステータスが『配信済み』の配置案を探す
  let deliveredProposal = null;
  for (let i = 0; i < updatedProposalCount; i++) {
    const proposal = updatedProposalRows.nth(i);
    const statusText = await proposal.textContent();
    if (statusText?.includes('配信済み')) {
      deliveredProposal = proposal;
      break;
    }
  }
  
  expect(deliveredProposal).not.toBeNull();
  
  // ステータスが『配信済み』に更新されていることを確認
  const statusElement = deliveredProposal!.locator('text=配信済み');
  await expect(statusElement).toBeVisible();
  
  // 配信日時が表示されていることを確認（日時形式のテキスト）
  const deliveryDateTimeRegex = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/;
  const proposalContent = await deliveredProposal!.textContent();
  expect(proposalContent).toMatch(deliveryDateTimeRegex);
  
  // 配信日時が配信実行時刻の範囲内であることを確認
  const dateTimeMatches = proposalContent?.match(deliveryDateTimeRegex);
  expect(dateTimeMatches).not.toBeNull();
  
  if (dateTimeMatches) {
    const recordedDateTime = new Date(dateTimeMatches[0].replace(' ', 'T'));
    // 配信実行時刻（ボタンクリック時刻）と完了時刻の間に記録されたことを確認
    expect(recordedDateTime.getTime()).toBeGreaterThanOrEqual(deliveryTimeBeforeClick.getTime());
    expect(recordedDateTime.getTime()).toBeLessThanOrEqual(deliveryTimeAfterClick.getTime() + 5000);
  }
  
  // 配信者（ログイン中のユーザー名）が表示されていることを確認
  if (loggedInUserName) {
    expect(proposalContent).toContain(loggedInUserName.trim());
  }
  
  // 記録された情報は画面リロード後も保持されることを確認
  await page.reload();
  await page.waitForSelector('[id="proposals-container"]');
  
  const reloadedProposalRows = page.locator('[id="proposals-container"] > div');
  const reloadedProposalCount = await reloadedProposalRows.count();
  expect(reloadedProposalCount).toBeGreaterThan(0);
  
  // リロード後もステータスが『配信済み』である配置案を確認
  let reloadedDeliveredProposal = null;
  for (let i = 0; i < reloadedProposalCount; i++) {
    const proposal = reloadedProposalRows.nth(i);
    const statusText = await proposal.textContent();
    if (statusText?.includes('配信済み')) {
      reloadedDeliveredProposal = proposal;
      break;
    }
  }
  
  expect(reloadedDeliveredProposal).not.toBeNull();
  
  // リロード後もステータスが『配信済み』であることを確認
  const reloadedStatus = reloadedDeliveredProposal!.locator('text=配信済み');
  await expect(reloadedStatus).toBeVisible();
  
  // リロード後も配信日時が表示されていることを確認
  const reloadedProposalContent = await reloadedDeliveredProposal!.textContent();
  expect(reloadedProposalContent).toMatch(deliveryDateTimeRegex);
  
  // リロード後も配信者が表示されていることを確認
  if (loggedInUserName) {
    expect(reloadedProposalContent).toContain(loggedInUserName.trim());
  }
});