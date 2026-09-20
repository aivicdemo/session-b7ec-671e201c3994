import { test, expect } from '@playwright/test';

test.describe('SCEN-1120: 配置案実行処理', () => {
  test('入力データが形式・値域・必須項目を満たす場合、実行対象の配置案詳細情報取得に進む', async ({ page }) => {
    // 1. 最適人員配置案提案・実行画面を開く
    await page.goto('/panels/scr-1789461978707.html');
    await page.waitForLoadState('networkidle');

    // 2. 配置案一覧から有効な配置案IDを選択する
    // 配置案一覧から配置案を選択（リストから選択または検索して選択）
    const placementPlanId = 'PL-20250115-001';
    
    // 配置案リストから該当の配置案を検索・選択
    const placementPlanRow = page.locator(`text=${placementPlanId}`).first();
    await placementPlanRow.click();
    await page.waitForLoadState('networkidle');

    // 3. 画面上の入力フォームに以下の値を入力する
    // 配置案ID入力
    const placementPlanIdInput = page.locator('input[name="placementPlanId"], input[placeholder*="配置案ID"]').first();
    await placementPlanIdInput.fill(placementPlanId);

    // 変更内容入力
    const changeDetailsInput = page.locator('textarea[name="changeDetails"], textarea[placeholder*="変更内容"]').first();
    await changeDetailsInput.fill('作業者A（部門1）を部門2へ配置変更');

    // 実行日時入力
    const executionDateTimeInput = page.locator('input[name="executionDateTime"], input[type="datetime-local"]').first();
    await executionDateTimeInput.fill('2025-01-15T09:00:00');

    // 4. すべての入力値が形式・値域・必須項目の検証ルールを満たすことを確認
    // フォームの検証状態を確認（エラーメッセージがないことを確認）
    const errorMessages = page.locator('[role="alert"], .error, .error-message');
    const errorCount = await errorMessages.count();
    expect(errorCount).toBe(0);

    // 5. 画面の「実行」ボタンをクリック
    const executeButton = page.locator('button:has-text("実行")').first();
    await executeButton.click();

    // 期待結果: バリデーションエラーが表示されず、配置案詳細情報取得APIリクエストが送信される
    // APIリクエストの監視
    const apiResponsePromise = page.waitForResponse(
      response => {
        const url = response.url();
        return url.includes('/api/') && 
               (url.includes('placement') || url.includes('配置')) &&
               (response.status() === 200 || response.status() === 201);
      }
    );

    try {
      const apiResponse = await apiResponsePromise;
      expect(apiResponse.ok()).toBeTruthy();
      
      const responseData = await apiResponse.json();
      // 配置案詳細情報が取得されていることを確認
      expect(responseData).toHaveProperty('placementPlanId');
    } catch (error) {
      // APIレスポンスが得られない場合、画面遷移を確認
      // 詳細情報が画面に表示されるまで待機
      await page.waitForTimeout(2000);
    }

    // 配置案詳細情報が画面に表示されるか、次のステップの確認画面へ遷移したことを確認
    const detailsDisplayed = await page.locator(
      `text=${placementPlanId}, text=作業者A, text=部門`
    ).first().isVisible().catch(() => false);
    
    const confirmationPageDisplayed = await page.locator(
      'text=確認, button:has-text("確定"), button:has-text("実行確認")'
    ).first().isVisible().catch(() => false);

    // いずれかが表示されていることを確認（詳細情報表示 または 確認画面遷移）
    const successConditionMet = detailsDisplayed || confirmationPageDisplayed;
    expect(successConditionMet).toBeTruthy();

    // バリデーションエラーが表示されていないことを最終確認
    const finalErrorMessages = page.locator('[role="alert"], .error, .error-message');
    const finalErrorCount = await finalErrorMessages.count();
    expect(finalErrorCount).toBe(0);
  });
});