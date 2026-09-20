import { test, expect, Page } from '@playwright/test';

test.describe('人員配置案却下', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('人員配置案のステータスが却下状態に更新され、却下日時と却下者情報が記録される', async () => {
    // ログイン画面に遷移
    await page.goto('/');
    await page.waitForURL('**/login.html', { timeout: 10000 }).catch(() => {});

    // ログイン処理（テスト用の認証情報を使用）
    const userIdInput = page.locator('input[name="userId"]');
    const passwordInput = page.locator('input[name="password"]');
    
    if (await userIdInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await userIdInput.fill('testuser');
      await passwordInput.fill('testpass');
      await page.locator('button:has-text("ログイン")').click();
    }

    // 人員配置最適化提案・実行画面へ遷移
    await page.waitForURL('**/scr-1789461798629.html', { timeout: 10000 });
    
    // 初期URL取得
    const initialUrl = page.url();

    // 却下対象の人員配置案が一覧表示されるまで待機
    await page.locator('id=proposals-container').waitFor({ state: 'visible', timeout: 10000 });

    // 一覧から最初の人員配置案を選択（ステータス：提案中）
    const proposalItems = page.locator('id=proposals-container >> div[data-status="提案中"]');
    const proposalCount = await proposalItems.count();
    expect(proposalCount).toBeGreaterThan(0);

    // 最初の提案案を選択
    await proposalItems.first().click();

    // 詳細パネルが表示されるまで待機
    await page.locator('id=proposal-detail-container').waitFor({ state: 'visible', timeout: 5000 });

    // 「却下」ボタンをクリック
    const rejectButton = page.locator('id=reject-btn');
    await rejectButton.click();

    // 却下確認ダイアログが表示されることを確認
    const rejectModal = page.locator('id=reject-modal-overlay');
    await rejectModal.waitFor({ state: 'visible', timeout: 5000 });

    // 却下理由の入力欄が出現していることを確認
    const rejectReasonTextarea = page.locator('id=reject-reason');
    await rejectReasonTextarea.waitFor({ state: 'visible', timeout: 5000 });

    // 却下理由を入力
    const rejectionReason = '現場の体制変更により実行不可';
    await rejectReasonTextarea.fill(rejectionReason);

    // 「確定」ボタンをクリック
    const confirmButton = page.locator('id=reject-modal-confirm');
    await confirmButton.click();

    // ローディング表示が出現することを確認
    const loadingIndicator = page.locator(':text("読込中")');
    await loadingIndicator.waitFor({ state: 'visible', timeout: 5000 });

    // APIレスポンス完了まで待機（ローディング表示が消えるまで）
    await loadingIndicator.waitFor({ state: 'hidden', timeout: 15000 });

    // 詳細パネルのステータス表示が「却下」に更新されたことを確認
    const detailPanel = page.locator('id=proposal-detail-container');
    await detailPanel.waitFor({ state: 'visible', timeout: 5000 });
    
    const detailPanelContent = await detailPanel.textContent();
    expect(detailPanelContent).toContain('却下');

    // 一覧表示のステータスも「却下」に更新されていることを確認
    const proposalListStatus = page.locator('id=proposals-container >> div[data-status="却下"]');
    await expect(proposalListStatus).toBeVisible();

    // 却下日時フィールドの値を抽出して検証
    const detailPanelHTML = await detailPanel.innerHTML();
    const rejectionDatetimePattern = /却下日時[^<]*[:\s]+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}|\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}:\d{2})/;
    const rejectionDatetimeMatch = detailPanelHTML.match(rejectionDatetimePattern);
    
    expect(rejectionDatetimeMatch).toBeTruthy();
    expect(rejectionDatetimeMatch[1]).toMatch(/\d{2}:\d{2}:\d{2}/); // 秒単位を確認

    // 却下者情報フィールドの値を抽出して検証
    const rejectUserPattern = /却下者情報[^<]*[:\s]+([^\s<]+(?:\s[^\s<]+)*)/;
    const rejectUserMatch = detailPanelHTML.match(rejectUserPattern);
    
    expect(rejectUserMatch).toBeTruthy();
    const rejectUserValue = rejectUserMatch[1].trim();
    
    // ユーザー識別情報の検証（メールアドレス形式、ユーザーID、またはユーザー名）
    const isValidEmail = /@/.test(rejectUserValue);
    const isValidUserId = /^[a-zA-Z0-9_\-]+$/.test(rejectUserValue);
    const isValidUserName = /^[\w\s\-]+$/.test(rejectUserValue);
    
    expect(isValidEmail || isValidUserId || isValidUserName).toBeTruthy();
    expect(rejectUserValue.length).toBeGreaterThan(0);

    // 入力した却下理由が詳細パネル内に保持されていることを確認
    expect(detailPanelContent).toContain(rejectionReason);

    // ページ遷移が発生していないことを確認
    const currentUrl = page.url();
    expect(currentUrl).toBe(initialUrl);
  });
});