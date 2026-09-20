import { test, expect } from '@playwright/test';

test('SCEN-1107: 確認アクション完了後に割当変更履歴に記録が残る', async ({ page }) => {
  // ステップ1: 生産性ダッシュボード・分析画面にログイン
  await test.step('テストユーザー（リーダー権限）でログイン', async () => {
    await page.goto('/');
    
    // ログインフォームに入力
    await page.fill('input[name="userid"]', 'testuser_reader');
    await page.fill('input[name="password"]', 'password123');
    
    // ログインボタンをクリック
    await page.click('button[type="submit"]');
    
    // ログイン後の自動遷移を待機
    await page.waitForNavigation();
    await page.waitForLoadState('networkidle');
  });

  // ステップ2: 最適人員配置案提案・実行画面へ遷移
  await test.step('最適人員配置案提案・実行画面へ遷移', async () => {
    // ナビゲーションメニューから最適人員配置案提案・実行画面を選択
    await page.click('a[href*="scr-1789461978707"]');
    await page.waitForLoadState('networkidle');
  });

  // ステップ3: 生成済みの人員配置案を確認
  await test.step('人員配置案と割当変更内容を確認', async () => {
    // 配置案が表示されていることを確認
    const placementProposal = await page.locator('[data-testid="placement-proposal"]');
    await expect(placementProposal).toBeVisible();
    
    // 割当変更内容（作業者A→工程1から工程2への変更）が表示されていることを確認
    const changeContent = await page.locator('text=/作業者A.*工程1.*工程2/');
    await expect(changeContent).toBeVisible();
  });

  // ステップ4: 「確認」ボタンをクリック
  let confirmationMessage = '';
  await test.step('「確認」ボタンをクリック', async () => {
    await page.click('button:has-text("確認")');
    await page.waitForLoadState('networkidle');
  });

  // ステップ5: 完了メッセージが表示されることを確認
  await test.step('完了メッセージを確認', async () => {
    const successMessage = await page.locator('text=/配置案が承認されました|配置案が確認されました/');
    await expect(successMessage).toBeVisible();
    confirmationMessage = await successMessage.textContent() || '';
  });

  // ステップ6: 割当変更履歴を確認できる画面・機能へアクセス
  await test.step('割当変更履歴画面へアクセス', async () => {
    // 履歴タブまたはログビューアをクリック
    const historyTab = await page.locator('[data-testid="history-tab"], button:has-text("履歴"), button:has-text("ログ")').first();
    if (await historyTab.isVisible()) {
      await historyTab.click();
      await page.waitForLoadState('networkidle');
    }
  });

  // ステップ7: 履歴一覧に新しい記録が追加されていることを確認
  await test.step('割当変更履歴レコードを検証', async () => {
    // 履歴一覧のテーブルを取得
    const historyTable = await page.locator('[data-testid="history-table"], table').first();
    await expect(historyTable).toBeVisible();

    // 最新の履歴行を取得（通常はテーブルの最初の行）
    const latestRow = await page.locator('tbody tr').first();
    await expect(latestRow).toBeVisible();

    // タイムスタンプが存在することを確認
    const timestamp = await latestRow.locator('td').first();
    await expect(timestamp).toContainText(/\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}/);

    // 実行ユーザー名を確認
    const userCell = await latestRow.locator('td:nth-child(2)');
    await expect(userCell).toContainText('testuser_reader');

    // 変更対象者（作業者A）と変更内容（工程1→工程2）を確認
    const changeCell = await latestRow.locator('td:nth-child(3)');
    await expect(changeCell).toContainText(/作業者A|工程1|工程2/);

    // アクション種別（「確認」）を確認
    const actionCell = await latestRow.locator('td:nth-child(4)');
    await expect(actionCell).toContainText('確認');

    // ステータス（「完了」または「承認済み」）を確認
    const statusCell = await latestRow.locator('td:nth-child(5)');
    await expect(statusCell).toContainText(/完了|承認済み/);
  });
});