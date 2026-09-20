import { test, expect } from '@playwright/test';

test('SCEN-1416: 配信対象の人員配置案が存在しないと、操作が中止される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  await page.waitForURL('**/panels/scr-1789461783315.html');
  
  // ダッシュボード画面で拠点・チームを選択
  const siteFilter = page.locator('[data-testid="site-filter"]');
  await siteFilter.click();
  // 拠点を選択（例：東京拠点）
  await page.locator('text=東京拠点').click();
  
  // リスクレベルフィルターは操作しない（全て表示）
  
  // 人員配置最適化提案・実行画面へ遷移
  await page.click('text=人員配置最適化提案');
  await page.waitForURL('**/panels/scr-1789461798629.html');
  
  // 配置案が存在することを確認
  const proposalContainer = page.locator('#proposals-container');
  await expect(proposalContainer).toBeVisible();
  
  // 配置案を再生成する際に、対象人員が存在しない配置案が生成されるまで試行する
  // システムの配置案生成ロジックにより、配置元拠点からの転配可能人員がない、または配置案が空である状態になるように条件を整える
  let emptyProposalFound = false;
  let maxRetries = 5;
  
  for (let retry = 0; retry < maxRetries; retry++) {
    const generateProposalsBtn = page.locator('[data-testid="generate-proposals-btn"]');
    await generateProposalsBtn.click();
    await page.waitForLoadState('networkidle');
    
    // 複数の配置案から対象人員が存在しない配置案を探す
    const proposalElements = page.locator('[id*="proposal-"]');
    const proposalCount = await proposalElements.count();
    
    for (let i = 0; i < proposalCount; i++) {
      const proposal = proposalElements.nth(i);
      await proposal.click();
      await page.waitForLoadState('networkidle');
      
      // 配置対象作業者グループを確認
      const assignmentDetailTable = page.locator('#assignment-detail-tbody');
      await expect(assignmentDetailTable).toBeVisible();
      
      // 配置対象作業者が存在するか確認
      const assignmentCount = await page.locator('#assignment-detail-tbody tr').count();
      
      if (assignmentCount === 0) {
        emptyProposalFound = true;
        break;
      }
    }
    
    if (emptyProposalFound) {
      break;
    }
  }
  
  // 対象人員が0件の配置案が見つかったことを確認
  await expect(page.locator('#assignment-detail-tbody tr')).toHaveCount(0);
  
  // 「配置案と作業指示を一括配信」ボタンをクリック
  const distributeBtn = page.locator('[data-testid="distribute-button"]');
  await distributeBtn.click();
  
  // 配信モーダルが開くのを待つ
  const distributeModal = page.locator('#distribute-modal-overlay');
  await expect(distributeModal).toBeVisible();
  
  // 配信モーダル内で配置案の対象人員が表示されないか、対象人員リストが空である状態を確認
  // モーダル内の対象人員表示要素を確認
  const modalContent = page.locator('#distribute-modal-content');
  await expect(modalContent).toBeVisible();
  
  // モーダル内に配置対象人員情報が表示されているかを確認
  // 対象人員が存在しない場合、モーダル内に人員リストが表示されないか空である
  const workerListInModal = page.locator('#distribute-modal-content [id*="tbody"]');
  const isWorkerListVisible = await workerListInModal.isVisible().catch(() => false);
  
  if (isWorkerListVisible) {
    const workerRowsInModal = workerListInModal.locator('tr');
    await expect(workerRowsInModal).toHaveCount(0);
  }
  
  // 配信モーダル内の「確定」ボタンを取得
  const confirmButton = page.locator('[data-testid="distribute-modal-confirm"]');
  
  // 「確定」ボタンがdisabled状態であるか確認、または、クリック時にエラーメッセージが表示されることを確認
  const isDisabled = await confirmButton.isDisabled();
  
  if (isDisabled) {
    // ボタンが無効状態であることを確認
    await expect(confirmButton).toBeDisabled();
  } else {
    // ボタンをクリックしてエラーメッセージを確認
    await confirmButton.click();
    
    // エラーメッセージが表示されることを確認
    const errorMessage = await page.locator('text=対象となる人員配置案が存在しません。配置案の再生成後に操作してください').isVisible();
    expect(errorMessage).toBe(true);
  }
  
  // モーダルが閉じないことを確認（配信処理が中止される）
  await expect(distributeModal).toBeVisible();
  
  // 配信通知がシステムから送出されず、配信処理が実行されていないことを確認
  const successBanner = page.locator('#success-banner');
  await expect(successBanner).not.toBeVisible();
});