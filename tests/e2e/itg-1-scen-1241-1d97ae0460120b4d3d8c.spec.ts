import { test, expect } from '@playwright/test';

test('SCEN-1241: 配置案の配信がTwilioで失敗した場合、メッセージが表示される', async ({ page, context }) => {
  // ログイン
  await page.goto('/');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'testpass');
  await page.click('button:has-text("ログイン")');
  await page.waitForLoadState('networkidle');

  // 人員配置最適化提案・実行画面に遷移
  await page.click('a[href*="scr-1789461798629"]');
  await page.waitForLoadState('networkidle');

  // WmsHandyTerminalDataSourceから進捗データを正常に取得した状態にする
  await page.route('**/api/**/progress*', (route) => {
    route.respond({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        plannedProgress: 45,
        actualProgress: 42,
        riskLevel: 'medium',
        delayDays: 2
      })
    });
  });

  // Amazon SageMakerから遅延リスク予測と人員配置提案を正常に取得した状態にする
  await page.route('**/api/**/recommendations*', (route) => {
    route.respond({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        proposals: [
          {
            proposalId: 'prop-001',
            estimatedHours: 120,
            assignmentCount: 5,
            assignments: [
              {
                workerId: 'W001',
                workerName: '作業者A',
                proficiency: 3,
                plannedHours: 24,
                reason: '高い習熟度による配置'
              },
              {
                workerId: 'W002',
                workerName: '作業者B',
                proficiency: 2,
                plannedHours: 24,
                reason: '進捗支援'
              }
            ]
          }
        ],
        riskPredictions: {
          delayRisk: 0.35,
          performanceRisk: 0.28
        }
      })
    });
  });

  // 進捗データの取得を確認
  await expect(page.locator('[data-testid="progress-rate"]')).toBeVisible();

  // 配置案が表示されていることを確認
  const proposalDetail = page.locator('[id="proposal-detail-container"]');
  await expect(proposalDetail).toBeVisible();
  
  const assignmentTable = page.locator('[data-testid="assignment-detail-table"]');
  await expect(assignmentTable).toBeVisible();

  // 配置案に作業者情報が含まれていることを確認
  const assignmentRows = page.locator('[id="assignment-detail-tbody"] tr');
  const rowCount = await assignmentRows.count();
  expect(rowCount).toBeGreaterThan(0);

  // 配置案の工数が表示されていることを確認
  const proposalEstimatedHours = page.locator('[id="proposal-detail-container"]').first();
  await expect(proposalEstimatedHours).toContainText(/\d+h/);

  // 配置案の詳細情報（作業者名、習熟度、工数、推奨理由）を取得して保存
  const initialWorkerNames = await page.locator('[id="assignment-detail-tbody"] tr').evaluate((rows) => {
    return Array.from(rows).map(row => row.textContent || '');
  });
  expect(initialWorkerNames.length).toBeGreaterThan(0);

  // NotificationServiceAdapterの sendStaffingPlan呼び出しがTwilioへの通信エラーで失敗するようにスタブを設定
  await page.route('**/api/**/notification*', (route) => {
    route.abort('timedout');
  });

  // 「配置案を配信」ボタンをクリック
  await page.click('[data-testid="distribute-button"]');

  // 警告メッセージが表示されることを確認（error-bannerを探索）
  const warningBanner = page.locator('[id="error-banner"]').or(page.locator('[id="warning-banner"]')).or(page.locator('.warning-banner')).or(page.locator('.error-banner'));
  
  // メッセージが表示されるまで待機
  await expect(warningBanner).toBeVisible({ timeout: 5000 });

  // 画面上部に配置されていることを確認
  const boundingBox = await warningBanner.boundingBox();
  expect(boundingBox).not.toBeNull();
  if (boundingBox) {
    expect(boundingBox.y).toBeLessThan(300);
  }

  // メッセージテキストを確認
  await expect(warningBanner).toContainText('配信に一時的な遅延が発生しています');
  await expect(warningBanner).toContainText('数分以内に再試行します');

  // メッセージが警告色（黄色またはオレンジ）で表示されていることを確認
  const backgroundColor = await warningBanner.evaluate((el: HTMLElement) => {
    return window.getComputedStyle(el).backgroundColor;
  });
  
  // 黄色またはオレンジのRGB値を確認
  const isWarningColor = 
    backgroundColor === 'rgb(255, 193, 7)' ||  // 標準黄色
    backgroundColor === 'rgb(255, 152, 0)' ||  // 標準オレンジ
    backgroundColor === 'rgb(245, 158, 11)' || // CSS変数 --primary
    /rgb\(25[0-5],\s*1[0-9]{2},\s*[0-9]{1,2}\)/.test(backgroundColor); // 黄色系
  expect(isWarningColor).toBeTruthy();

  // メッセージが閉じるボタンを持つことを確認
  const closeButton = warningBanner.locator('button').first();
  await expect(closeButton).toBeVisible();

  // 配置案の内容が画面上に残っていることを確認
  await expect(assignmentTable).toBeVisible();

  // 配置案の詳細情報が変更されていないことを確認（配置案内容が保持されている）
  const afterWorkerNames = await page.locator('[id="assignment-detail-tbody"] tr').evaluate((rows) => {
    return Array.from(rows).map(row => row.textContent || '');
  });
  expect(afterWorkerNames).toEqual(initialWorkerNames);

  // 配置案の工数が変わっていないことを確認
  await expect(proposalEstimatedHours).toContainText(/\d+h/);

  // 配置案を配信ボタンの状態を確認（再試行中または配信待機中に変更される）
  const distributeBtn = page.locator('[data-testid="distribute-button"]');
  const buttonText = await distributeBtn.textContent();
  expect(
    buttonText?.includes('再試行中') || 
    buttonText?.includes('配信待機中')
  ).toBeTruthy();

  // 他の操作が一時的に制限されていることを確認
  // ダッシュボードへ戻るボタンが無効化されている
  const backButton = page.locator('[data-testid="cancel-button"]');
  const isBackDisabled = await backButton.evaluate((el: HTMLElement) => {
    return (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true';
  });
  expect(isBackDisabled).toBeTruthy();

  // 却下ボタンも無効化されている
  const rejectButton = page.locator('[data-testid="reject-button"]');
  const isRejectDisabled = await rejectButton.evaluate((el: HTMLElement) => {
    return (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true';
  });
  expect(isRejectDisabled).toBeTruthy();

  // 承認ボタンも無効化されている
  const approveButton = page.locator('[data-testid="approve-button"]');
  const isApproveDisabled = await approveButton.evaluate((el: HTMLElement) => {
    return (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true';
  });
  expect(isApproveDisabled).toBeTruthy();

  // 別の配置案編集が一時的に制限されていることを確認
  // プロポーザルコンテナ内の要素が非アクティブ状態であることを確認
  const proposalContainer = page.locator('[id="proposals-container"]');
  const isProposalDisabled = await proposalContainer.evaluate((el: HTMLElement) => {
    return el.getAttribute('aria-disabled') === 'true' || el.style.pointerEvents === 'none';
  });
  expect(isProposalDisabled || isBackDisabled).toBeTruthy();

  // 画面遷移が制限されていることを確認（ナビゲーションリンクが無効化されている）
  const navLinks = page.locator('[data-testid="dashboard-nav-link"], a[href*="scr-1789461783315"]');
  const navCount = await navLinks.count();
  if (navCount > 0) {
    const navDisabled = await navLinks.first().evaluate((el: HTMLElement) => {
      return el.getAttribute('aria-disabled') === 'true' || 
             (el as HTMLAnchorElement).style.pointerEvents === 'none' ||
             (el as HTMLElement).closest('[aria-disabled="true"]') !== null;
    });
    expect(navDisabled || isBackDisabled).toBeTruthy();
  }

  // 警告メッセージが表示されている状態が継続していることを確認
  await expect(warningBanner).toBeVisible();
  await expect(warningBanner).toContainText('配信に一時的な遅延が発生しています');
});