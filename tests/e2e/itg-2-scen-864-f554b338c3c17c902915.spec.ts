import { test, expect } from '@playwright/test';

test('SCEN-864: ハンディターミナルからのリアルタイムデータ送信が許容遅延値以内で完了する場合、WES・WMSとの同期が正常に進行する', async ({ page }) => {
  // 作業実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  await page.waitForLoadState('networkidle');

  // テスト用作業実績データを入力
  const testData = {
    workerId: 'W001',
    taskType: '梱包',
    department: '物流部',
    resultTime: '120'
  };

  await test.step('テスト用作業実績データを入力する', async () => {
    const workerIdInput = page.locator('input[name="workerId"], input[id*="worker"], input[placeholder*="作業者"]').first();
    await workerIdInput.fill(testData.workerId);

    const taskTypeSelect = page.locator('select[name="taskType"], select[id*="task"], input[placeholder*="作業タイプ"]').first();
    await taskTypeSelect.selectOption(testData.taskType);

    const departmentSelect = page.locator('select[name="department"], select[id*="department"], input[placeholder*="部門"]').first();
    await departmentSelect.selectOption(testData.department);

    const resultTimeInput = page.locator('input[name="resultTime"], input[id*="result"], input[placeholder*="実績時間"]').first();
    await resultTimeInput.fill(testData.resultTime);
  });

  // データ送信ボタンを押下し、同期ステータスを監視
  let syncCompleteTime: number | null = null;
  const sendTime = Date.now();

  await test.step('データ送信ボタンを押下し、ハンディターミナルからのデータ送信を開始する', async () => {
    const sendButton = page.locator('button:has-text("送信"), button[type="submit"]').first();
    
    // 同期ステータスが「同期完了」に変わるのを監視するプロミス
    const syncStatusPromise = page.waitForFunction(
      () => {
        const element = document.body.innerText;
        return element.includes('同期完了');
      },
      { timeout: 4000 }
    ).then(() => {
      syncCompleteTime = Date.now();
    });

    await sendButton.click();
    await syncStatusPromise;
  });

  // 送信後、同期ステータスの表示変化を監視し、4秒以内に「同期完了」が表示されることを確認
  await test.step('送信後、作業実績データ記録・入力画面上で同期ステータスの表示変化を監視する', async () => {
    const syncStatus = page.locator('text=/同期完了/').first();
    
    // 4秒以内に「同期完了」が表示されることを確認
    await expect(syncStatus).toBeVisible({ timeout: 4000 });
    
    // 4秒以内に同期が完了したことを検証
    if (syncCompleteTime !== null) {
      const elapsedTime = syncCompleteTime - sendTime;
      expect(elapsedTime).toBeLessThanOrEqual(4000);
    }
  });

  // 生産性ダッシュボード・分析画面に遷移
  await test.step('生産性ダッシュボード・分析画面に遷移し、送信したデータが反映されているかを確認する', async () => {
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');

    // 送信したデータが関連データとして表示されていることを確認
    // 作業者IDを含む行または記録を探す
    const workerIdLocator = page.locator(`text=${testData.workerId}`);
    await expect(workerIdLocator).toBeVisible();

    // 同じコンテキスト内で作業タイプ、部門、実績時間が表示されていることを確認
    const recordContainer = workerIdLocator.locator('xpath=ancestor::tr | ancestor::div[@class*="record"] | ancestor::div[@class*="item"] | ancestor::div[@class*="row"]').first();
    await expect(recordContainer.locator(`text=${testData.taskType}`)).toBeVisible();
    await expect(recordContainer.locator(`text=${testData.department}`)).toBeVisible();
    await expect(recordContainer.locator(`text=${testData.resultTime}`)).toBeVisible();
  });
});