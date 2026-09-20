import { test, expect } from '@playwright/test';

test('SCEN-985: エラー系：入力された作業者と作業日に対応する配置計画が存在しないと、配置計画取得段階で記録されない', async ({ page }) => {
  // ログイン前のアクセス時に認証画面へリダイレクトされることを前提に、ログイン画面へアクセス
  await page.goto('/');
  
  // ログイン処理
  await page.fill('input[name="userId"]', 'testuser');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // ログイン後、自動遷移が完了するまで待機
  await page.waitForNavigation();
  
  // 作業実績データ記録・入力画面へ遷移してログイン後に表示されることを確認
  await page.goto('/panels/scr-1789461993203.html');
  await page.waitForLoadState('networkidle');
  
  // 画面が表示されていることを確認
  const formElement = page.locator('[data-field="workerId"]');
  await expect(formElement).toBeVisible();

  // 存在しない作業者IDと作業日を入力
  const nonexistentWorkerId = '999999';
  const workDate = '2025-01-01';
  
  await page.fill('input[data-field="workerId"]', nonexistentWorkerId);
  await page.fill('input[data-field="workDate"]', workDate);

  // 配置計画取得APIのレスポンスをインターセプト
  let planApiResponse = null;
  const responsePromise = page.waitForResponse(response => {
    if (response.url().includes('/api/') && response.url().includes('placement')) {
      planApiResponse = response;
      return true;
    }
    return false;
  });

  // 実績データ保存ボタンをクリック
  await page.click('button:has-text("保存")');

  // 配置計画取得処理が実行され、結果を待機する
  try {
    await responsePromise;
  } catch {
    // タイムアウトの場合も次の検証に進む
  }

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=/配置計画が見つかりません|入力された作業者と作業日に対応する配置計画が存在しません/');
  await expect(errorMessage).toBeVisible({ timeout: 10000 });

  // 配置計画取得APIのレスポンス状態コードが4xx系であることを確認
  if (planApiResponse) {
    const status = planApiResponse.status();
    expect(status).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
  }

  // ローカルストレージに該当する実績データが存在しないことを確認
  const savedLocalData = await page.evaluate(() => {
    const data = localStorage.getItem('workResultData');
    return data ? JSON.parse(data) : null;
  });

  // 保存されたローカルデータに該当レコードが存在しないことを検証
  if (savedLocalData && Array.isArray(savedLocalData)) {
    const isRecorded = savedLocalData.some(
      (record: any) => record.workerId === nonexistentWorkerId && record.workDate === workDate
    );
    expect(isRecorded).toBeFalsy();
  }

  // サーバーサイドのデータベースに該当する実績データが記録されていないことを検証
  const apiUrl = await page.evaluate(() => window.AIVIC_API_URL);
  const appId = await page.evaluate(() => window.AIVIC_APP_ID);
  
  if (apiUrl && appId) {
    const tableId = 'workResult'; // 実績データテーブルのID
    const response = await page.request.get(`${apiUrl}/api/${tableId}?app=${appId}`);
    
    if (response.ok()) {
      const data = await response.json();
      if (data && Array.isArray(data)) {
        const isRecordedInDb = data.some(
          (record: any) => record.workerId === nonexistentWorkerId && record.workDate === workDate
        );
        expect(isRecordedInDb).toBeFalsy();
      }
    }
  }
});