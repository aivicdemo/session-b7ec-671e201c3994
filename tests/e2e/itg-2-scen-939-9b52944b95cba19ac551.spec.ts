import { test, expect } from '@playwright/test';

test('SCEN-939: 過去3ヶ月間の実績データが10件未満の場合、妥当性判定の信頼度が低い旨の警告が画面に表示される', async ({ page, context }) => {
  // テストデータセットの準備：過去3ヶ月間の実績データが9件の作業者を作成
  const testWorkerId = 'test-worker-' + Date.now();
  const testWorkerName = 'テスト作業者9件';
  
  // テストデータを API で投入
  const apiUrl = (await page.evaluate(() => (window as any).AIVIC_API_URL)) || 'http://localhost:3000/api';
  const appId = (await page.evaluate(() => (window as any).AIVIC_APP_ID)) || 'test-app';
  
  // 過去3ヶ月間のデータを生成（9件）
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  const testRecords = [];
  for (let i = 0; i < 9; i++) {
    const recordDate = new Date(threeMonthsAgo.getTime() + (i * 10 * 24 * 60 * 60 * 1000));
    testRecords.push({
      workerId: testWorkerId,
      workerName: testWorkerName,
      date: recordDate.toISOString().split('T')[0],
      tasksCompleted: Math.floor(Math.random() * 20) + 5,
      hoursWorked: Math.floor(Math.random() * 8) + 2,
    });
  }
  
  // テストデータを API に投入
  for (const record of testRecords) {
    await context.request.post(`${apiUrl}/work-records?app=${appId}`, {
      data: record,
    });
  }
  
  // 最適人員配置案提案・実行画面にアクセスする
  await page.goto('/panels/scr-1789461978707.html');
  
  // 画面が完全にロードされるまで待機
  await page.waitForLoadState('networkidle');
  
  // 過去3ヶ月間の実績データが9件のテストデータセットを持つ作業者を対象とした配置案を表示させる
  // 作業者選択フィールドを探す
  const workerInput = page.locator('input[placeholder*="作業者"], input[name*="worker"], input[data-testid*="worker"]').first();
  
  if (await workerInput.isVisible({ timeout: 5000 })) {
    await workerInput.fill(testWorkerName);
    await page.waitForLoadState('networkidle');
    
    // ドロップダウンオプションが表示されるまで待機
    const option = page.locator(`[role="option"]:has-text("${testWorkerName}"), li:has-text("${testWorkerName}")`).first();
    if (await option.isVisible({ timeout: 5000 })) {
      await option.click();
      await page.waitForLoadState('networkidle');
    }
  }
  
  // 配置案が表示されるまで待機
  await page.waitForLoadState('networkidle');
  const proposalContainer = page.locator('[data-testid*="proposal"], [class*="proposal"], .proposal, [id*="proposal"]').first();
  await expect(proposalContainer).toBeVisible({ timeout: 10000 });
  
  // 配置案の承認ボタンをクリックする前に、画面上に警告メッセージが表示されていることを確認する
  const warningMessage = page.locator(
    'text=/過去3ヶ月間の実績データが10件未満のため、妥当性判定の信頼度が低い可能性があります/'
  );
  
  // 警告メッセージが表示されていることを確認
  await expect(warningMessage).toBeVisible({ timeout: 10000 });
  
  // 警告メッセージの親要素（背景色を持つ要素）を取得
  const warningElement = warningMessage.locator('xpath=ancestor::*[self::div or self::span or self::p][1]');
  
  // 背景色を取得して黄色または赤色のいずれかであることを確認
  const backgroundColor = await warningElement.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });
  
  // RGB値を解析
  const rgbMatch = backgroundColor.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  
  let isWarningColor = false;
  
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    
    // 黄色系：R が高く、G が高く、B が低い
    const isYellow = r > 150 && g > 150 && b < 150;
    
    // 赤色系：R が高く、G と B が低い
    const isRed = r > 150 && g < 150 && b < 150;
    
    isWarningColor = isYellow || isRed;
  }
  
  // backgroundColor に直接 'yellow' または 'red' が含まれる場合も許容
  const hasColorKeyword = backgroundColor.toLowerCase().includes('yellow') || 
                         backgroundColor.toLowerCase().includes('red') ||
                         backgroundColor.toLowerCase().includes('gold') ||
                         backgroundColor.toLowerCase().includes('orange');
  
  expect(isWarningColor || hasColorKeyword).toBeTruthy();
  
  // 承認ボタンが表示されていることを確認（ユーザーが承認処理を進められる状態）
  const approvalButton = page.locator('button:has-text("承認"), button[data-testid*="approve"], button[id*="approve"]').first();
  await expect(approvalButton).toBeVisible({ timeout: 5000 });
});