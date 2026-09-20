import { test, expect } from '@playwright/test';

test('SCEN-1292: リスク分析結果確認 - データ欠落時に警告が表示されて処理は継続される', async ({ page, context }) => {
  // ログイン処理
  await page.goto('/');
  await page.waitForURL('**/login**', { timeout: 5000 }).catch(() => {
    // ログイン画面がない場合はスキップ
  });
  
  const loginUrl = page.url();
  if (loginUrl.includes('login')) {
    await page.fill('input[placeholder*="ユーザー"]', 'testuser');
    await page.fill('input[placeholder*="パスワード"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    await page.waitForNavigation();
  }

  // WmsHandyTerminalDataSource のスタブを設定
  // 特定拠点（拠点A）の進捗データを部分欠落させる
  await context.addInitScript(() => {
    const originalFetch = window.fetch;
    (window as any).fetch = async (...args: any[]) => {
      const response = await originalFetch(...args);
      const clonedResponse = response.clone();
      
      let data;
      try {
        data = await clonedResponse.json();
      } catch {
        return response;
      }

      // 拠点Aのデータを部分欠落させる（残数がnull）
      if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            if (item.siteName === '拠点A' || item.siteId === 'site-a') {
              item.remainingCount = null;
            }
          });
        } else if (data.data && Array.isArray(data.data)) {
          data.data.forEach((item: any) => {
            if (item.siteName === '拠点A' || item.siteId === 'site-a') {
              item.remainingCount = null;
            }
          });
        } else if (data.progressData && Array.isArray(data.progressData)) {
          data.progressData.forEach((item: any) => {
            if (item.siteName === '拠点A' || item.siteId === 'site-a') {
              item.remainingCount = null;
            }
          });
        }
      }

      return new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    };

    // RiskPredictionAiAdapterのpredictDelayRiskをモニタリングするためのフラグ
    (window as any)._predictDelayRiskCalledWithIncompleteData = false;
    
    // 元のpredictDelayRiskメソッドをインターセプト
    const originalPredict = (window as any).RiskPredictionAiAdapter?.predictDelayRisk;
    if (originalPredict) {
      (window as any).RiskPredictionAiAdapter.predictDelayRisk = function(data: any) {
        // remainingCountがnullまたは未定義のデータが含まれているかチェック
        if (Array.isArray(data)) {
          const hasIncompleteData = data.some((item: any) => 
            item.remainingCount === null || item.remainingCount === undefined
          );
          if (hasIncompleteData) {
            (window as any)._predictDelayRiskCalledWithIncompleteData = true;
          }
        } else if (data && typeof data === 'object') {
          if (data.remainingCount === null || data.remainingCount === undefined) {
            (window as any)._predictDelayRiskCalledWithIncompleteData = true;
          }
        }
        return originalPredict.apply(this, arguments);
      };
    }
  });

  // ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');

  // ページをリロードしてデータを取得
  await page.reload();
  await page.waitForLoadState('networkidle');

  // WMSから拠点Aのデータが取得されて画面に表示されたことを確認
  const riskAssessmentTable = page.getByTestId('risk-assessment-table');
  await expect(riskAssessmentTable).toBeVisible();
  const tableContent = await page.locator('#risk-assessment-tbody').textContent();
  expect(tableContent).toBeTruthy();
  expect(tableContent).toContain('拠点A');

  // リスク分析実行ボタンを押下
  const optimizeButton = page.getByTestId('optimize-button');
  await optimizeButton.click();
  
  // RiskPredictionAiAdapterの呼び出しと分析完了を待機
  await page.waitForLoadState('networkidle');
  
  // ページレンダリング完了を待機
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // 欠落データを含む状態でpredictDelayRiskが呼び出されたかを確認
  const predictDelayRiskCalledWithIncompleteData = await page.evaluate(() => {
    return (window as any)._predictDelayRiskCalledWithIncompleteData === true;
  });
  expect(predictDelayRiskCalledWithIncompleteData).toBe(true);

  // 警告メッセージが表示されていることを確認
  const warningLocator = page.locator('[role="alert"], .warning, .alert-warning, [class*="warning"]');
  await expect(warningLocator.first()).toBeVisible();

  // 警告メッセージテキストが仕様の形式に合致していることを確認
  const messageText = await warningLocator.first().textContent();
  expect(messageText).toMatch(/拠点A\s*のデータが不完全|拠点A.*データが不完全/);
  expect(messageText).toMatch(/分析結果は参考値/);

  // 警告メッセージが黄色または橙色で強調表示されていることを確認
  const backgroundColor = await warningLocator.first().evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });
  
  // 黄色系または橙色系の背景色であることを確認
  const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  expect(rgbMatch).toBeTruthy();
  
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    // 黄色系: R > 200, G > 150, B < 100
    // 橙色系: R > 200, G > 100 && G < 200, B < 100
    const isYellowOrOrange = 
      (r > 200 && g > 150 && b < 100) ||  // 黄色
      (r > 200 && g > 100 && g < 200 && b < 100);  // 橙色
    expect(isYellowOrOrange).toBe(true);
  }

  // リスク分析結果が表示されていることを確認（分析が継続されていることの確認）
  const riskCountKpi = page.getByTestId('kpi-risk-count');
  await expect(riskCountKpi).toBeVisible();

  // 人員配置提案が表示されていることを確認
  const activePlansKpi = page.getByTestId('kpi-active-plans');
  await expect(activePlansKpi).toBeVisible();

  // テーブルにデータが表示されていることを確認
  await expect(riskAssessmentTable).toBeVisible();

  // 拠点Aの行を特定して、欠落したデータ項目に「-」または「更新待機中」が表記されていることを確認
  const tableRows = page.locator('#risk-assessment-tbody tr');
  let siteARowFound = false;
  const rowCount = await tableRows.count();
  
  for (let i = 0; i < rowCount; i++) {
    const rowText = await tableRows.nth(i).textContent();
    if (rowText && rowText.includes('拠点A')) {
      siteARowFound = true;
      // 拠点Aの行内で「-」または「更新待機中」が含まれていることを確認
      expect(rowText).toMatch(/[-]|更新待機中/);
      break;
    }
  }
  
  expect(siteARowFound).toBe(true);

  // 画面がダッシュボード画面に留まっていることを確認（画面遷移がない）
  expect(page.url()).toContain('scr-1789461783315');

  // ページが正常にレンダリングされていることを確認
  const contentArea = page.locator('.content-area');
  await expect(contentArea).toBeVisible();
});