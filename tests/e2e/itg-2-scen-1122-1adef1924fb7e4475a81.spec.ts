import { test, expect } from '@playwright/test';

test('SCEN-1122: 配置案実行時に初期割当情報が参照され、変更前後の割当状態を比較分析の基準として確保される', async ({ page }) => {
  // ログイン画面にアクセス
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // ログイン処理
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpass');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');

  // ステップ1: 生産性ダッシュボード・分析画面にアクセス
  await test.step('生産性ダッシュボード・分析画面にアクセスし、テスト対象の作業者Aの初期割当情報を確認する', async () => {
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');

    // テスト対象の作業者A（作業者ID: A001）の初期割当情報を確認
    const workerRow = await page.locator('tr', { has: page.locator('text=A001') });
    await expect(workerRow).toBeVisible();

    // 初期割当情報を記録
    const initialDepartment = await workerRow.locator('td').nth(2).textContent();
    const initialTaskId = await workerRow.locator('td').nth(3).textContent();
    const initialAssignmentDate = await workerRow.locator('td').nth(4).textContent();

    expect(initialDepartment).toContain('部門B');
    expect(initialTaskId).toContain('TASK-001');
    expect(initialAssignmentDate).toContain('2025-01-15 09:00');
  });

  // ステップ2: 最適人員配置案提案・実行画面に遷移
  await test.step('最適人員配置案提案・実行画面に遷移し、作業者Aを含む配置案が提案されていることを確認する', async () => {
    await page.goto('/panels/scr-1789461978707.html');
    await page.waitForLoadState('networkidle');

    // 作業者Aを含む配置案を確認
    const workerProposal = await page.locator('text=A001');
    await expect(workerProposal).toBeVisible();
  });

  // ステップ3: 配置案の詳細を開き、作業者Aの提案内容を確認
  await test.step('配置案の詳細を開き、作業者Aの提案内容が表示されていることを確認する', async () => {
    const detailButton = await page.locator('button', { has: page.locator('text=A001') }).first();
    await detailButton.click();
    await page.waitForLoadState('networkidle');

    // 提案内容の確認
    const newDepartment = await page.locator('text=部門C');
    const newTaskId = await page.locator('text=TASK-005');
    const changeReason = await page.locator('text=配置理由');

    await expect(newDepartment).toBeVisible();
    await expect(newTaskId).toBeVisible();
    await expect(changeReason).toBeVisible();
  });

  // ステップ4: 配置案実行ボタンをクリック
  await test.step('配置案実行ボタンをクリックして配置案の実行を開始する', async () => {
    const executeButton = await page.locator('button:has-text("配置案実行")').first();
    await executeButton.click();
    await page.waitForLoadState('networkidle');
  });

  // ステップ5: 実行処理完了メッセージを確認
  await test.step('実行処理が完了し、画面上に配置案実行完了のメッセージが表示されることを確認する', async () => {
    const completionMessage = await page.locator('text=配置案実行完了');
    await expect(completionMessage).toBeVisible();
  });

  // ステップ6: 履歴・追跡セクションで配置変更記録を確認
  await test.step('最適人員配置案提案・実行画面の履歴・追跡セクションを確認し、作業者Aに対する配置変更記録が表示されていることを確認する', async () => {
    const historySection = await page.locator('section', { has: page.locator('text=履歴・追跡') });
    await expect(historySection).toBeVisible();

    const changeRecord = await page.locator('text=A001');
    await expect(changeRecord).toBeVisible();
  });

  // ステップ7: 配置変更記録の詳細を開き、初期状態と変更後状態の両方が同一レコード内に記録されていることを確認
  await test.step('配置変更記録の詳細を開き、初期割当状態と変更後状態の両方が同一レコード内に記録されていることを確認する', async () => {
    const recordDetailButton = await page.locator('button', { has: page.locator('text=A001') }).last();
    await recordDetailButton.click();
    await page.waitForLoadState('networkidle');

    // 配置変更記録レコード要素を取得
    const recordElement = await page.locator('[data-record-type="assignment-change"]').first();
    await expect(recordElement).toBeVisible();

    // レコード要素内のテキストを取得
    const recordText = await recordElement.textContent();

    // 仕様で要求される『初期状態: 部門B/TASK-001 → 変更後: 部門C/TASK-005』形式での記録を確認
    // 同一レコード内に初期状態から変更後状態への遷移が含まれていることを検証
    expect(recordText).toMatch(/初期状態\s*[:：]\s*部門B\s*\/\s*TASK-001\s*→\s*変更後\s*[:：]\s*部門C\s*\/\s*TASK-005/);
    
    // 初期割当日時も同一レコード内に含まれていることを確認
    expect(recordText).toContain('2025-01-15 09:00');
  });
});