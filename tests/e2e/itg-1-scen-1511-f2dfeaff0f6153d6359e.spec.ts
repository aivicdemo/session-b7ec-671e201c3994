import { test, expect } from '@playwright/test';

test('SCEN-1511: 送信ペイロードが空またはnullのとき、エラーメッセージが表示されて処理は中断される', async ({ page }) => {
  // 作業指示・実績管理画面を開く
  await page.goto('/panels/scr-1789461813941.html');
  
  // 画面の読み込みを待機
  await page.waitForLoadState('networkidle');
  
  // 作業実績データ送信機能にアクセスする
  // 作業指示一覧から作業を選択して実績入力フォームを表示
  const workInstructionList = page.getByTestId('work-instruction-list');
  await workInstructionList.waitFor({ state: 'visible' });
  
  // 最初の作業指示行をクリックして選択
  const firstWorkInstruction = page.locator('[id="work-instruction-tbody"] tr').first();
  await firstWorkInstruction.click();
  
  // 実績入力フォームが表示されるまで待機
  const performanceFormSection = page.getByTestId('performance-form-section');
  await performanceFormSection.waitFor({ state: 'visible' });
  
  // 送信ペイロードが空またはnullの状態をシミュレート
  // フォーム入力値をクリアして空の状態にする（アプリケーションが空ペイロードを生成する状況）
  const perfQuantityInput = page.getByTestId('performance-quantity');
  const perfDefectsInput = page.getByTestId('performance-defects');
  const perfEndDatetimeInput = page.getByTestId('performance-end-datetime');
  const perfStatusSelect = page.getByTestId('performance-status');
  
  // すべての入力フィールドをクリア
  await perfQuantityInput.clear();
  await perfDefectsInput.clear();
  await perfEndDatetimeInput.clear();
  
  // ステータスをリセット（デフォルト値に）
  await perfStatusSelect.selectOption({ label: '選択してください' });
  
  // 送信ボタンをクリック（空またはnullのペイロードが送信される）
  const performanceSubmitButton = page.getByTestId('performance-submit-button');
  await performanceSubmitButton.click();
  
  // 画面の応答を待機（最大5秒）
  const errorMessage = page.locator('[id="error-message"]');
  await errorMessage.waitFor({ state: 'visible', timeout: 5000 });
  
  // 期待結果の検証
  // エラーメッセージが表示されていることを確認
  await expect(errorMessage).toContainText('送信データが空またはnullです。作業実績の入力内容を確認してください。');
  
  // エラーバナーが表示されていることを確認
  const errorBanner = page.locator('[id="error-banner"]');
  await expect(errorBanner).toBeVisible();
  
  // 送信前の状態に戻っていることを確認
  // フォームが依然として表示され、編集可能な状態であることを確認
  await expect(performanceFormSection).toBeVisible();
  await expect(perfQuantityInput).toBeEditable();
  await expect(perfDefectsInput).toBeEditable();
  await expect(perfEndDatetimeInput).toBeEditable();
  
  // 再入力が可能な状態であることを確認（送信ボタンが有効状態）
  await expect(performanceSubmitButton).toBeEnabled();
});