import { test, expect } from '@playwright/test';

test('SCEN-1113: 工程4で配置対象の配置計画レコードが見つからない場合、処理が中断される', async ({ page }) => {
  // 最適人員配置案提案・実行画面にアクセス
  await page.goto('/panels/scr-1789461978707.html');
  
  // 承認待ちの配置案一覧が表示されるまで待機
  await page.waitForSelector('[data-testid="allocation-plan-list"]', { timeout: 5000 });
  
  // 工程4に該当する配置案を探して選択
  const allocationItems = await page.locator('[data-testid="allocation-plan-item"]').all();
  let process4Item = null;
  
  for (const item of allocationItems) {
    const processText = await item.locator('[data-testid="process-number"]').textContent();
    if (processText?.includes('4')) {
      process4Item = item;
      break;
    }
  }
  
  // 工程4の配置案が見つかることを確認
  expect(process4Item).not.toBeNull();
  
  // 配置案を選択
  await process4Item!.click();
  
  // 詳細画面が表示されるまで待機
  await page.waitForSelector('[data-testid="allocation-detail"]', { timeout: 5000 });
  
  // 「承認」ボタンをクリック
  const approveButton = page.locator('button[data-testid="approve-button"]');
  await approveButton.click();
  
  // エラーメッセージが表示されるまで待機
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible({ timeout: 5000 });
  
  // エラーメッセージの内容を検証
  await expect(errorMessage).toContainText('配置対象の配置計画レコードが見つかりません');
  
  // 配置案のステータスが「承認待ち」のままであることを確認
  const statusElement = page.locator('[data-testid="allocation-status"]');
  await expect(statusElement).toContainText('承認待ち');
});