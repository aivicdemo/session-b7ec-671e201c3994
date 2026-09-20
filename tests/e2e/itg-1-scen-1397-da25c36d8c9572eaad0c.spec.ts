import { test, expect } from '@playwright/test';

test.describe('人員配置案配信', () => {
  test('配置案配信時にWMSからのデータ取得が失敗した場合、最後に正常に取得したキャッシュデータを使用して配信が続行される', async ({ page }) => {
    // 人員配置最適化提案・実行画面を開く
    await page.goto('/panels/scr-1789461798629.html');
    await page.waitForLoadState('networkidle');

    // 拠点A・チームBの配置案生成ボタンをクリックして、配置案が生成されることを確認する
    const generateProposalsBtn = page.getByTestId('generate-proposals-btn');
    await generateProposalsBtn.click();
    await page.waitForLoadState('networkidle');

    // 配置案が表示されることを確認
    const proposalsContainer = page.locator('id=proposals-container');
    await expect(proposalsContainer).toBeVisible();
    const proposalDetail = page.locator('id=proposal-detail-container');
    await expect(proposalDetail).toBeVisible();

    // 配置案配信ボタンをクリックして、配置案が配信されることを確認する
    const distributeButton = page.getByTestId('distribute-button');
    await distributeButton.click();

    // 配信モーダルが表示される
    const distributeModalOverlay = page.locator('id=distribute-modal-overlay');
    await expect(distributeModalOverlay).toBeVisible();

    // 配信を確認
    const distributeModalConfirm = page.getByTestId('distribute-modal-confirm');
    await distributeModalConfirm.click();
    await page.waitForLoadState('networkidle');

    // 配置案配信が完了し、配信ステータスが『配信完了』と表示されることを確認する
    const statusElements = page.locator('text=配信完了');
    await expect(statusElements).toBeVisible();

    // WMSの通信を遮断または遅延させる環境変更を行う
    await page.route('**/api/wms/**', route => {
      route.abort('failed');
    });

    // 人員配置最適化提案・実行画面で配置案再配信ボタンをクリックする
    const redistributeButton = page.getByTestId('distribute-button');
    await redistributeButton.click();

    // 配信モーダルが表示される
    const redistributeModalOverlay = page.locator('id=distribute-modal-overlay');
    await expect(redistributeModalOverlay).toBeVisible();

    // 画面上に『進捗データの更新に遅延が発生しています。最後の更新：○分前』というメッセージが表示されることを確認する
    const delayMessage = page.locator('text=/進捗データの更新に遅延が発生しています。最後の更新：.*分前/');
    await expect(delayMessage).toBeVisible();

    // 配置案に『データ更新待機中』という注記が付加されていることを確認する
    const waitingNote = page.locator('text=データ更新待機中');
    await expect(waitingNote).toBeVisible();

    // 配信を確認
    const redistributeModalConfirm = page.getByTestId('distribute-modal-confirm');
    await redistributeModalConfirm.click();

    // 配置案配信処理が中断せず、ボタン操作から配信完了まで進行することを確認する
    // モーダルが閉じられることを確認
    await expect(redistributeModalOverlay).not.toBeVisible({ timeout: 10000 });

    // 配置案配信が正常に完了し、配信ステータスが『配信完了』と表示されることを確認する
    const finalStatusElements = page.locator('text=配信完了');
    await expect(finalStatusElements).toBeVisible({ timeout: 30000 });

    // 遅延告知メッセージが表示されたままであることを確認
    await expect(delayMessage).toBeVisible();
    // データ更新待機中の注記が表示されたままであることを確認
    await expect(waitingNote).toBeVisible();
  });
});