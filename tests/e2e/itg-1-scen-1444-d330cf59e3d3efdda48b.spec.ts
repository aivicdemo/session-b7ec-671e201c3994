import { test, expect } from '@playwright/test';

test('SCEN-1444: ダッシュボード表示（実績管理画面から）', async ({ page }) => {
  // Step 1: 作業指示・実績管理画面にログインし、複数拠点の作業実績データが入力済みの状態を確認する
  await page.goto('/');
  await page.waitForURL(/.*\\/panels\\/.+\\.html/);

  // ログイン画面に遷移した場合はログインを実行
  const loginCard = page.locator('.login-card');
  if (await loginCard.isVisible()) {
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("ログイン")');
    await page.waitForNavigation();
  }

  // 作業指示・実績管理画面に遷移
  const workInstructionNav = page.locator('nav >> text=作業指示・実績管理');
  if (await workInstructionNav.isVisible()) {
    await page.click('nav >> text=作業指示・実績管理');
  } else {
    await page.goto('/panels/scr-1789461813941.html');
  }

  await page.waitForLoadState('networkidle');

  // 作業実績データが入力済みであることを確認
  const workInstructionList = page.locator('[data-testid="work-instruction-list"]');
  await expect(workInstructionList).toBeVisible();

  // Step 2: 進捗・人員配置ダッシュボードへ遷移する
  await page.click('nav >> text=進捗・人員配置ダッシュボード');

  // Step 3: ダッシュボード画面が読み込まれ、『対応が必要な拠点』セクションが表示されるまで待機する
  await page.waitForURL(/.*\\/panels\\/scr-1789461783315\\.html/);
  await page.waitForLoadState('networkidle');

  const siteVarianceTable = page.locator('[data-testid="site-variance-table"]');
  await expect(siteVarianceTable).toBeVisible();

  // Step 4: ダッシュボード画面の『対応が必要な拠点』セクションに表示されている拠点一覧を確認する
  const siteRows = page.locator('#site-variance-tbody tr');
  const rowCount = await siteRows.count();
  expect(rowCount).toBeGreaterThan(0);

  // Step 5: セクション内の各拠点行に『リスク度スコア：XX%』という数値が明示されていることを確認する
  for (let i = 0; i < rowCount; i++) {
    const row = siteRows.nth(i);
    const rowText = await row.textContent();
    expect(rowText).toMatch(/リスク度スコア：\d+%/);
  }

  // Step 6: 拠点の並び順がリスク度スコアの降順（高い→低い）であることを検証する
  const riskScores: number[] = [];
  for (let i = 0; i < rowCount; i++) {
    const row = siteRows.nth(i);
    const rowText = await row.textContent();
    const scoreMatch = rowText?.match(/リスク度スコア：(\d+)%/);
    if (scoreMatch) {
      riskScores.push(parseInt(scoreMatch[1], 10));
    }
  }

  // リスク度スコアが降順に並んでいることを検証
  for (let i = 0; i < riskScores.length - 1; i++) {
    expect(riskScores[i]).toBeGreaterThanOrEqual(riskScores[i + 1]);
  }

  // Step 7: リスク度スコアが同値の拠点が複数ある場合、表示順が安定していることを確認する
  const initialRiskScores = [...riskScores];

  // 画面を再読み込み
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(siteVarianceTable).toBeVisible();

  const reloadedSiteRows = page.locator('#site-variance-tbody tr');
  const reloadedRowCount = await reloadedSiteRows.count();
  expect(reloadedRowCount).toBe(rowCount);

  const reloadedRiskScores: number[] = [];
  for (let i = 0; i < reloadedRowCount; i++) {
    const row = reloadedSiteRows.nth(i);
    const rowText = await row.textContent();
    const scoreMatch = rowText?.match(/リスク度スコア：(\d+)%/);
    if (scoreMatch) {
      reloadedRiskScores.push(parseInt(scoreMatch[1], 10));
    }
  }

  // 表示順序が変わらないことを検証
  expect(reloadedRiskScores).toEqual(initialRiskScores);
});