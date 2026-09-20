import { test, expect } from '@playwright/test';

test('SCEN-851: 進捗監視により遅延リスクが検出されない場合、既存配置案が提示される', async ({ page }) => {
  // 生産性ダッシュボード・分析画面にログインする
  await page.goto('/');
  
  // ログイン画面でユーザー認証
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  
  // ログイン後の遷移完了を待つ
  await page.waitForNavigation();
  await page.waitForLoadState('networkidle');

  // 進捗監視対象となっている現在の作業案件を表示する
  await test.step('進捗監視対象となっている現在の作業案件を表示する', async () => {
    // ダッシュボード画面から作業案件を選択
    const projectElement = await page.locator('[data-testid="current-project"]');
    await expect(projectElement).toBeVisible();
    await projectElement.click();
    await page.waitForLoadState('networkidle');
  });

  // 進捗監視機能により、現在の進捗状況が予定通りであることを確認する（遅延リスクが検出されない状態）
  await test.step('進捗状況が予定通りであることを確認する', async () => {
    // 遅延リスク警告が表示されていないことを確認
    const delayRiskWarning = page.locator('[data-testid="delay-risk-warning"]');
    await expect(delayRiskWarning).not.toBeVisible();
    
    // 進捗状況表示で予定通りの状態を確認
    const progressStatus = page.locator('[data-testid="progress-status"]');
    await expect(progressStatus).toContainText('予定通り');
  });

  // 最適人員配置案提案・実行画面に遷移する
  await test.step('最適人員配置案提案・実行画面に遷移する', async () => {
    // ナビゲーションメニューまたはボタンから人員配置画面へ遷移
    await page.click('a[href*="scr-1789461978707"]');
    await page.waitForNavigation();
    await page.waitForLoadState('networkidle');
  });

  // 画面上に配置案が表示されるまで待機する
  await test.step('配置案が表示されるまで待機する', async () => {
    const placementPlan = page.locator('[data-testid="placement-plan"]');
    await expect(placementPlan).toBeVisible({ timeout: 10000 });
  });

  // 期待結果：既存配置案が表示され、新たな配置案提案ボタンまたは代替案表示機能が非表示または無効化されている
  await test.step('既存配置案が表示され、新提案機能が無効化されていることを確認', async () => {
    // 既存配置案が表示されていることを確認
    const existingPlan = page.locator('[data-testid="existing-placement-plan"]');
    await expect(existingPlan).toBeVisible();
    
    // 既存配置の内容が表示されている
    const planContent = page.locator('[data-testid="placement-plan-content"]');
    await expect(planContent).toBeVisible();

    // 新たな配置案提案ボタンが非表示または無効化されていることを確認
    const newProposalButton = page.locator('[data-testid="new-proposal-button"]');
    const isHidden = await newProposalButton.isHidden();
    const isDisabled = await newProposalButton.isDisabled();
    
    expect(isHidden || isDisabled).toBeTruthy();

    // 代替案表示機能が非表示または無効化されていることを確認
    const alternativeShowButton = page.locator('[data-testid="alternative-show-button"]');
    const altIsHidden = await alternativeShowButton.isHidden();
    const altIsDisabled = await alternativeShowButton.isDisabled();
    
    expect(altIsHidden || altIsDisabled).toBeTruthy();
  });
});