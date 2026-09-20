import { test, expect } from '@playwright/test';

test('SCEN-850: 進捗監視により遅延リスクが検出されると、AIエージェントが最適配置案を生成する', async ({ page }) => {
  // Step 1: 生産性ダッシュボード・分析画面にログインし、複数の作業者の実績データが表示されている状態を確認する
  await test.step('生産性ダッシュボード・分析画面にログインする', async () => {
    await page.goto('/');
    await page.waitForNavigation();
    
    // ログイン画面が表示される想定
    const loginTitle = await page.locator('.login-title');
    await expect(loginTitle).toBeVisible();
    
    // ログイン情報を入力（テスト用の認証情報を使用）
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("ログイン")');
    
    // ログイン後、生産性ダッシュボード・分析画面に遷移
    await page.waitForNavigation();
    await expect(page).toHaveURL(/\/panels\/scr-1789461964046/);
  });

  await test.step('複数の作業者の実績データが表示されていることを確認する', async () => {
    // ダッシュボード画面上に作業者データが表示されていることを確認
    const workerDataElements = await page.locator('[data-testid*="worker"]').count();
    expect(workerDataElements).toBeGreaterThan(0);
  });

  // Step 2: 進捗監視機能で、特定の作業タスク（例：ピッキング作業）について、現在の進捗率が計画比で80%以下の遅延状態になるよう作業実績データを入力・更新する
  await test.step('作業実績データを入力・更新して遅延状態を作成する', async () => {
    // 作業実績データ記録・入力画面に遷移
    await page.goto('/panels/scr-1789461993203.html');
    await page.waitForLoadState('networkidle');

    // ピッキング作業の進捗率を80%以下に設定
    const taskSelect = page.locator('[data-testid="task-select"]');
    await taskSelect.selectOption('ピッキング作業');
    
    const progressInput = page.locator('[data-testid="progress-rate-input"]');
    await progressInput.fill('75');
    
    // データを保存
    const submitButton = page.locator('button:has-text("保存")');
    await submitButton.click();
    
    await page.waitForNavigation();
  });

  // Step 3: 遅延リスク検出トリガーが動作し、生産性ダッシュボード画面上に『遅延リスク検出』または『最適配置案を生成中』といった通知・アラートが画面に表示されることを確認する
  await test.step('遅延リスク検出の通知・アラートが表示されることを確認する', async () => {
    // 生産性ダッシュボード・分析画面に戻る
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');

    // バックエンド処理による遅延リスク検出の完了を待つ
    // アラートの出現を待機（最大30秒）
    const delayAlert = page.locator('text=/遅延リスク検出|最適配置案を生成中/');
    await expect(delayAlert).toBeVisible({ timeout: 30000 });
  });

  // Step 4: 通知またはアラートのリンク、またはメニューから『最適人員配置案提案・実行画面』に遷移する
  await test.step('最適人員配置案提案・実行画面に遷移する', async () => {
    // アラートまたはメニューから遷移
    const navigationLink = page.locator('a:has-text(/最適配置案|配置提案/)');
    await navigationLink.click();
    
    await page.waitForNavigation();
  });

  // Step 5: 最適人員配置案提案・実行画面が表示され、AIエージェントが生成した配置案が表示されることを確認する
  await test.step('最適人員配置案提案・実行画面でAI生成の配置案が表示されることを確認する', async () => {
    // 最適人員配置案提案・実行画面が表示されたことを確認
    await expect(page).toHaveURL(/\/panels\/scr-1789461978707/);
    await page.waitForLoadState('networkidle');

    // AIエージェント生成の配置案が表示されているか確認
    // 具体的な人員名が表示されている
    const proposalContent = page.locator('[data-testid="proposal-content"]');
    await expect(proposalContent).toBeVisible();

    // 配置案の詳細情報（人員名、作業内容、配置箇所）が表示されている
    const workerNames = page.locator('[data-testid*="worker-name"]');
    await expect(workerNames.first()).toBeVisible();

    const taskNames = page.locator('[data-testid*="task-name"]');
    await expect(taskNames.first()).toBeVisible();

    const locations = page.locator('[data-testid*="location"]');
    await expect(locations.first()).toBeVisible();

    // 配置案の説明・理由が表示されている
    const reason = page.locator('[data-testid="proposal-reason"]');
    await expect(reason).toBeVisible();
  });
});