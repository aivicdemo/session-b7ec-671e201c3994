import { test, expect } from '@playwright/test';

test('SCEN-1099: 却下対象ID または却下理由の入力値が不正な場合、入力値検証段階で失敗して処理が進まない', async ({ page }) => {
  // ログイン処理
  await page.goto('/');
  await page.waitForURL('**/panels/**');
  
  // 最適人員配置案提案・実行画面を開く
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');

  // 配置案却下処理の操作パネルまたはボタンにアクセス
  const rejectButton = page.locator('button:has-text("却下")').first();
  await rejectButton.click();
  
  await page.waitForSelector('[data-testid="reject-dialog"], .reject-dialog, .modal');

  // 初期状態の配置案ステータスを取得
  const initialStatusElements = await page.locator('[data-testid*="status"], .status').allTextContents();
  const initialStatus = initialStatusElements[0] || '';

  // 初期状態の却下履歴件数を取得
  const initialHistoryItems = page.locator('[data-testid*="reject-history"], .reject-history, [class*="history"]');
  const initialHistoryCount = await initialHistoryItems.count();

  // テストケース1: 却下対象IDが空文字列の場合
  await test.step('却下対象IDが空文字列の場合', async () => {
    const targetIdInput = page.locator('input[name="targetId"], [data-testid="target-id-input"]').first();
    const reasonInput = page.locator('textarea[name="reason"], input[name="reason"], [data-testid="reason-input"]').first();
    const executeButton = page.locator('button:has-text("却下を実行"), [data-testid="execute-reject"]').first();

    await targetIdInput.clear();
    await reasonInput.clear();
    await reasonInput.fill('テスト却下理由');
    
    await executeButton.click();

    // 入力値検証エラーメッセージを確認
    const errorMessage = page.locator('text=/却下対象IDが無効です|入力してください/i');
    await expect(errorMessage).toBeVisible();

    // ステータスが変更されていないことを確認
    const currentStatusElements = await page.locator('[data-testid*="status"], .status').allTextContents();
    const currentStatus = currentStatusElements[0] || '';
    expect(currentStatus).toBe(initialStatus);
  });

  // テストケース2: 却下対象IDに特殊文字のみの場合
  await test.step('却下対象IDに特殊文字のみの場合', async () => {
    const targetIdInput = page.locator('input[name="targetId"], [data-testid="target-id-input"]').first();
    const reasonInput = page.locator('textarea[name="reason"], input[name="reason"], [data-testid="reason-input"]').first();
    const executeButton = page.locator('button:has-text("却下を実行"), [data-testid="execute-reject"]').first();

    await targetIdInput.clear();
    await targetIdInput.fill('!@#');
    await reasonInput.clear();
    await reasonInput.fill('テスト却下理由');
    
    await executeButton.click();

    // 入力値検証エラーメッセージを確認
    const errorMessage = page.locator('text=/却下対象IDが無効です|形式が不正です/i');
    await expect(errorMessage).toBeVisible();

    // ステータスが変更されていないことを確認
    const currentStatusElements = await page.locator('[data-testid*="status"], .status').allTextContents();
    const currentStatus = currentStatusElements[0] || '';
    expect(currentStatus).toBe(initialStatus);
  });

  // テストケース3: 却下対象IDが数字以外の文字列の場合
  await test.step('却下対象IDが数字以外の文字列の場合', async () => {
    const targetIdInput = page.locator('input[name="targetId"], [data-testid="target-id-input"]').first();
    const reasonInput = page.locator('textarea[name="reason"], input[name="reason"], [data-testid="reason-input"]').first();
    const executeButton = page.locator('button:has-text("却下を実行"), [data-testid="execute-reject"]').first();

    await targetIdInput.clear();
    await targetIdInput.fill('ABC');
    await reasonInput.clear();
    await reasonInput.fill('テスト却下理由');
    
    await executeButton.click();

    // 入力値検証エラーメッセージを確認
    const errorMessage = page.locator('text=/却下対象IDが無効です|数字|形式が不正です/i');
    await expect(errorMessage).toBeVisible();

    // ステータスが変更されていないことを確認
    const currentStatusElements = await page.locator('[data-testid*="status"], .status').allTextContents();
    const currentStatus = currentStatusElements[0] || '';
    expect(currentStatus).toBe(initialStatus);
  });

  // テストケース4: 却下理由が空文字列の場合
  await test.step('却下理由が空文字列の場合', async () => {
    const targetIdInput = page.locator('input[name="targetId"], [data-testid="target-id-input"]').first();
    const reasonInput = page.locator('textarea[name="reason"], input[name="reason"], [data-testid="reason-input"]').first();
    const executeButton = page.locator('button:has-text("却下を実行"), [data-testid="execute-reject"]').first();

    await targetIdInput.clear();
    await targetIdInput.fill('123');
    await reasonInput.clear();
    
    await executeButton.click();

    // 却下理由の入力値検証エラーメッセージを確認
    const errorMessage = page.locator('text=/却下理由の入力形式が不正です|却下理由を入力してください|入力してください/i');
    await expect(errorMessage).toBeVisible();

    // ステータスが変更されていないことを確認
    const currentStatusElements = await page.locator('[data-testid*="status"], .status').allTextContents();
    const currentStatus = currentStatusElements[0] || '';
    expect(currentStatus).toBe(initialStatus);
  });

  // テストケース5: 却下理由に制御文字が含まれている場合
  await test.step('却下理由に制御文字が含まれている場合', async () => {
    const targetIdInput = page.locator('input[name="targetId"], [data-testid="target-id-input"]').first();
    const reasonInput = page.locator('textarea[name="reason"], input[name="reason"], [data-testid="reason-input"]').first();
    const executeButton = page.locator('button:has-text("却下を実行"), [data-testid="execute-reject"]').first();

    await targetIdInput.clear();
    await targetIdInput.fill('456');
    await reasonInput.clear();
    await reasonInput.fill('理由\x00\x01');
    
    await executeButton.click();

    // 却下理由の入力値検証エラーメッセージを確認
    const errorMessage = page.locator('text=/却下理由の入力形式が不正です|許可されていない文字/i');
    await expect(errorMessage).toBeVisible();

    // ステータスが変更されていないことを確認
    const currentStatusElements = await page.locator('[data-testid*="status"], .status').allTextContents();
    const currentStatus = currentStatusElements[0] || '';
    expect(currentStatus).toBe(initialStatus);
  });

  // 処理が実行されていないことを確認
  await test.step('却下処理が実行されていないことを確認', async () => {
    // ダイアログをクローズ
    const closeButton = page.locator('button:has-text("キャンセル"), button[aria-label="Close"]').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }

    // 配置案提案・実行画面に留まっていることを確認
    await expect(page).toHaveURL('**/scr-1789461978707.html');

    // 配置案ステータスが変更されていないことを確認
    const currentStatusElements = await page.locator('[data-testid*="status"], .status').allTextContents();
    const currentStatus = currentStatusElements[0] || '';
    expect(currentStatus).toBe(initialStatus);

    // 却下履歴に新しい記録が追加されていないことを確認
    const finalHistoryItems = page.locator('[data-testid*="reject-history"], .reject-history, [class*="history"]');
    const finalHistoryCount = await finalHistoryItems.count();
    expect(finalHistoryCount).toBe(initialHistoryCount);
  });
});