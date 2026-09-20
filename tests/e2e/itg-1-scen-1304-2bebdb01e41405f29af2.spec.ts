import { test, expect } from '@playwright/test';

test('SCEN-1304: WMS からのデータ取得に失敗した場合、最後に正常に取得したデータがキャッシュから使用され、進捗分析は一時停止して手動確認が促される', async ({ page }) => {
  // 進捗・人員配置ダッシュボードを開く
  await page.goto('/panels/scr-1789461783315.html');
  
  // ダッシュボード画面で拠点A・チームBの進捗データ（完了数: 150、残数: 50、進捗率: 75%）が表示されていることを確認
  await expect(page.locator('[data-testid="site-variance-table"]')).toBeVisible();
  
  // 拠点Aのデータを確認
  const siteVarianceTable = page.locator('[data-testid="site-variance-table"]');
  const siteARow = siteVarianceTable.locator('text=拠点A');
  await expect(siteARow).toBeVisible();
  
  let siteARowContent = await siteARow.locator('..').textContent();
  expect(siteARowContent).toContain('150');
  expect(siteARowContent).toContain('50');
  expect(siteARowContent).toContain('75');
  
  // チームBのデータも確認
  const teamVarianceTable = page.locator('[data-testid="team-variance-table"]');
  const teamBRow = teamVarianceTable.locator('text=チームB');
  await expect(teamBRow).toBeVisible();
  
  let teamBRowContent = await teamBRow.locator('..').textContent();
  expect(teamBRowContent).toContain('150');
  expect(teamBRowContent).toContain('50');
  expect(teamBRowContent).toContain('75');
  
  // WMS API をインターセプトしてエラーを返す設定
  await page.route('**/api/**', route => {
    // WMS関連のAPIをエラーで返す
    if (route.request().url().includes('wms') || route.request().url().includes('progress')) {
      route.abort('failed');
    } else {
      route.continue();
    }
  });
  
  // ダッシュボード画面を手動更新（F5キー）
  await page.keyboard.press('F5');
  
  // ページの読み込み完了を待つ
  await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
  
  // 「進捗データの更新に遅延が発生しています。最後の更新：○分前」というメッセージが表示されることを確認
  const delayMessage = page.locator('text=/進捗データの更新に遅延が発生しています。最後の更新：.+分前/');
  await expect(delayMessage).toBeVisible({ timeout: 10000 });
  
  // ダッシュボードに表示される拠点A・チームBの進捗データが前回取得した値のままであることを確認
  siteARowContent = await siteVarianceTable.locator('text=拠点A').locator('..').textContent();
  expect(siteARowContent).toContain('150');
  expect(siteARowContent).toContain('50');
  expect(siteARowContent).toContain('75');
  
  teamBRowContent = await teamVarianceTable.locator('text=チームB').locator('..').textContent();
  expect(teamBRowContent).toContain('150');
  expect(teamBRowContent).toContain('50');
  expect(teamBRowContent).toContain('75');
  
  // 人員配置最適化提案・実行画面に遷移
  const optimizeLink = page.locator('[data-testid="scr-1789461798629"]').or(page.locator('a[href*="scr-1789461798629"]')).first();
  await optimizeLink.click();
  await page.waitForURL('**/scr-1789461798629.html', { timeout: 10000 });
  
  // 配置案表示エリアに「データ更新待機中」という注記が付与されていることを確認
  const waitingNotice = page.locator('text=データ更新待機中');
  await expect(waitingNotice).toBeVisible({ timeout: 5000 });
  
  // 画面上に「最後に正常に取得したデータをキャッシュから使用しています。手動確認が必要です。」というメッセージが表示されていることを確認
  const cacheMessage = page.locator('text=最後に正常に取得したデータをキャッシュから使用しています。手動確認が必要です。');
  await expect(cacheMessage).toBeVisible({ timeout: 5000 });
  
  // 新規配置案の自動生成エリアが空白または「一時停止中」と表示されていることを確認
  const proposalContainer = page.locator('#proposals-container');
  await expect(proposalContainer).toBeVisible();
  
  // 配置案生成エリアが空白のままか「一時停止中」のいずれかを確認
  const proposalContent = await proposalContainer.textContent();
  const isEmptyOrPaused = (proposalContent?.trim() === '' || proposalContent?.includes('一時停止中'));
  expect(isEmptyOrPaused).toBeTruthy();
});