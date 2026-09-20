import { test, expect } from '@playwright/test';

test.describe('SCEN-963: 実績データ入力時配置案参照', () => {
  test('基準データが確定されると、指定作業者の現在有効な配置計画が日付ベースで検索され配置案の詳細情報が取得される', async ({ page }) => {
    // ログイン処理
    await page.goto('/');
    
    // ログイン画面が表示されるまで待機
    await page.waitForURL(/login/);
    
    // ユーザーID入力
    await page.fill('input[type="text"]', 'testuser');
    
    // パスワード入力
    await page.fill('input[type="password"]', 'password');
    
    // ログインボタン操作
    await page.click('button:has-text("ログイン")');
    
    // ログイン後の画面遷移完了を待機
    await page.waitForURL(/panels/);
    
    // 作業実績データ記録・入力画面へ遷移
    await page.goto('/panels/scr-1789461993203.html');
    await page.waitForLoadState('networkidle');
    
    // 基準データ確定前の状態を確認
    const beforeConfirmState = await page.locator('[data-testid="reference-panel"]').isVisible();
    expect(beforeConfirmState).toBeFalsy();
    
    // 作業者ID「WK-001」を指定
    await page.fill('[data-testid="worker-id-input"]', 'WK-001');
    
    // 日付「2024年1月15日」を指定
    await page.fill('[data-testid="date-input"]', '2024-01-15');
    
    // 基準データ確定ボタンを操作
    await page.click('[data-testid="confirm-base-data-button"]');
    
    // 配置案検索処理の完了を待機（最大10秒）
    await page.waitForSelector('[data-testid="reference-panel"]', { timeout: 10000 });
    
    // 配置案参照セクション/パネルが表示されていることを確認
    const referencePanel = page.locator('[data-testid="reference-panel"]');
    await expect(referencePanel).toBeVisible();
    
    // 配置案の詳細情報が表示されていることを確認
    // 配置ID
    const allocationId = page.locator('[data-testid="allocation-id"]');
    await expect(allocationId).toBeVisible();
    
    // 配置開始日時
    const startDateTime = page.locator('[data-testid="allocation-start-datetime"]');
    await expect(startDateTime).toBeVisible();
    
    // 配置終了日時
    const endDateTime = page.locator('[data-testid="allocation-end-datetime"]');
    await expect(endDateTime).toBeVisible();
    
    // 割当部門
    const department = page.locator('[data-testid="assigned-department"]');
    await expect(department).toBeVisible();
    
    // 割当作業タイプ
    const workType = page.locator('[data-testid="assigned-work-type"]');
    await expect(workType).toBeVisible();
    
    // 想定生産性基準値
    const productivityStandard = page.locator('[data-testid="expected-productivity-standard"]');
    await expect(productivityStandard).toBeVisible();
    
    // すべての情報が文字列値を含んでいることを確認
    await expect(allocationId).not.toHaveText('');
    await expect(startDateTime).not.toHaveText('');
    await expect(endDateTime).not.toHaveText('');
    await expect(department).not.toHaveText('');
    await expect(workType).not.toHaveText('');
    await expect(productivityStandard).not.toHaveText('');
  });

  test('基準データ確定後、検索結果が存在しない場合は該当メッセージが表示される', async ({ page }) => {
    // ログイン処理
    await page.goto('/');
    await page.waitForURL(/login/);
    
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL(/panels/);
    
    // 作業実績データ記録・入力画面へ遷移
    await page.goto('/panels/scr-1789461993203.html');
    await page.waitForLoadState('networkidle');
    
    // 検索結果が存在しない条件で作業者IDと日付を指定
    await page.fill('[data-testid="worker-id-input"]', 'WK-999');
    await page.fill('[data-testid="date-input"]', '2025-12-31');
    
    // 基準データ確定ボタンを操作
    await page.click('[data-testid="confirm-base-data-button"]');
    
    // 配置案検索処理の完了を待機
    await page.waitForSelector('[data-testid="reference-panel"]', { timeout: 10000 });
    
    // 配置案参照パネルが表示されていることを確認
    const referencePanel = page.locator('[data-testid="reference-panel"]');
    await expect(referencePanel).toBeVisible();
    
    // 該当メッセージが表示されていることを確認
    const noResultMessage = page.locator('[data-testid="no-result-message"]');
    await expect(noResultMessage).toBeVisible();
    await expect(noResultMessage).toHaveText('該当する配置計画がありません');
  });
});