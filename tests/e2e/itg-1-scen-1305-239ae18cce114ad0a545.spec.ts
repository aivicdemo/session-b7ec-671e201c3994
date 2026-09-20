import { test, expect } from '@playwright/test';

test.describe('SCEN-1305: AI リスク予測エンジンが一時的に利用できない場合のシナリオ', () => {
  test('AI リスク予測エンジン利用不可時に前回の判定結果がキャッシュから使用される', async ({ page }) => {
    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // ダッシュボード画面が読み込まれたことを確認
    const dashboardContent = page.locator('[class*="content-area"]');
    await expect(dashboardContent).toBeVisible();

    // ダッシュボード画面の「改善指示を配信」ボタンをクリック
    // ダッシュボード画面のナビゲーションから「人員配置最適化提案」へ遷移
    const optimizeNavItem = page.locator('[class*="shell-nav-item"]').filter({ hasText: '人員配置最適化提案' });
    await expect(optimizeNavItem).toBeVisible();
    await optimizeNavItem.click();

    // 人員配置最適化提案・実行画面へ遷移することを確認
    await page.waitForURL('/panels/scr-1789461798629.html');
    await page.waitForLoadState('networkidle');

    // 現在の進捗データが画面上に表示されていることを確認
    const progressRateElement = page.locator('[data-testid="progress-rate"]');
    await expect(progressRateElement).toBeVisible();

    // 進捗データが実際に表示されていることを確認
    const progressRateValue = page.locator('[id="progress-rate-value"]');
    await expect(progressRateValue).toBeVisible();

    const plannedProgress = page.locator('[id="planned-progress"]');
    await expect(plannedProgress).toBeVisible();

    const actualProgress = page.locator('[id="progress-bar-actual"]');
    await expect(actualProgress).toBeVisible();

    // 画面上部に「リスク判定エンジンが一時的に利用できません。前回の判定結果を表示しています」というメッセージが表示されていることを確認
    const engineWarningMessage = page.locator('text=/リスク判定エンジンが一時的に利用できません.*前回の判定結果を表示しています/');
    await expect(engineWarningMessage).toBeVisible();

    // 前回正常に取得された配置案が画面に表示されていることを確認（「更新待機中」という注記付き）
    const proposalsContainer = page.locator('[id="proposals-container"]');
    await expect(proposalsContainer).toBeVisible();

    const waitingForUpdateBadge = page.locator('text=更新待機中');
    await expect(waitingForUpdateBadge).toBeVisible();

    // 「新規配置案を生成」に相当するボタンを確認
    const generateProposalsBtn = page.locator('[data-testid="generate-proposals-btn"]');
    const generateBtnExists = await generateProposalsBtn.isVisible().catch(() => false);

    if (generateBtnExists) {
      // ボタンが存在する場合、ボタンが無効化されているか確認
      const isDisabledBeforeClick = await generateProposalsBtn.isDisabled();
      const classBeforeClick = await generateProposalsBtn.getAttribute('class');
      const isDisabledStateBeforeClick = isDisabledBeforeClick || (classBeforeClick?.includes('disabled') ?? false);

      // ボタンが無効化状態であることを確認
      expect(isDisabledStateBeforeClick).toBeTruthy();

      // ボタンをクリックしてみる
      await generateProposalsBtn.click();

      // クリック後もボタンが無効化されているか、またはグレーアウト状態を確認
      const isDisabledAfterClick = await generateProposalsBtn.isDisabled();
      const classAfterClick = await generateProposalsBtn.getAttribute('class');
      const isDisabledStateAfterClick = isDisabledAfterClick || (classAfterClick?.includes('disabled') ?? false);

      // ボタンが無効化状態であることを確認
      expect(isDisabledStateAfterClick).toBeTruthy();
    }

    // ボタンが存在する・しないにかかわらず、「現在、リスク判定エンジンが利用できないため新規配置案の生成は一時停止されています」メッセージが表示されていることを確認
    const generationStoppedMessage = page.locator('text=/現在.*リスク判定エンジンが利用できないため新規配置案の生成は一時停止されています/');
    await expect(generationStoppedMessage).toBeVisible();

    // 前回の配置案に基づいた改善指示を配信する操作を実行
    // 配置案が表示されていることを確認
    const proposalDetailContainer = page.locator('[id="proposal-detail-container"]');
    await expect(proposalDetailContainer).toBeVisible();

    // 「配置案と作業指示を一括配信」ボタンをクリック
    const distributeAssignmentButton = page.locator('[data-testid="distribute-button"]');
    await expect(distributeAssignmentButton).toBeVisible();
    await expect(distributeAssignmentButton).not.toBeDisabled();
    await distributeAssignmentButton.click();

    // 配信確認モーダルが表示される
    const distributeModal = page.locator('[id="distribute-modal-overlay"]');
    await expect(distributeModal).toBeVisible();

    // 配信を確認
    const confirmDistributeBtn = page.locator('[data-testid="distribute-modal-confirm"]');
    await expect(confirmDistributeBtn).toBeVisible();
    await confirmDistributeBtn.click();

    // 改善指示が正常に配信キューへ登録されることを確認
    await page.waitForLoadState('networkidle');

    // 配信成功メッセージが表示されることを確認
    const successMessage = page.locator('text=/配信.*完了|配信.*登録|配信.*成功/');
    await expect(successMessage).toBeVisible();

    // 配信履歴テーブルが表示されていることを確認
    const deliveryHistoryTable = page.locator('[data-testid="delivery-history-table"]');
    await expect(deliveryHistoryTable).toBeVisible();

    // 配信IDとタイムスタンプが記録されたことを確認
    const deliveryHistoryRows = page.locator('[id="delivery-history-tbody"] tr');
    const rowCount = await deliveryHistoryRows.count();

    // 配信履歴に少なくとも1件以上の記録があることを確認
    expect(rowCount).toBeGreaterThan(0);

    if (rowCount > 0) {
      // 最初の行（最新の配信記録）を確認
      const firstRow = deliveryHistoryRows.first();
      const cellTexts = await firstRow.locator('td').allTextContents();

      // 配信日時（タイムスタンプ）と配信ステータスが記録されていることを確認
      const hasTimestamp = cellTexts.some(text => text.match(/\d{4}-\d{2}-\d{2}.*\d{2}:\d{2}:\d{2}/));
      const hasDeliveryStatus = cellTexts.some(text => text.includes('配信') || text.includes('完了') || text.includes('送信'));

      // タイムスタンプと配信ステータスの両方が存在することを確認
      expect(hasTimestamp && hasDeliveryStatus).toBeTruthy();
    }
  });
});