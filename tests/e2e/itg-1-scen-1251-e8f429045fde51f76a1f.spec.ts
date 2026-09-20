import { test, expect } from '@playwright/test';

test.describe('SCEN-1251: 進捗遅延リスク分析実行', () => {
  test('リスク分析実行時に進捗データの取得に失敗すると、エラーメッセージが表示されて以降の工程が中断される', async ({ page, context }) => {
    // ネットワークエラーをシミュレートするため、API呼び出しをインターセプト
    let progressDataFetchAttempted = false;
    
    await context.route('**/api/**', async (route) => {
      const url = route.request().url();
      // 進捗データ取得エンドポイントをブロック
      if (url.includes('progress') || url.includes('data')) {
        progressDataFetchAttempted = true;
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // リスク分析の実行ボタン（最適化ボタン）をクリック
    const optimizeButton = page.getByTestId('optimize-button');
    await expect(optimizeButton).toBeVisible();
    await optimizeButton.click();

    // リスク分析処理が進捗データ取得を試みたことを確認
    await page.waitForTimeout(1000);
    expect(progressDataFetchAttempted).toBe(true);

    // 進捗・人員配置ダッシュボード画面に『進捗データの更新に遅延が発生しています。最後の更新：○分前』というエラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=/進捗データの更新に遅延が発生しています。最後の更新：\\d+分前/');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // エラーメッセージの正確な内容を検証
    const errorText = await errorMessage.textContent();
    expect(errorText).toMatch(/進捗データの更新に遅延が発生しています。最後の更新：\d+分前/);

    // 画面上に『データ更新待機中』という状態表示が表示されて残っていることを確認
    const statusDisplay = page.locator('text=データ更新待機中');
    await expect(statusDisplay).toBeVisible({ timeout: 10000 });

    // AI判定が実行されていないことを確認（リスク評価テーブルの行数が変わらない）
    const riskAssessmentTable = page.getByTestId('risk-assessment-table');
    const initialRiskRows = await riskAssessmentTable.locator('tbody tr').count();
    
    // 配置案生成が実行されていないことを確認（アクティブプランテーブルの行数が変わらない）
    const activePlansTable = page.getByTestId('active-plans-table');
    const initialActivePlanRows = await activePlansTable.locator('tbody tr').count();
    
    // 通知配信が実行されていないことを確認（配信履歴テーブルの行数が変わらない）
    const deliveryHistoryTable = page.getByTestId('delivery-history-table');
    const initialDeliveryRows = await deliveryHistoryTable.locator('tbody tr').count();

    // 処理中断の状態を保持していることを確認
    await page.waitForTimeout(2000);

    const finalRiskRows = await riskAssessmentTable.locator('tbody tr').count();
    const finalActivePlanRows = await activePlansTable.locator('tbody tr').count();
    const finalDeliveryRows = await deliveryHistoryTable.locator('tbody tr').count();

    // AI判定が実行されなかった
    expect(finalRiskRows).toBe(initialRiskRows);
    
    // 配置案生成が実行されなかった
    expect(finalActivePlanRows).toBe(initialActivePlanRows);
    
    // 通知配信が実行されなかった
    expect(finalDeliveryRows).toBe(initialDeliveryRows);

    // エラーメッセージとデータ更新待機中の状態が画面上に残っていることを最終確認
    await expect(errorMessage).toBeVisible();
    await expect(statusDisplay).toBeVisible();
  });
});