import { test, expect } from '@playwright/test';

test('SCEN-926: 指定された配置計画IDが存在しないとき、配置計画取得に失敗し却下操作が拒否される', async ({ page }) => {
  // 最適人員配置案提案・実行画面を開く
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');

  // ブラウザのアドレスバーで配置計画IDパラメータを存在しないIDに変更してページを遷移させる
  await page.goto('/panels/scr-1789461978707.html?planId=999999999');
  await page.waitForLoadState('networkidle');

  // 却下ボタンを押下する
  const rejectButton = page.locator('button:has-text("却下")');
  
  // 却下ボタンが無効化されているか、または操作が受け付けられないことを確認
  const isDisabled = await rejectButton.isDisabled().catch(() => false);
  
  if (isDisabled) {
    // 却下ボタンが無効化されている場合
    expect(isDisabled).toBe(true);
  } else {
    // ボタンが有効な場合、クリック後にエラーメッセージが表示されることを確認
    await rejectButton.click();
    
    // エラーメッセージが表示されていることを確認
    const errorMessage = page.locator('text=指定された配置計画が存在しません。別の計画を選択してください。');
    await expect(errorMessage).toBeVisible();
  }

  // 却下確認ダイアログが表示されていないことを確認
  const confirmDialog = page.locator('[role="dialog"]');
  const isDialogVisible = await confirmDialog.isVisible().catch(() => false);
  expect(isDialogVisible).toBe(false);
});