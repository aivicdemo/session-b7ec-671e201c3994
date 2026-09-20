import { test, expect } from '@playwright/test';

test('SCEN-1362: 優先度ウェイトの合計が100%でないとき、エラーが表示される', async ({ page }) => {
  // 人員配置最適化提案・実行画面にアクセス
  await page.goto('/panels/scr-1789461798629.html');

  // 入力フォームが表示されることを確認
  const generateProposalsBtn = page.getByTestId('generate-proposals-btn');
  await expect(generateProposalsBtn).toBeVisible();

  // エラー表示前のボタン状態を確認（押下可能であることを確認）
  await expect(generateProposalsBtn).toBeEnabled();

  // 優先度ウェイト設定セクションを操作
  // 画面内のすべてのinput要素を取得
  const inputs = await page.locator('input').all();
  
  let weightFieldCount = 0;
  for (const input of inputs) {
    const inputType = await input.getAttribute('type');
    const inputName = await input.getAttribute('name');
    const placeholder = await input.getAttribute('placeholder');
    const ariaLabel = await input.getAttribute('aria-label');
    
    // 入力フィールドのコンテキスト（親要素）からラベルテキストを取得
    const parentElement = await input.locator('xpath=ancestor::*[contains(@class, "form-group") or contains(@class, "priority") or self::label or self::div or self::fieldset]').first();
    const contextText = await parentElement.textContent().catch(() => '');
    
    // ウェイト関連の入力フィールドを識別
    const isWeightField = 
      (inputName && /ウェイト|weight|priority/i.test(inputName)) ||
      (placeholder && /ウェイト|%|weight/i.test(placeholder)) ||
      (ariaLabel && /ウェイト|優先度|weight/i.test(ariaLabel)) ||
      (contextText && /ウェイト|優先度|重み|納期遅延|生産性|習熟度|リスク/i.test(contextText));
    
    if (isWeightField && (inputType === 'number' || inputType === 'text' || !inputType)) {
      try {
        if (await input.isVisible()) {
          if (weightFieldCount === 0) {
            await input.fill('40'); // 納期遅延リスク: 40%
          } else if (weightFieldCount === 1) {
            await input.fill('35'); // 生産性: 35%
          } else if (weightFieldCount === 2) {
            await input.fill('20'); // 習熟度: 20%
            break;
          }
          weightFieldCount++;
        }
      } catch (e) {
        // 入力フィールドが対話不可の場合はスキップ
        continue;
      }
    }
  }

  // 配置案生成ボタンをクリック
  await generateProposalsBtn.click();

  // エラーメッセージが表示されることを確認
  // 画面の見出しに「エラー」と表記
  const errorHeading = page.locator('text=エラー').first();
  await expect(errorHeading).toBeVisible();

  // 本文に「優先度ウェイトの合計は100%である必要があります」というエラーメッセージが表示
  const errorMessage = page.locator('text=優先度ウェイトの合計は100%である必要があります');
  await expect(errorMessage).toBeVisible();

  // エラー表示後のボタン状態を確認（押下不可状態に戻っていることを確認）
  await expect(generateProposalsBtn).toBeDisabled();

  // ページ遷移が発生していないことを確認
  await expect(page).toHaveURL('/panels/scr-1789461798629.html');
});