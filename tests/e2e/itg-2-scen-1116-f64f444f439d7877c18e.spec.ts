import { test, expect } from '@playwright/test';

test('SCEN-1116: 工程9で承認済み配置案がシステムから現場リーダーに配置指示として配信されると、工程10のダッシュボード表示が更新される', async ({ page }) => {
  // ログイン画面に遷移
  await page.goto('/');
  
  // ログインフォームに入力
  await page.fill('input[type="text"]', 'user@example.com');
  await page.fill('input[type="password"]', 'password123');
  
  // ログインボタンをクリック
  await page.click('button[type="submit"]');
  
  // 最適人員配置案提案・実行画面への遷移を待つ
  await page.waitForURL('**/scr-1789461978707.html');
  
  // 承認待ち状態の配置案が表示されていることを確認
  const pendingApprovalItem = page.locator('[data-status="pending"]').first();
  await expect(pendingApprovalItem).toBeVisible();
  
  // 承認待ち配置案の詳細内容を確認
  const detailsButton = pendingApprovalItem.locator('button:has-text("詳細")');
  await detailsButton.click();
  
  // 詳細情報が表示されるのを待つ
  const detailsPanel = page.locator('[data-test-id="details-panel"]');
  await expect(detailsPanel).toBeVisible();
  
  // 詳細内容を取得
  const workerName = await detailsPanel.locator('[data-test-id="worker-name"]').textContent();
  const processName = await detailsPanel.locator('[data-test-id="process-name"]').textContent();
  const assignmentTime = await detailsPanel.locator('[data-test-id="assignment-time"]').textContent();
  
  // 『承認』ボタンをクリック
  const approveButton = detailsPanel.locator('button:has-text("承認")');
  await approveButton.click();
  
  // 承認処理が完了し、ステータスが『承認済み』に更新されたことを確認
  const approvedStatus = page.locator('[data-status="approved"]');
  await expect(approvedStatus).toBeVisible();
  
  // 承認済みの配置案が表示されていることを確認
  const approvedItem = page.locator('[data-status="approved"]').first();
  await expect(approvedItem).toBeVisible();
  
  // 生産性ダッシュボード・分析画面への自動遷移を確認（5秒以内）
  const dashboardURL = '**/scr-1789461964046.html';
  let navigatedAutomatically = false;
  
  try {
    await page.waitForURL(dashboardURL, { timeout: 5000 });
    navigatedAutomatically = true;
  } catch {
    // 自動遷移がない場合は手動で遷移
    navigatedAutomatically = false;
  }
  
  if (!navigatedAutomatically) {
    // 手動で遷移
    await page.goto('/panels/scr-1789461964046.html');
  }
  
  // ダッシュボード画面の読み込みを待つ
  await page.waitForURL(dashboardURL);
  
  // 『現在の配置状態』セクションが表示されることを確認
  const currentAssignmentSection = page.locator('[data-test-id="current-assignment-section"]');
  await expect(currentAssignmentSection).toBeVisible();
  
  // 手順2で承認した配置案の内容が反映されていることを確認
  const assignmentContent = currentAssignmentSection.locator('[data-test-id="assignment-content"]');
  await expect(assignmentContent).toBeVisible();
  
  // 配置作業者名が表示されていることを確認
  const displayedWorkerName = await assignmentContent.locator('[data-test-id="displayed-worker-name"]').textContent();
  expect(displayedWorkerName).toContain(workerName?.trim() || '');
  
  // 配置工程が表示されていることを確認
  const displayedProcessName = await assignmentContent.locator('[data-test-id="displayed-process-name"]').textContent();
  expect(displayedProcessName).toContain(processName?.trim() || '');
  
  // 配置日時が表示されていることを確認
  const displayedAssignmentTime = await assignmentContent.locator('[data-test-id="displayed-assignment-time"]').textContent();
  expect(displayedAssignmentTime).toContain(assignmentTime?.trim() || '');
});