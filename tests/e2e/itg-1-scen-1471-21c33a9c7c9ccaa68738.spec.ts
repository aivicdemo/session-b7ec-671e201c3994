import { test, expect } from '@playwright/test';

test('SCEN-1471: セッション有効なユーザーが画面表示権限を持つとき、ユーザーの拠点・チーム権限に基づいた作業指示が取得される', async ({ page, context }) => {
  // テストユーザーに権限を付与するための前提処理
  const testUserId = 'testuser_scen1471';
  const testUserPassword = 'TestPass123!';
  
  // ページで AIVIC_API_URL と AIVIC_APP_ID を取得
  await page.goto('/');
  
  const apiUrlFromPage = await page.evaluate(() => (window as any).AIVIC_API_URL || 'http://localhost:3000/api');
  const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID || 'app-default');
  
  // テストユーザーを作成するAPI呼び出し
  const createUserResponse = await page.context().request.post(`${apiUrlFromPage}/test-setup/create-user`, {
    data: {
      userId: testUserId,
      password: testUserPassword,
      userName: 'テストユーザー',
      siteId: 'kanto-logistics-center',
      teamId: 'picking-team-a'
    }
  });
  
  // ユーザー作成が成功したことを確認
  expect(createUserResponse.ok()).toBeTruthy();
  
  // テストユーザーに権限を付与するAPI呼び出し
  const grantPermissionsResponse = await page.context().request.post(`${apiUrlFromPage}/test-setup/grant-permissions`, {
    data: {
      userId: testUserId,
      permissions: ['work-instruction-management-screen-display'],
      sitePermission: 'kanto-logistics-center',
      teamPermission: 'picking-team-a'
    }
  });
  
  // 権限付与が成功したことを確認
  expect(grantPermissionsResponse.ok()).toBeTruthy();
  
  // テストユーザーでログイン
  await page.goto('/');
  
  // ログインフォームに入力
  const userInputs = await page.locator('input[type="text"]');
  const passwordInputs = await page.locator('input[type="password"]');
  
  await userInputs.first().fill(testUserId);
  await passwordInputs.first().fill(testUserPassword);
  
  // ログインボタンをクリック
  await page.click('button:has-text("ログイン")');
  
  // ログイン後の自動遷移を待つ
  await page.waitForURL('**/panels/scr-1789461783315.html', { timeout: 10000 });
  
  // セッション有効を確認（右上のユーザー識別情報を確認）
  const userArea = page.locator('.shell-user-area');
  await expect(userArea).toBeVisible();
  
  // ユーザー名が表示されていることを確認
  const userName = page.locator('.shell-user-name');
  await expect(userName).toBeVisible();
  
  const userNameText = await userName.textContent();
  expect(userNameText).toBeTruthy();
  
  // 作業指示・実績管理画面へ遷移
  await page.click('a[href*="scr-1789461813941"]');
  await page.waitForURL('**/panels/scr-1789461813941.html', { timeout: 10000 });
  
  // 画面が正常に読み込まれたことを確認
  const contentArea = page.locator('.content-area');
  await expect(contentArea).toBeVisible();
  
  // エラーメッセージが表示されていないことを確認
  const errorBanner = page.locator('#error-banner');
  await expect(errorBanner).not.toBeVisible();
  
  // 権限エラーメッセージが表示されていないことを確認
  const errorMessage = page.locator('text=/権限|表示権限|アクセス権限/i');
  await expect(errorMessage).not.toBeVisible();
  
  // セッション無効メッセージが表示されていないことを確認
  const sessionError = page.locator('text=/セッション無効|セッションが切れ|ログインしてください/i');
  await expect(sessionError).not.toBeVisible();
  
  // 作業指示一覧テーブルが表示されていることを確認
  const workInstructionList = page.locator('#work-instruction-tbody');
  await expect(workInstructionList).toBeVisible();
  
  // テーブルに行が存在することを確認
  const rows = page.locator('#work-instruction-tbody tr');
  const rowCount = await rows.count();
  
  expect(rowCount).toBeGreaterThan(0);
  
  // 表示された作業指示がテストユーザーの拠点・チーム権限に基づいて絞り込まれていることを確認
  // API経由でテストユーザーの権限に該当する作業指示を取得し、画面に表示されている指示と対比
  const workInstructionsResponse = await page.context().request.get(
    `${apiUrlFromPage}/work-instructions?app=${appId}&siteId=kanto-logistics-center&teamId=picking-team-a`
  );
  
  expect(workInstructionsResponse.ok()).toBeTruthy();
  
  const expectedWorkInstructions = await workInstructionsResponse.json();
  
  // 画面に表示されている各行の指示IDを取得
  const displayedInstructionIds: string[] = [];
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const cells = row.locator('td');
    
    // 最初のセル（指示ID）のテキストを取得
    const firstCellText = await cells.first().textContent();
    if (firstCellText) {
      displayedInstructionIds.push(firstCellText.trim());
    }
  }
  
  // 表示されている指示がすべて権限対象のものであることを確認
  const authorizedInstructionIds = expectedWorkInstructions.map((instr: any) => instr.instructionId);
  
  for (const displayedId of displayedInstructionIds) {
    expect(authorizedInstructionIds).toContain(displayedId);
  }
  
  // セッション有効ユーザーの識別情報が表示されていることを最終確認
  await expect(userName).toBeVisible();
  
  // ログアウト（テストデータクリーンアップ）
  await page.click('.shell-user-logout');
  
  // ログアウト後、ログイン画面に遷移することを確認
  await page.waitForURL('/', { timeout: 5000 });
  
  // テストユーザーを削除するAPI呼び出し
  const deleteUserResponse = await page.context().request.post(`${apiUrlFromPage}/test-setup/delete-user`, {
    data: {
      userId: testUserId
    }
  });
  
  // ユーザー削除が成功したことを確認
  expect(deleteUserResponse.ok()).toBeTruthy();
});