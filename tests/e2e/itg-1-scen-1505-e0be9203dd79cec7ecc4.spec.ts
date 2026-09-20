import { test, expect } from '@playwright/test';

test('SCEN-1505: WES送信の許容遅延値が5秒以内のとき、データはWESに進行で送信される', async ({ page }) => {
  // 作業指示・実績管理画面を開く
  await page.goto('/panels/scr-1789461813941.html');
  await page.waitForLoadState('networkidle');

  // ネットワークリクエストの監視を設定
  let wesResponse: any = null;
  let wesRequestTimings: any = null;

  // リクエスト送信とレスポンス受信を監視
  const responsePromise = page.waitForEvent('response', (response) => {
    if (response.url().includes('/api/wes')) {
      wesResponse = response;
      return true;
    }
    return false;
  });

  // ハンディターミナル側から作業実績データが自動的に送信されるのを待つ
  // 実績データが入力フィールドに表示されたことを確認
  await page.waitForFunction(
    () => {
      const instructionIdInput = document.querySelector('input[id="perf-work-instruction-id"]') as HTMLInputElement;
      const quantityInput = document.querySelector('input[id="perf-quantity"]') as HTMLInputElement;
      const timestampInput = document.querySelector('input[id="perf-end-datetime"]') as HTMLInputElement;
      
      return instructionIdInput?.value && quantityInput?.value && timestampInput?.value;
    },
    { timeout: 10000 }
  );

  // 作業実績データが入力フィールドに表示されたことを確認
  const displayedWorkInstructionId = await page.inputValue('input[id="perf-work-instruction-id"]');
  const displayedQuantity = await page.inputValue('input[id="perf-quantity"]');
  const displayedTimestamp = await page.inputValue('input[id="perf-end-datetime"]');
  
  expect(displayedWorkInstructionId).toBeTruthy();
  expect(displayedQuantity).toBeTruthy();
  expect(displayedTimestamp).toBeTruthy();

  // 「WESに送信」ボタンをクリック
  const wesButton = page.locator('button:has-text("WESに送信")');
  await expect(wesButton).toBeVisible();
  await wesButton.click();

  // WESへのレスポンスを待機
  await responsePromise;

  // ネットワークリクエストのタイミング情報を取得
  if (wesResponse) {
    // HAR形式のタイミングデータを取得
    const request = wesResponse.request();
    const harEntry = await page.context().tracing.start?.({ screenshots: false, snapshots: false }) || null;
    
    // ブラウザのパフォーマンスAPI経由でネットワークタイミングを取得
    const timingData = await page.evaluate((url: string) => {
      const entries = (performance as any).getEntriesByName(url, 'resource');
      if (entries.length > 0) {
        const entry = entries[entries.length - 1];
        return {
          startTime: entry.startTime,
          responseEnd: entry.responseEnd,
          duration: entry.responseEnd - entry.startTime
        };
      }
      return null;
    }, request.url());

    // リクエスト送信時刻からレスポンス受信時刻までの経過時間を確認
    if (timingData) {
      expect(timingData.duration).toBeLessThanOrEqual(5000);
    }
  }

  // 画面上の処理状態が「送信完了」に遷移することを確認
  await page.waitForFunction(
    () => {
      const statusElement = document.querySelector('[id="perf-status"]');
      return statusElement && statusElement.textContent?.includes('送信完了');
    },
    { timeout: 15000 }
  );

  // ネットワークリクエストのレスポンスステータスが200番台を返すことを確認
  expect(wesResponse).not.toBeNull();
  if (wesResponse) {
    expect(wesResponse.status()).toBeGreaterThanOrEqual(200);
    expect(wesResponse.status()).toBeLessThan(300);
  }

  // 画面上の処理状態が「送信完了」と表示されていることを確認
  const statusMessage = await page.locator('[id="perf-status"]').textContent();
  expect(statusMessage).toContain('送信完了');
});