import { test, expect } from '@playwright/test';

test.describe('SCEN-899: 配置案確認画面表示', () => {
  test('取得した配置計画・生産性データ・実績記録が統合され、配置案確認画面に表示データとして構築される', async ({ page }) => {
    // ログイン画面へ遷移
    await page.goto('/');
    
    // ログイン処理（前提条件）
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass');
    await page.click('button[type="submit"]');
    
    // ページ遷移の完了を待機
    await page.waitForLoadState('networkidle');

    // ステップ1: 生産性ダッシュボード・分析画面で作業者Aの生産性データを確認
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');
    
    const workerAProductivityData = await page.locator('text=WKR001').first();
    await expect(workerAProductivityData).toBeVisible();
    
    // 生産性スコア85を確認
    await expect(page.locator('text=85')).toBeVisible();
    
    // 習熟度:中級を確認
    await expect(page.locator('text=中級')).toBeVisible();
    
    // 品質評価:良好を確認
    await expect(page.locator('text=良好')).toBeVisible();

    // ステップ2: 最適人員配置案提案・実行画面に遷移
    await page.goto('/panels/scr-1789461978707.html');
    await page.waitForLoadState('networkidle');
    
    // 提案日時:2024-01-15 09:30が表示されていることを確認
    await expect(page.locator('text=2024-01-15')).toBeVisible();
    await expect(page.locator('text=09:30')).toBeVisible();
    
    // 配置計画が表示されていることを確認
    await expect(page.locator('text=WKR001')).toBeVisible();
    await expect(page.locator('text=ピッキング業務')).toBeVisible();
    await expect(page.locator('text=梱包業務')).toBeVisible();

    // ステップ3: 作業実績データ記録・入力画面から実績記録を確認
    await page.goto('/panels/scr-1789461993203.html');
    await page.waitForLoadState('networkidle');
    
    // 作業者A実績データが入力・保存されていることを確認
    await expect(page.locator('text=WKR001')).toBeVisible();
    await expect(page.locator('text=2024-01-15')).toBeVisible();
    await expect(page.locator('text=120')).toBeVisible();
    await expect(page.locator('text=480')).toBeVisible();

    // ステップ4: 配置案確認画面に遷移
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // ステップ5: 配置案確認画面上に統合表示データが表示されていることを確認
    
    // 作業者A（WKR001）の配置案情報を確認
    await expect(page.locator('text=WKR001')).toBeVisible();
    
    // 生産性スコア85が表示されている
    await expect(page.locator('text=85')).toBeVisible();
    
    // 習熟度:中級が表示されている
    await expect(page.locator('text=中級')).toBeVisible();
    
    // 品質評価:良好が表示されている
    await expect(page.locator('text=良好')).toBeVisible();
    
    // 推奨配置:ピッキング業務が表示されている
    await expect(page.locator('text=ピッキング業務')).toBeVisible();
    
    // 完了数:120件が表示されている
    await expect(page.locator('text=120')).toBeVisible();
    
    // 所要時間:480分が表示されている
    await expect(page.locator('text=480')).toBeVisible();
    
    // 統合表示の検証：同一画面上に生産性・配置・実績情報が論理的に整理されている
    const pageContent = await page.content();
    expect(pageContent).toContain('WKR001');
    expect(pageContent).toContain('85');
    expect(pageContent).toContain('中級');
    expect(pageContent).toContain('良好');
    expect(pageContent).toContain('ピッキング業務');
    expect(pageContent).toContain('120');
    expect(pageContent).toContain('480');
  });
});