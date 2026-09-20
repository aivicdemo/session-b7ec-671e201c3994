import { test, expect } from '@playwright/test';

test('SCEN-951: 配置案実行後、作業者Aのハンディターミナル作業指示が新しい配置に基づいて更新される', async ({ page, context }) => {
  // ステップ1: 最適人員配置案提案・実行画面にアクセスし、承認済みの配置案を表示する
  await page.goto('/panels/scr-1789461978707.html');
  await expect(page).toHaveTitle(/作業管理システム/);
  
  // 承認済みの配置案が表示されるまで待機
  await page.waitForSelector('[data-testid="approved-deployment-plan"]', { timeout: 10000 });
  const approvedPlanVisible = await page.isVisible('[data-testid="approved-deployment-plan"]');
  expect(approvedPlanVisible).toBe(true);

  // ステップ2: 配置案に含まれる作業者Aの配置先を「ピッキングエリア」から「梱包エリア」に変更する内容を確認する
  const workerAPickingText = await page.textContent('[data-testid="worker-a-current-area"]');
  expect(workerAPickingText).toContain('ピッキングエリア');
  
  const workerANewAreaText = await page.textContent('[data-testid="worker-a-new-area"]');
  expect(workerANewAreaText).toContain('梱包エリア');

  // ステップ3: 「実行」ボタンをクリックして配置変更を確定する
  await page.click('[data-testid="execute-deployment-button"]');

  // ステップ4: 画面にメッセージ「配置変更内容をWES・WMSに送信しています」が表示されることを確認する
  await page.waitForSelector('[data-testid="sending-message"]', { timeout: 10000 });
  const sendingMessageVisible = await page.isVisible('[data-testid="sending-message"]');
  expect(sendingMessageVisible).toBe(true);
  const sendingMessage = await page.textContent('[data-testid="sending-message"]');
  expect(sendingMessage).toContain('配置変更内容をWES・WMSに送信しています');

  // ステップ5: 配置実行完了メッセージが画面に表示される
  const completionMessage = await page.waitForSelector('[data-testid="completion-message"]', { timeout: 15000 });
  expect(completionMessage).toBeTruthy();
  const completionText = await completionMessage.textContent();
  expect(completionText).toMatch(/実行完了|完了|成功/);

  // ステップ6: ハンディターミナル画面を開き、作業者Aでログインする
  const handiTerminalPage = await context.newPage();
  await handiTerminalPage.goto('/panels/scr-1789461993203.html');
  
  // ログイン画面が表示されていることを確認
  await handiTerminalPage.waitForSelector('[data-testid="login-user-id"]', { timeout: 10000 });
  const loginFormVisible = await handiTerminalPage.isVisible('[data-testid="login-user-id"]');
  expect(loginFormVisible).toBe(true);
  
  // ハンディターミナルのログイン画面で作業者A（ユーザーID: A）でログイン
  await handiTerminalPage.fill('[data-testid="login-user-id"]', 'A');
  
  // パスワード入力フィールドが存在する場合に入力
  const passwordFieldExists = await handiTerminalPage.isVisible('[data-testid="login-password"]');
  if (passwordFieldExists) {
    await handiTerminalPage.fill('[data-testid="login-password"]', '');
  }
  
  await handiTerminalPage.click('[data-testid="login-submit"]');
  
  // ログイン完了を待機
  await handiTerminalPage.waitForNavigation({ timeout: 10000 });

  // ステップ7: ハンディターミナル画面に表示される作業指示が「梱包エリア」の指示（梱包対象商品リスト）に更新されていることを確認する
  // 旧配置の「ピッキングエリア」の指示が表示されていないことを確認
  const pickingAreaElement = handiTerminalPage.locator('[data-testid="assigned-work-area"]:has-text("ピッキングエリア")');
  await expect(pickingAreaElement).not.toBeVisible();
  
  // 新配置の「梱包エリア」の指示が表示されていることを確認
  const packingAreaElement = handiTerminalPage.locator('[data-testid="assigned-work-area"]:has-text("梱包エリア")');
  await expect(packingAreaElement).toBeVisible();
  
  // 梱包対象商品リストが表示されていることを確認
  const packingProductList = handiTerminalPage.locator('[data-testid="packing-product-list"]');
  await expect(packingProductList).toBeVisible();
  
  // 梱包対象商品リストの内容を取得して、商品情報が正しく表示されていることを確認
  const productListContent = await packingProductList.textContent();
  expect(productListContent).toBeTruthy();
  expect(productListContent).toMatch(/商品|SKU|数量/);

  await handiTerminalPage.close();
});