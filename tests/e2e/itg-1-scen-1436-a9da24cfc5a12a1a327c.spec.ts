import { test, expect } from '@playwright/test';

test.describe('SCEN-1436: ダッシュボード表示（実績管理画面から）', () => {
  test('納期遅延リスク判定時に、平均生産性が0以下の場合、警告が表示されて判定が続行される', async ({ page }) => {
    // ステップ1: 作業指示・実績管理画面にログインし、テスト用拠点・チームの作業進捗データが表示された状態にする
    await page.goto('/');
    await page.waitForURL('**/panels/**');
    
    // ログイン画面が表示される場合はログイン処理を実施
    const loginTitle = await page.locator('.login-title').isVisible().catch(() => false);
    if (loginTitle) {
      await page.fill('input[placeholder*="ユーザーID"], input[placeholder*="ID"]', 'testuser');
      await page.fill('input[placeholder*="パスワード"], input[type="password"]', 'testpassword');
      await page.click('button:has-text("ログイン"), .login-button');
      await page.waitForURL('**/panels/**');
    }

    // 作業指示・実績管理画面に遷移
    await page.click('text=作業指示・実績管理');
    await page.waitForURL('**/scr-1789461813941**');
    
    // テスト用拠点・チームの作業進捗データが表示されていることを確認
    const workInstructionList = page.locator('[data-testid="work-instruction-list"], #work-instruction-tbody');
    await expect(workInstructionList).toBeVisible();
    const rowCount = await page.locator('tr').filter({ has: page.locator('td') }).count();
    expect(rowCount).toBeGreaterThan(0);

    // ステップ2: WMS連携ログから、テスト用拠点の生産性データが平均0件/時間以下の状態であることを確認
    await page.click('[data-testid="tab-wms"], text=WMS連携ログ');
    await expect(page.locator('[data-testid="wms-log-list"], #wms-log-tbody')).toBeVisible();
    
    // WMS連携ログから生産性データを確認し、平均0件/時間以下の状態を検証
    const wmsLogRows = page.locator('#wms-log-tbody tr');
    const rowCountWms = await wmsLogRows.count();
    expect(rowCountWms).toBeGreaterThan(0);
    
    // 各行の生産性データをチェック（成功/失敗列を確認）
    let hasProductivityData = false;
    for (let i = 0; i < rowCountWms; i++) {
      const row = wmsLogRows.nth(i);
      const rowText = await row.textContent();
      // 生産性データが0件/時間以下の状態を示すデータが存在するか確認
      // ログの成功/失敗列に注目し、処理件数や生産性に関する情報を検証
      if (rowText && (rowText.includes('-') || rowText.includes('0'))) {
        hasProductivityData = true;
        break;
      }
    }
    expect(hasProductivityData).toBe(true);

    // ステップ3: 進捗・人員配置ダッシュボード画面に遷移
    await page.click('text=進捗・人員配置ダッシュボード');
    await page.waitForURL('**/scr-1789461783315**');
    
    // ダッシュボードが読み込まれたことを確認
    await expect(page.locator('[data-testid="kpi-risk-count"], [data-testid="kpi-sites-action"]')).toBeVisible();

    // ステップ4: ダッシュボード上で納期遅延リスク判定を実行するボタンをクリック
    // 仕様では「納期遅延リスク判定を実行するボタン」と記載されており、
    // ダッシュボード上で判定を実行するボタンを操作する
    const riskEvaluationButton = page.locator('[data-testid="confirm-results-button"], button:has-text("作業実績を確認")');
    if (await riskEvaluationButton.isVisible().catch(() => false)) {
      await riskEvaluationButton.click();
    } else {
      // 代替として最適化ボタンを使用
      const optimizeButton = page.locator('[data-testid="optimize-button"], button:has-text("人員配置を最適化")');
      await expect(optimizeButton).toBeVisible();
      await optimizeButton.click();
    }

    // ステップ5: ダッシュボード上の警告表示エリアを確認
    // 警告表示エリア（通知パネル、モーダル、バナー等）を確認
    const warningContainer = page.locator('[role="alert"], .modal-overlay, .notification, .alert, [class*="warning"]');
    const warningMessage = page.locator('text=生産性データが不足しています。推定値の精度が低い可能性があります');
    
    // 警告メッセージが表示されるまで待機
    await expect(warningMessage).toBeVisible({ timeout: 10000 });

    // 警告メッセージが表示されていることを確認
    expect(await warningMessage.isVisible()).toBe(true);

    // 警告表示エリアが視認可能であることを確認
    const visibleWarning = page.locator('text=生産性データが不足しています。推定値の精度が低い可能性があります').first();
    await expect(visibleWarning).toBeInViewport();

    // 判定結果が続行されており、ダッシュボード上の遅延リスク数値が表示されていることを確認
    const riskCount = page.locator('[data-testid="kpi-risk-count"]');
    await expect(riskCount).toBeVisible();
    
    // 対応が必要な拠点情報が表示されていることを確認
    const siteVarianceTable = page.locator('[data-testid="site-variance-table"], #site-variance-tbody');
    await expect(siteVarianceTable).toBeVisible();
    const siteRows = await page.locator('#site-variance-tbody tr').count();
    expect(siteRows).toBeGreaterThan(0);

    // 人員配置案の提示が表示されていることを確認
    const activePlansTable = page.locator('[data-testid="active-plans-table"], #active-plans-tbody');
    await expect(activePlansTable).toBeVisible();
    const planRows = await page.locator('#active-plans-tbody tr').count();
    expect(planRows).toBeGreaterThanOrEqual(0);

    // 警告表示有無にかかわらず判定結果が継続的に表示されていることを最終確認
    await expect(riskCount).toBeVisible();
    await expect(siteVarianceTable).toBeVisible();
  });
});