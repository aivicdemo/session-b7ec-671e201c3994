import { test, expect } from '@playwright/test';

test('進捗データが24時間以上更新されていない場合、警告メッセージが画面に表示される', async ({ page }) => {
  // 進捗データの最終更新時刻を24時間以上前に設定するため、ローカルストレージをセット
  await page.addInitScript(() => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000 - 1000); // 24時間以上前
    sessionStorage.setItem('lastProgressUpdateTime', twentyFourHoursAgo.toISOString());
  });

  // 生産性ダッシュボード・分析画面にアクセス
  await page.goto('/panels/scr-1789461964046.html');

  // 画面の読み込みが完了するまで待機
  await page.waitForLoadState('networkidle');

  // 警告メッセージが表示されていることを確認
  const warningMessage = page.locator('text=進捗データが24時間以上更新されていません');
  await expect(warningMessage).toBeVisible();
});