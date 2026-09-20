import { test, expect } from '@playwright/test';

test.describe('配置案却下', () => {
  test('配置案却下の処理完了後、最適人員配置案提案・実行画面が更新され、却下状態が反映されてユーザーに表示される', async ({ page }) => {
    // ログイン画面へアクセス
    await page.goto('/');
    
    // ログイン処理（前提条件）
    await page.fill('input[placeholder*="ユーザー"]', 'testuser');
    await page.fill('input[placeholder*="パスワード"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    
    // ログイン後のリダイレクトを待つ
    await page.waitForNavigation();
    
    // 最適人員配置案提案・実行画面を開く
    await page.goto('/panels/scr-1789461978707.html');
    await page.waitForLoadState('networkidle');
    
    // 却下対象の配置案が画面に表示されていることを確認
    const proposalRow = page.locator('tr:has-text("PLAN-001")');
    await expect(proposalRow).toBeVisible();
    
    // ステータスが「提案中」であることを確認
    const statusCell = proposalRow.locator('[data-status="proposed"]');
    await expect(statusCell).toBeVisible();
    await expect(statusCell).toContainText('提案中');
    
    // 該当する配置案の「却下」ボタンをクリック
    const rejectButton = proposalRow.locator('button:has-text("却下")');
    await expect(rejectButton).toBeEnabled();
    await rejectButton.click();
    
    // 却下確認ダイアログが表示されたら「確定」ボタンをクリック
    const confirmDialog = page.locator('[role="dialog"]');
    await expect(confirmDialog).toBeVisible();
    
    const confirmButton = confirmDialog.locator('button:has-text("確定")');
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();
    
    // ローディングインジケータの消滅を確認（却下処理が完了するまで待機）
    const loadingIndicator = page.locator('[data-testid="loading"]');
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).not.toBeVisible({ timeout: 30000 });
    }
    
    // 最適人員配置案提案・実行画面が自動更新されることを確認
    // ステータスが「却下」に変更されるまで待機
    const updatedStatusCell = proposalRow.locator('[data-status="rejected"]');
    await expect(updatedStatusCell).toBeVisible({ timeout: 30000 });
    
    // 却下対象の配置案のステータスが「却下」に変更されていることを確認
    await expect(updatedStatusCell).toContainText('却下');
    
    // 該当行の背景色がグレーアウト、またはステータスバッジが赤系で表示されていることを確認
    const rejectedRow = page.locator('tr:has-text("PLAN-001")[data-status="rejected"]');
    await expect(rejectedRow).toBeVisible();
    
    const statusBadge = rejectedRow.locator('[data-badge="status"]');
    const computedStyle = await statusBadge.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // RGB値をパースして、赤系またはグレー系であることを確認
    const rgbMatch = computedStyle.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      
      // 赤系：R値が高く、G値とB値が低い
      const isRed = r > 150 && g < 100 && b < 100;
      
      // グレー系：R、G、B値がほぼ同等で中程度の灰色
      const isGray = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30 && r < 200 && r > 100;
      
      expect(isRed || isGray).toBe(true);
    }
    
    // その配置案に紐付く「実行」ボタンが非活性化されていることを確認
    const executeButton = rejectedRow.locator('button:has-text("実行")');
    await expect(executeButton).toBeDisabled();
  });
});