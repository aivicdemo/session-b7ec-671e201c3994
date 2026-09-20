import { test, expect } from '@playwright/test';

test('SCEN-883: 指示到達から実行開始まで30分以上経過している場合、警告ステータスと警告メッセージが記録される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  await page.waitForURL(/\/panels\/scr-[0-9]+\.html/);
  
  // 実績データ記録入力画面へアクセス
  await page.goto('/panels/scr-1789461993203.html');
  await page.waitForLoadState('networkidle');

  // 指示到達時刻を設定
  const instructionArrivalTimeSelectors = [
    'input[name="instructionArrivalTime"]',
    'input[placeholder*="指示"]',
    'input[aria-label*="指示"]'
  ];
  let instructionArrivalTimeSet = false;
  for (const selector of instructionArrivalTimeSelectors) {
    if (await page.locator(selector).count() > 0) {
      const input = page.locator(selector).first();
      const type = await input.getAttribute('type');
      if (type === 'datetime-local') {
        await input.fill('2024-01-15T09:00');
      } else {
        await input.fill('2024-01-15 09:00:00');
      }
      instructionArrivalTimeSet = true;
      break;
    }
  }
  
  // 実行開始時刻を設定（指示到達から30分経過）
  const executionStartTimeSelectors = [
    'input[name="executionStartTime"]',
    'input[placeholder*="実行開始"]',
    'input[aria-label*="実行開始"]'
  ];
  let executionStartTimeSet = false;
  for (const selector of executionStartTimeSelectors) {
    if (await page.locator(selector).count() > 0) {
      const input = page.locator(selector).first();
      const type = await input.getAttribute('type');
      if (type === 'datetime-local') {
        await input.fill('2024-01-15T09:30');
      } else {
        await input.fill('2024-01-15 09:30:00');
      }
      executionStartTimeSet = true;
      break;
    }
  }
  
  // 作業タイプを入力
  const workTypeSelectors = ['select[name="workType"]', 'input[placeholder*="作業タイプ"]', '[data-testid="workType"]'];
  for (const selector of workTypeSelectors) {
    if (await page.locator(selector).count() > 0) {
      const element = page.locator(selector).first();
      const tagName = await element.evaluate(el => el.tagName);
      if (tagName === 'SELECT') {
        await element.selectOption('通常作業');
      } else {
        await element.fill('通常作業');
      }
      break;
    }
  }
  
  // 部門を入力
  const departmentSelectors = ['select[name="department"]', 'input[placeholder*="部門"]', '[data-testid="department"]'];
  for (const selector of departmentSelectors) {
    if (await page.locator(selector).count() > 0) {
      const element = page.locator(selector).first();
      const tagName = await element.evaluate(el => el.tagName);
      if (tagName === 'SELECT') {
        await element.selectOption('製造部');
      } else {
        await element.fill('製造部');
      }
      break;
    }
  }
  
  // その他必須項目を入力（存在する場合）
  const requiredInputs = page.locator('input[required], select[required], textarea[required]');
  const count = await requiredInputs.count();
  for (let i = 0; i < count; i++) {
    const input = requiredInputs.nth(i);
    const type = await input.getAttribute('type');
    const tagName = await input.evaluate(el => el.tagName);
    
    // すでに入力済みのフィールドはスキップ
    const value = await input.inputValue().catch(() => '');
    if (value) continue;
    
    if (tagName === 'SELECT') {
      const options = await input.locator('option').count();
      if (options > 1) {
        await input.selectOption({ index: 1 });
      }
    } else if (type === 'text' || !type) {
      await input.fill('入力値');
    } else if (type === 'number') {
      await input.fill('1');
    } else if (type === 'datetime-local') {
      await input.fill('2024-01-15T09:00');
    } else if (type === 'date') {
      await input.fill('2024-01-15');
    }
  }
  
  // 送信ボタンクリック前にネットワークレスポンスをキャプチャ
  const responsePromise = page.waitForResponse(response => {
    return response.url().includes('/api/') && (response.status() === 200 || response.status() === 201);
  });
  
  // 送信ボタンをクリック
  const submitButton = page.locator('button:has-text("送信"), button:has-text("保存"), button[type="submit"]').first();
  await submitButton.click();
  
  // ネットワークレスポンスを待機
  const response = await responsePromise;
  const responseData = await response.json();
  
  // レスポンスボディにwarningステータスと警告メッセージが含まれていることを確認
  expect(responseData).toHaveProperty('status');
  expect(responseData.status).toBe('warning');
  expect(responseData).toHaveProperty('warningMessage');
  expect(responseData.warningMessage).toContain('指示受領から実行開始まで時間が経過しています。進捗遅延の可能性があります');
  
  // 記録結果が表示されるまで待機
  await page.waitForLoadState('networkidle');
  
  // 画面上に警告ステータス「warning」が表示されていることを確認
  const statusField = page.locator('[data-testid="status"], [class*="status"], span:has-text("warning")').first();
  await expect(statusField).toContainText('warning');
  
  // 警告メッセージが表示されていることを確認
  const warningMessage = page.locator('text=指示受領から実行開始まで時間が経過しています。進捗遅延の可能性があります');
  await expect(warningMessage).toBeVisible();
});