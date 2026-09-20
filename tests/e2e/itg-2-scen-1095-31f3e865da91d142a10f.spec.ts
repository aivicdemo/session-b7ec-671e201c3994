import { test, expect } from '@playwright/test';

test.describe('配置案却下処理', () => {
  test('配置案却下処理で却下対象IDと却下理由の入力値が妥当であると検証され、配置計画の現在状態と詳細情報が取得される', async ({ page }) => {
    // 最適人員配置案提案・実行画面にアクセス
    await page.goto('/panels/scr-1789461978707.html');
    
    // 配置案一覧から却下対象となる配置案を1件選択
    const placementCase = page.locator('[data-testid="placement-case-item"]').first();
    await expect(placementCase).toBeVisible();
    await placementCase.click();
    
    // 当該配置案の詳細表示エリアで「却下」ボタンをクリック
    const rejectButton = page.locator('button:has-text("却下")');
    await expect(rejectButton).toBeVisible();
    await rejectButton.click();
    
    // 却下処理用モーダルまたはダイアログが表示されたことを確認
    const modal = page.locator('[role="dialog"], [data-testid="reject-modal"]');
    await expect(modal).toBeVisible();
    
    // 却下対象IDフィールドに有効な配置案IDを入力
    const targetIdField = page.locator('input[placeholder*="配置案ID"], [data-testid="target-id-input"]').first();
    await expect(targetIdField).toBeVisible();
    await targetIdField.fill('PLN-20250115-001');
    
    // 却下理由フィールドにテキストを入力
    const reasonField = page.locator('textarea[placeholder*="却下理由"], [data-testid="reject-reason-input"]').first();
    await expect(reasonField).toBeVisible();
    await reasonField.fill('現場リーダーの勤務予定により実行困難');
    
    // 入力値の妥当性チェックが実行されることを確認
    // 必須項目チェック：却下対象IDが入力されていることを確認
    const filledTargetId = await targetIdField.inputValue();
    expect(filledTargetId).toBeTruthy();
    expect(filledTargetId).toMatch(/^PLN-\d{8}-\d{3}$/);
    
    // 必須項目チェック：却下理由が入力されていることを確認
    const filledReason = await reasonField.inputValue();
    expect(filledReason).toBeTruthy();
    
    // 妥当性チェック後、確定ボタンが有効になることを確認
    const confirmButton = page.locator('button:has-text("確定"), button:has-text("却下実行")').first();
    await expect(confirmButton).toBeEnabled();
    
    // 「確定」または「却下実行」ボタンをクリック
    await confirmButton.click();
    
    // モーダルが閉じて、却下処理画面から最適人員配置案提案・実行画面へ遷移したことを確認
    await expect(modal).not.toBeVisible();
    await expect(page).toHaveURL(/scr-1789461978707/);
    
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');
    
    // 対象配置案のステータスが「却下済み」に更新されたことを確認
    const statusElement = page.locator('[data-testid*="status"]').first();
    await expect(statusElement).toContainText('却下済み');
    
    // 配置計画の現在状態（ステータスと更新日時）が表示されることを確認
    const currentStateElement = page.locator('[data-testid="current-state"]');
    await expect(currentStateElement).toBeVisible();
    
    const statusDisplay = page.locator('[data-testid="current-state-status"]');
    await expect(statusDisplay).toBeVisible();
    
    const updatedAtDisplay = page.locator('[data-testid="current-state-updated-at"]');
    await expect(updatedAtDisplay).toBeVisible();
    // 更新日時が実際に値を持つことを確認
    const updatedAtText = await updatedAtDisplay.textContent();
    expect(updatedAtText).toBeTruthy();
    
    // 配置計画の詳細情報が画面上に表示されることを確認
    const detailInfoElement = page.locator('[data-testid="placement-detail-info"]');
    await expect(detailInfoElement).toBeVisible();
    
    // 配置ID、却下理由、却下実行者情報などが表示されていることを確認
    const placementId = page.locator('[data-testid="placement-id"]');
    const rejectReason = page.locator('[data-testid="reject-reason-display"]');
    const executorInfo = page.locator('[data-testid="executor-info"]');
    
    await expect(placementId).toBeVisible();
    await expect(rejectReason).toBeVisible();
    // 却下理由の入力値が正しく表示されているか確認
    await expect(rejectReason).toContainText('現場リーダーの勤務予定により実行困難');
    await expect(executorInfo).toBeVisible();
  });
});