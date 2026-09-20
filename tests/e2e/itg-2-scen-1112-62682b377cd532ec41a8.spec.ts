import { test, expect } from '@playwright/test';

test('SCEN-1112: 配置案承認処理 - 形式不正な配置案IDが拒否される', async ({ page }) => {
  // 最適人員配置案提案・実行画面を開く
  await page.goto('/panels/scr-1789461978707.html');
  
  // 配置案一覧から任意の配置案を選択する
  const deploymentCaseItem = page.locator('[data-testid="deployment-case-item"]').first();
  await expect(deploymentCaseItem).toBeVisible();
  await deploymentCaseItem.click();
  await expect(deploymentCaseItem).toHaveClass(/selected|active/);
  
  // 配置案IDを取得して、ブラウザの開発者ツール相当の操作でHTMLを編集
  const deploymentCaseIdElement = deploymentCaseItem.locator('[data-testid="deployment-case-id"]').first();
  const originalCaseId = await deploymentCaseIdElement.textContent();
  
  // 形式不正な値に置き換える
  const invalidCaseId = 'ABC@#$';
  await page.evaluate(({ caseId }) => {
    const element = document.querySelector('[data-testid="deployment-case-id"]');
    if (element) {
      element.setAttribute('data-case-id', caseId);
      element.textContent = caseId;
    }
  }, { caseId: invalidCaseId });
  
  // API呼び出しを監視するための配列
  const apiResponses: { url: string; status: number; method: string }[] = [];
  
  // ボタンクリック直前にリスナーを登録
  page.on('response', response => {
    if (response.url().includes('/api/') && response.request().method() === 'POST') {
      apiResponses.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method()
      });
    }
  });
  
  // 「承認」ボタンをクリックして配置案承認処理を実行する
  const approveButton = page.locator('button:has-text("承認")');
  await approveButton.click();
  
  // 入力検証エラーメッセージが表示されることを確認
  const errorMessage = page.locator('[data-testid="error-message"], .error-message, [role="alert"]').first();
  await expect(errorMessage).toBeVisible();
  
  // メッセージ内容が「配置案IDの形式が不正です」または「入力値が正しくありません」を示す文言であることを確認
  const errorText = await errorMessage.textContent();
  expect(errorText).toMatch(/配置案IDの形式が不正です|入力値が正しくありません/);
  
  // 配置案一覧画面のままの状態で留まっていることを確認
  await expect(page.locator('[data-testid="deployment-case-list"]')).toBeVisible();
  
  // 承認処理のAPI呼び出しが送信されていないか、400系のバリデーションエラーレスポンスが返却されることを確認
  if (apiResponses.length === 0) {
    // API呼び出しが送信されていないケース
    expect(apiResponses.length).toBe(0);
  } else {
    // API呼び出しが送信された場合、全て400系のエラーレスポンスが返却されていることを確認
    apiResponses.forEach(response => {
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });
  }
});