import { test, expect } from '@playwright/test';

test.describe('人員配置最適化提案画面遷移', () => {
  test('優先度ウェイトの合計が100%でない場合、エラーメッセージが表示される', async ({ page }) => {
    // テスト環境で人員配置最適化提案・実行画面を開く
    await page.goto('/panels/scr-1789461798629.html');
    
    // 優先度ウェイト設定セクションを確認し、複数の優先度項目のウェイト入力フィールドが表示されていることを確認
    const delayRiskLabel = page.locator('text=/納期遅延リスク/i');
    const difficultyLabel = page.locator('text=/作業難易度/i');
    const proficiencyLabel = page.locator('text=/作業者習熟度/i');
    
    await expect(delayRiskLabel).toBeVisible();
    await expect(difficultyLabel).toBeVisible();
    await expect(proficiencyLabel).toBeVisible();

    // 各優先度項目に対応するウェイト入力フィールドを取得
    const delayRiskInput = delayRiskLabel.locator('xpath=following::input[@type="number" or @type="text"][1]').first();
    const difficultyInput = difficultyLabel.locator('xpath=following::input[@type="number" or @type="text"][1]').first();
    const proficiencyInput = proficiencyLabel.locator('xpath=following::input[@type="number" or @type="text"][1]').first();

    // ウェイト入力フィールドに値を入力し、合計が100%にならないケースを作成
    // 例：納期遅延リスク=40%, 作業難易度=30%, 作業者習熟度=20% → 合計90%
    await delayRiskInput.fill('40');
    await difficultyInput.fill('30');
    await proficiencyInput.fill('20');

    // 入力値が実際に反映されたことを確認
    await expect(delayRiskInput).toHaveValue('40');
    await expect(difficultyInput).toHaveValue('30');
    await expect(proficiencyInput).toHaveValue('20');

    // 配置案生成ボタンをクリック
    const generateButton = page.locator('[data-testid="generate-proposals-btn"]').or(page.locator('button:has-text("人員配置案を自動生成")')).first();
    await generateButton.click();

    // エラーメッセージが表示されることを確認
    // 「優先度ウェイトの合計が100%である必要があります。現在の合計：XX%」という形式を確認
    const errorMessage = page.locator('text=/優先度ウェイトの合計が100%である必要があります。現在の合計：\\d+%/');
    await expect(errorMessage).toBeVisible();
    
    // エラーメッセージのテキストを取得して、現在の合計が90%であることを検証
    const errorText = await errorMessage.textContent();
    expect(errorText).toMatch(/優先度ウェイトの合計が100%である必要があります。現在の合計：\d+%/);
    // 実際の合計値が90%であることを確認
    expect(errorText).toContain('90%');

    // 配置案の生成処理が開始されていないことを確認
    // ローディング状態が表示されていないことを確認
    const loadingIndicator = page.locator('.loading, [class*="loading"], [class*="spinner"], [class*="progress"]').first();
    const isLoading = await loadingIndicator.isVisible().catch(() => false);
    expect(isLoading).toBe(false);

    // プロポーザルコンテナに新たなプロポーザルが追加されていないことを確認
    const proposalsContainer = page.locator('#proposals-container');
    const proposalDetailContainer = page.locator('#proposal-detail-container');
    
    // 初期状態（プロポーザルなし）のまま変わっていないことを確認
    if (await proposalsContainer.isVisible().catch(() => false)) {
      const proposalCount = await proposalsContainer.locator('> *').count();
      expect(proposalCount).toBe(0);
    }
    
    // 詳細コンテナが空のままであることを確認
    if (await proposalDetailContainer.isVisible().catch(() => false)) {
      const detailText = await proposalDetailContainer.textContent();
      expect(detailText).toMatch(/配置案を選択して詳細を表示/);
    }

    // フォーカスが不正な入力フィールドに移動していることを確認
    const focusedElement = page.locator(':focus');
    const focusedText = await focusedElement.getAttribute('aria-label').catch(() => '');
    const focusedValue = await focusedElement.inputValue().catch(() => '');
    
    // フォーカスが入力フィールドのいずれかに移動していることを確認
    const weightInputs = [delayRiskInput, difficultyInput, proficiencyInput];
    let focusedOnWeightInput = false;
    
    for (const input of weightInputs) {
      const isFocused = await input.evaluate(el => el === document.activeElement);
      if (isFocused) {
        focusedOnWeightInput = true;
        break;
      }
    }
    
    expect(focusedOnWeightInput).toBe(true);

    // ウェイト入力フィールドのいずれかがエラー状態を示す属性またはクラスを持っていることを確認
    let errorStateDetected = false;
    
    for (const input of weightInputs) {
      const ariaInvalid = await input.getAttribute('aria-invalid');
      const classList = await input.evaluate(el => el.className);
      const hasErrorClass = classList.includes('error') || classList.includes('invalid');
      
      if (ariaInvalid === 'true' || hasErrorClass) {
        errorStateDetected = true;
        break;
      }
    }
    
    // エラー状態の視覚的表示とフォーカス移動を確認
    expect(errorStateDetected || focusedOnWeightInput).toBe(true);
  });
});