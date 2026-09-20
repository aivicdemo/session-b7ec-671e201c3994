import { test, expect } from '@playwright/test';

test.describe('リスク分析結果確認', () => {
  test('作業優先順位リストが空のとき、優先順位が設定されていない旨のエラーメッセージが表示される', async ({ page }) => {
    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // リスク分析結果確認機能へアクセスする
    // リスク分析結果確認テーブルが表示されていることを確認
    const riskAssessmentTable = page.locator('#risk-assessment-tbody');
    await expect(riskAssessmentTable).toBeVisible();

    // リスク分析結果確認テーブルを含むカード要素を取得
    const riskAssessmentCard = riskAssessmentTable.locator('xpath=ancestor::*[contains(@class, "card")]').first();
    
    // カード内の更新ボタンを探してクリック、または存在しなければページをリロード
    const refreshButton = riskAssessmentCard.locator('button[aria-label*="更新"], button[title*="更新"], button:has-text("更新"), [class*="refresh"]').first();
    
    if (await refreshButton.isVisible().catch(() => false)) {
      // 更新トリガーボタンがある場合、クリック
      await refreshButton.click();
      await page.waitForLoadState('networkidle');
    } else {
      // 更新ボタンが見つからない場合、ページをリロード
      await page.reload();
      await page.waitForLoadState('networkidle');
    }

    // 画面のエラーメッセージ表示領域を確認する
    const errorMessageText = '作業優先順位が設定されていません。リスク分析を実行するには最低1件以上の作業優先順位の設定が必要です';
    
    // alert要素またはtoast通知のいずれかとしてエラーメッセージが表示されることを確認
    const alertElement = page.locator('alert, [role="alert"], .toast, [class*="toast"], [class*="error"], [class*="message"]').filter({ hasText: errorMessageText });
    
    await expect(alertElement.first()).toBeVisible();

    // リスク分析結果確認エリアが操作不可（グレーアウト）の状態になっていることを確認
    const isDisabled = await riskAssessmentTable.evaluate(el => {
      const style = window.getComputedStyle(el);
      return el.classList.contains('disabled') || 
             el.getAttribute('aria-disabled') === 'true' ||
             style.opacity === '0.5' ||
             style.pointerEvents === 'none' ||
             el.style.opacity === '0.5' ||
             el.style.pointerEvents === 'none';
    });
    expect(isDisabled).toBeTruthy();

    // メッセージが5秒以上表示されることを確認
    // 5秒待機してメッセージがまだ表示されていることを確認
    await page.waitForTimeout(5000);
    await expect(alertElement.first()).toBeVisible();
  });
});