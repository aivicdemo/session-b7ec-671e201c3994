import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-1424: 却下モーダル確定 - 実行中状態検証', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/panels/scr-1789461798629.html');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('実行中の人員配置案を却下しようとするとエラーメッセージが表示される', async () => {
    // 人員配置最適化提案・実行画面が開いているので、配置案一覧から実行中のものを特定
    const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
    const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);

    // WmsHandyTerminalDataSourceの呼び出し窓口経由でfetchProgressDataを呼び出して、実行中の配置案を確認
    const progressDataUrl = `${apiUrl}/api/progress?app=${appId}`;

    // WmsHandyTerminalDataSourceの呼び出し窓口経由でfetchProgressDataを呼び出して、進捗ステータスが『実行中』である配置案を確認
    const progressData = await page.evaluate(({ url }) => {
      return fetch(url).then(res => res.json());
    }, { url: progressDataUrl });

    // progressDataの結果から実行中のステータスを持つ配置案を特定
    let executingProposalId = null;
    let executingProposalStatus = null;
    if (progressData && Array.isArray(progressData)) {
      const executingItem = progressData.find((item: any) => item.status === '実行中' || item.status === 'executing');
      if (executingItem) {
        executingProposalId = executingItem.id;
        executingProposalStatus = executingItem.status;
      }
    }

    // 実行中の配置案が見つからない場合はスキップ
    if (!executingProposalId || !executingProposalStatus) {
      test.skip();
      return;
    }

    // 画面上の配置案一覧から実行中のものを特定
    const proposalsContainer = page.locator('#proposals-container');
    await proposalsContainer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);

    const proposalElements = await page.locator('#proposals-container > div').all();

    let executingProposalElement: any = null;

    // 画面上から該当の配置案要素を特定
    for (const element of proposalElements) {
      const elementText = await element.textContent().catch(() => '');
      if (elementText && elementText.includes('実行中')) {
        executingProposalElement = element;
        break;
      }
    }

    if (!executingProposalElement) {
      test.skip();
      return;
    }

    // スクロールして要素を表示
    await executingProposalElement.scrollIntoViewIfNeeded();

    // 該当の配置案の『却下』ボタンをクリック
    const rejectButton = executingProposalElement.locator('[testid="reject-button"]').or(
      executingProposalElement.locator('button:has-text("配置案を却下")')
    ).first();
    await rejectButton.click();

    // 却下確認モーダルが表示される
    const rejectModal = page.locator('#reject-modal-overlay');
    await rejectModal.waitFor({ state: 'visible', timeout: 5000 });

    // モーダルが表示されていることを確認
    await expect(rejectModal).toBeVisible();

    // 確定ボタンをクリック（この時点でバックエンド側で状態検証工程が実行される）
    const confirmButton = page.locator('#reject-modal-confirm');
    await confirmButton.click();

    // 却下モーダルが閉じられることを待機
    await expect(rejectModal).not.toBeVisible({ timeout: 10000 });

    // バックエンド側の状態検証工程が実行されて、エラーメッセージが表示されるのを待つ
    // エラーバナーまたはダイアログを待機（最大10秒）
    const errorBanner = page
      .locator('#error-banner, .error-message, [role="alert"]')
      .first();

    // エラーメッセージが表示されることを確認
    await expect(errorBanner).toBeVisible({ timeout: 10000 });

    const errorText = await errorBanner.textContent();

    // エラーメッセージに「この人員配置案は現在実行中のため、却下できません。実行完了後に再度操作してください。」が含まれていることを確認
    expect(errorText).toContain('この人員配置案は現在実行中のため、却下できません。実行完了後に再度操作してください。');

    // ダイアログ・バナーに『了解』または『詳細確認』などの操作ボタンが含まれることを確認
    const okButton = page.locator('button:has-text("了解"), button:has-text("詳細確認")').first();
    await expect(okButton).toBeVisible();

    // 現在の画面が進捗・人員配置ダッシュボードまたは人員配置最適化提案・実行画面であることを確認
    const currentUrl = page.url();
    expect(
      currentUrl.includes('scr-1789461783315') || currentUrl.includes('scr-1789461798629')
    ).toBeTruthy();

    // 配置案のステータスが「実行中」のままであることを確認
    const updatedStatusText = await executingProposalElement.textContent();
    expect(updatedStatusText).toContain('実行中');
  });
});