import { test, expect } from '@playwright/test';

test.describe('SCEN-1228: 人員配置最適化提案画面遷移', () => {
  test('配置案が0件の場合、警告メッセージが表示される', async ({ page }) => {
    // 1. 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // 2. ダッシュボード上から「人員配置最適化提案・実行画面」へのナビゲーションボタンをクリックする
    const optimizationNavLink = page.getByRole('link', { name: '人員配置最適化提案' });
    await optimizationNavLink.click();
    await page.waitForLoadState('networkidle');

    // 3. 人員配置最適化提案・実行画面が読み込まれ、配置案の生成ロジックが実行される
    // ページ遷移完了を待つ
    await page.waitForURL('**/scr-1789461798629.html');

    // 4. 画面のレンダリング完了を待ち、DOM内の警告メッセージ領域を検査する
    await page.waitForLoadState('domcontentloaded');

    // 警告メッセージが表示されていることを確認
    const warningMessage = page.locator('text=配置案がありません。現在の進捗状況では最適な人員配置案を生成できませんでした。進捗データの更新を確認するか、手動で配置案を作成してください。');
    await expect(warningMessage).toBeVisible();

    // メッセージの背景色が黄色またはオレンジ色であることを確認
    const warningElement = warningMessage.locator('..');
    const bgColor = await warningElement.evaluate((el) => {
      const color = window.getComputedStyle(el).backgroundColor;
      return color;
    });

    // rgbまたはrgbaの値を抽出してパース
    const colorMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (colorMatch) {
      const r = parseInt(colorMatch[1], 10);
      const g = parseInt(colorMatch[2], 10);
      const b = parseInt(colorMatch[3], 10);

      // 黄色またはオレンジ色の判定
      // 黄色: R > 200, G > 150, B < 100
      // オレンジ色: R > 200, G > 100, G < 180, B < 100
      const isYellowOrOrange =
        (r > 200 && g > 150 && b < 100) || // 黄色
        (r > 200 && g > 100 && g < 180 && b < 100); // オレンジ色

      expect(isYellowOrOrange).toBe(true);
    } else {
      // hex形式の場合に対応
      expect(bgColor).toBeTruthy();
    }

    // メッセージ下部に「ダッシュボードに戻る」ボタンが表示されていることを確認
    const dashboardButton = page.getByRole('button', { name: 'ダッシュボードに戻る' });
    await expect(dashboardButton).toBeVisible();

    // 配置案の一覧テーブルまたはグリッド領域が空の状態であることを確認
    const proposalsContainer = page.locator('id=proposals-container');
    const assignmentDetailTable = page.locator('[data-testid="assignment-detail-table"]');

    // コンテナが存在する場合、その中身が空であることを確認
    if (await proposalsContainer.isVisible()) {
      const children = await proposalsContainer.locator('> *').count();
      expect(children).toBe(0);
    }

    // またはテーブル内容が空であることを確認
    if (await assignmentDetailTable.isVisible()) {
      const rows = await assignmentDetailTable.locator('tbody > tr').count();
      expect(rows).toBe(0);
    }
  });
});