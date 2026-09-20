import { test, expect } from '@playwright/test';

test('SCEN-870: システム時刻が送信開始時刻より前の場合、警告メッセージが表示される', async ({ page, context }) => {
  // 前提: 作業実績データ記録・入力画面を開く
  await page.goto('/panels/scr-1789461993203.html');
  
  // 作業実績データの入力フォームに必要な値を入力する
  // 作業タイプを入力
  const workTypeInput = page.locator('[data-testid="work-type"], input[name="workType"], select[name="workType"]').first();
  if (await workTypeInput.isVisible()) {
    await workTypeInput.fill('作業タイプA');
  }
  
  // 部門を入力
  const departmentInput = page.locator('[data-testid="department"], input[name="department"], select[name="department"]').first();
  if (await departmentInput.isVisible()) {
    await departmentInput.fill('部門A');
  }
  
  // 作業時間を入力
  const workHoursInput = page.locator('[data-testid="work-hours"], input[name="workHours"]').first();
  if (await workHoursInput.isVisible()) {
    await workHoursInput.fill('8');
  }
  
  // 送信開始時刻を取得（例：2024-01-15 10:00:00と仮定）
  const sendStartTimeElement = page.locator('[data-testid="send-start-time"], [name="sendStartTime"]').first();
  let sendStartTime = '2024-01-15 10:00:00';
  if (await sendStartTimeElement.isVisible()) {
    sendStartTime = (await sendStartTimeElement.inputValue()) || sendStartTime;
  }
  
  // システム時刻を送信開始時刻より前に設定（例：2024-01-15 09:59:00）
  // ブラウザのコンテキストで日時をモック
  await context.addInitScript(() => {
    const originalDate = Date;
    const mockDate = new originalDate('2024-01-15T09:59:00Z');
    
    class MockedDate extends originalDate {
      constructor(...args) {
        if (args.length === 0) {
          super(mockDate.getTime());
        } else {
          super(...args);
        }
      }
    }
    
    MockedDate.now = () => mockDate.getTime();
    MockedDate.parse = originalDate.parse;
    MockedDate.UTC = originalDate.UTC;
    
    Object.setPrototypeOf(MockedDate, originalDate);
    Object.setPrototypeOf(MockedDate.prototype, originalDate.prototype);
    
    (globalThis as any).Date = MockedDate;
  });
  
  // ページをリロードして日時モックを適用
  await page.reload();
  
  // 必要な値を再度入力
  const workTypeInputReload = page.locator('[data-testid="work-type"], input[name="workType"], select[name="workType"]').first();
  if (await workTypeInputReload.isVisible()) {
    await workTypeInputReload.fill('作業タイプA');
  }
  
  const departmentInputReload = page.locator('[data-testid="department"], input[name="department"], select[name="department"]').first();
  if (await departmentInputReload.isVisible()) {
    await departmentInputReload.fill('部門A');
  }
  
  const workHoursInputReload = page.locator('[data-testid="work-hours"], input[name="workHours"]').first();
  if (await workHoursInputReload.isVisible()) {
    await workHoursInputReload.fill('8');
  }
  
  // データ送信ボタンをクリック
  const submitButton = page.locator('button[type="submit"], [data-testid="submit-button"], button:has-text("送信")').first();
  await submitButton.click();
  
  // 期待結果: 警告メッセージが表示される
  const warningMessage = page.locator(
    'text=システム時刻が不正です。NTPサーバーとの同期を確認してください'
  );
  await expect(warningMessage).toBeVisible();
  
  // 期待結果: フォーム入力状態が維持されている（データが送信されていない）
  const workTypeAfterError = page.locator('[data-testid="work-type"], input[name="workType"], select[name="workType"]').first();
  await expect(workTypeAfterError).toHaveValue('作業タイプA');
  
  const departmentAfterError = page.locator('[data-testid="department"], input[name="department"], select[name="department"]').first();
  await expect(departmentAfterError).toHaveValue('部門A');
  
  const workHoursAfterError = page.locator('[data-testid="work-hours"], input[name="workHours"]').first();
  await expect(workHoursAfterError).toHaveValue('8');
});