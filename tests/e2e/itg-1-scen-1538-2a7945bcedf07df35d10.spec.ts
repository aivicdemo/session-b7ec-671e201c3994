import { test, expect } from '@playwright/test';

test('SCEN-1538: 参照整合性を失っている作業指示の受領確認が中断される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  await page.waitForURL(/scr-1789461783315/);
  
  // 作業指示・実績管理画面へ遷移
  await page.click('text=作業指示・実績管理');
  await page.waitForURL(/scr-1789461813941/);

  // テーブル情報を取得
  const apiUrl = await page.evaluate(() => window.AIVIC_API_URL);
  const appId = await page.evaluate(() => window.AIVIC_APP_ID);
  const tables = await page.evaluate(() => window.AIVIC_TABLES);

  // テストデータ準備: 参照整合性を失っている作業指示を準備する
  // 1. まず有効な従業員・拠点・チームを作成
  const workerTableId = tables.find(t => t.tableName === 'workers')?.tableId;
  const siteTableId = tables.find(t => t.tableName === 'sites')?.tableId;
  const teamTableId = tables.find(t => t.tableName === 'teams')?.tableId;
  const workInstructionTableId = tables.find(t => t.tableName === 'work_instructions')?.tableId;

  const testWorkerId = 'WORKER_' + Date.now();
  const testSiteId = 'SITE_' + Date.now();
  const testTeamId = 'TEAM_' + Date.now();
  const testInstructionId = 'INSTR_' + Date.now();

  // 有効なマスタデータを作成
  if (workerTableId && siteTableId && teamTableId) {
    await page.request.post(`${apiUrl}/api/${workerTableId}?app=${appId}`, {
      data: {
        id: testWorkerId,
        name: 'Test Worker',
        created_at: new Date().toISOString()
      }
    });

    await page.request.post(`${apiUrl}/api/${siteTableId}?app=${appId}`, {
      data: {
        id: testSiteId,
        name: 'Test Site',
        created_at: new Date().toISOString()
      }
    });

    await page.request.post(`${apiUrl}/api/${teamTableId}?app=${appId}`, {
      data: {
        id: testTeamId,
        name: 'Test Team',
        created_at: new Date().toISOString()
      }
    });
  }

  // 2. 作業指示を作成（有効な参照で）
  if (workInstructionTableId) {
    await page.request.post(`${apiUrl}/api/${workInstructionTableId}?app=${appId}`, {
      data: {
        id: testInstructionId,
        worker_id: testWorkerId,
        site_id: testSiteId,
        team_id: testTeamId,
        status: '受領確認待ち',
        created_at: new Date().toISOString()
      }
    });
  }

  // 3. 参照整合性を失わせる：作成した従業員を削除
  if (workerTableId) {
    await page.request.delete(`${apiUrl}/api/${workerTableId}/${testWorkerId}?app=${appId}`);
  }

  // 画面をリロードして状態を反映
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 作成したテスト用作業指示が画面に表示されるまで待機
  const testInstructionRow = page.locator(`text=${testInstructionId}`).first().locator('xpath=ancestor::tr');
  await expect(testInstructionRow).toBeVisible({ timeout: 5000 });

  // 操作前の状態を確認：ステータスが『受領確認待ち』であることを確認
  const initialStatusText = await testInstructionRow.textContent();
  expect(initialStatusText).toContain('受領確認待ち');

  // 当該作業指示の『受領確認』ボタンをクリック
  // 受領確認ボタンは作業指示行内のアクションボタン
  const receiptConfirmButton = testInstructionRow.locator('button').filter({ hasText: '確認' }).first();
  await receiptConfirmButton.click();

  // 確認モーダルが表示される場合に対応
  const confirmModal = page.locator('id=receipt-confirmation-overlay');
  if (await confirmModal.isVisible({ timeout: 2000 }).catch(() => false)) {
    const confirmOkButton = page.locator('id=receipt-confirm-ok');
    await confirmOkButton.click();
  }

  // 検証処理が実行され、データベースの参照先テーブルに問い合わせが発生するまで待機
  // エラーバナーが表示されるまで待つ
  const errorBanner = page.locator('id=error-banner');
  await expect(errorBanner).toBeVisible({ timeout: 10000 });

  // システムが参照整合性エラーを検出したことを画面で確認
  const errorMessage = page.locator('id=error-message');
  await expect(errorMessage).toBeVisible();
  
  const errorText = await errorMessage.textContent();
  expect(errorText).toContain('作業指示に紐付く作業者・拠点・チームが正しく参照できません');
  expect(errorText).toContain('管理者に連絡してください');

  // 受領確認は完了せず、作業指示のステータスが『受領確認待ち』のまま変わらないことを確認
  // 画面をリロードして再度確認
  await page.reload();
  await page.waitForLoadState('networkidle');

  const updatedTestInstructionRow = page.locator(`text=${testInstructionId}`).first().locator('xpath=ancestor::tr');
  await expect(updatedTestInstructionRow).toBeVisible({ timeout: 5000 });

  const finalStatusText = await updatedTestInstructionRow.textContent();
  expect(finalStatusText).toContain('受領確認待ち');
  // 状態が変わらないことを確認：初期状態と同じステータスを保持
  expect(initialStatusText).toBe(finalStatusText);

  // クリーンアップ: テスト用データを削除
  if (workInstructionTableId) {
    await page.request.delete(`${apiUrl}/api/${workInstructionTableId}/${testInstructionId}?app=${appId}`);
  }
  if (siteTableId) {
    await page.request.delete(`${apiUrl}/api/${siteTableId}/${testSiteId}?app=${appId}`);
  }
  if (teamTableId) {
    await page.request.delete(`${apiUrl}/api/${teamTableId}/${testTeamId}?app=${appId}`);
  }
});