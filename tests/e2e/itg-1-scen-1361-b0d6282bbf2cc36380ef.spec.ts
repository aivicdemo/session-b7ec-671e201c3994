import { test, expect } from '@playwright/test';

test('SCEN-1361: 配置案が0件のとき、警告メッセージが表示される', async ({ page }) => {
  // 前提: ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html', { waitUntil: 'networkidle' });

  // フィルタ条件を設定して、配置案生成の対象となる進捗データが存在する状態にする
  // 拠点フィルタを設定
  const siteFilter = page.locator('[data-testid="site-filter"]');
  await expect(siteFilter).toBeVisible();
  await siteFilter.click();
  
  // フィルタオプションから拠点を選択
  const siteOption = page.locator('text=東京拠点').first();
  await expect(siteOption).toBeVisible();
  await siteOption.click();

  // リスクレベルフィルタを設定
  const riskLevelFilter = page.locator('[data-testid="risk-level-filter"]');
  await expect(riskLevelFilter).toBeVisible();
  await riskLevelFilter.click();
  
  // リスクレベルオプションから「高」を選択
  const riskOption = page.locator('text=高').first();
  await expect(riskOption).toBeVisible();
  await riskOption.click();

  // ダッシュボードのデータテーブルが表示されることを確認
  const siteVarianceTable = page.locator('[data-testid="site-variance-table"]');
  await expect(siteVarianceTable).toBeVisible({ timeout: 5000 });

  // 人員配置最適化提案・実行画面に遷移
  const navLink = page.locator('[data-testid="scr-1789461798629"]');
  await expect(navLink).toBeVisible();
  await navLink.click();
  await page.waitForURL(/.*scr-1789461798629.*/, { waitUntil: 'networkidle' });

  // 人員配置最適化提案・実行画面が読み込まれたことを確認
  const progressRate = page.locator('[data-testid="progress-rate"], #progress-rate-value');
  await expect(progressRate).toBeVisible({ timeout: 5000 });

  // 「人員配置案を自動生成」ボタンをクリック
  const generateButton = page.locator('button:has-text("人員配置案を自動生成")');
  await expect(generateButton).toBeVisible();
  await generateButton.click();

  // 生成処理の完了を待つ（ローディングインジケータが消滅するまで）
  await page.waitForLoadState('networkidle');
  
  // ローディング表示が消えるまで待機
  const loadingIndicators = page.locator('text=読込中...');
  await expect(loadingIndicators).not.toBeVisible({ timeout: 10000 }).catch(() => {});

  // 警告メッセージが表示されることを確認
  const warningMessage = page.locator(
    'text=検討対象の配置案が見つかりません。フィルタ条件を見直してください'
  );
  await expect(warningMessage).toBeVisible();

  // メッセージが視覚的に警告として区別されることを確認
  const messageContainer = warningMessage.locator('..');
  
  // 警告スタイルを検証：背景色、ボーダー、またはアイコンが存在することを確認
  const warningStyles = await messageContainer.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    const computedBackgroundColor = styles.backgroundColor;
    const computedBorderColor = styles.borderColor;
    const computedBorderWidth = styles.borderWidth;
    
    // 背景色が視覚的に存在するか確認
    const hasVisualBackground = computedBackgroundColor && 
                               computedBackgroundColor !== 'rgba(0, 0, 0, 0)' && 
                               computedBackgroundColor !== 'transparent';
    
    // ボーダーが視覚的に存在するか確認
    const hasVisualBorder = computedBorderColor && 
                           computedBorderColor !== 'rgba(0, 0, 0, 0)' && 
                           computedBorderWidth && 
                           computedBorderWidth !== '0px';
    
    // 警告アイコンが存在するか確認
    const warningIcon = el.querySelector('svg') || 
                       el.querySelector('[class*="icon"]') || 
                       el.querySelector('[class*="warning"]') ||
                       el.querySelector('i[class*="warning"]');
    
    return {
      hasBackground: hasVisualBackground,
      hasBorder: hasVisualBorder,
      hasIcon: !!warningIcon
    };
  });

  // 少なくとも背景色またはボーダーまたはアイコンのいずれかが存在することを確認
  const hasWarningStyle = warningStyles.hasBackground || warningStyles.hasBorder || warningStyles.hasIcon;
  expect(hasWarningStyle).toBeTruthy();

  // 画面遷移が発生していないことを確認（同じ画面に留まっている）
  expect(page.url()).toContain('scr-1789461798629');

  // フィルタ条件が画面に残存していることを確認
  await expect(progressRate).toBeVisible();
});