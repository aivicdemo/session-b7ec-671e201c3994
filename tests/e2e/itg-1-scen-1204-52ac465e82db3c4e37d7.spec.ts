import { test, expect } from '@playwright/test';

test('SCEN-1204: AI予測エンジンが利用できない場合でも前回の正常な判定結果をキャッシュから表示される', async ({ page }) => {
  // ステップ1: 進捗・人員配置ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');

  // ステップ2: 拠点A・チームXの進捗状況パネルが表示されるまで待機する
  await page.waitForSelector('[data-testid="kpi-risk-count"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="kpi-sites-action"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="kpi-active-plans"]', { timeout: 10000 });

  // ステップ3: ダッシュボード内の「リスク判定結果」セクションを確認する
  // 期待結果(1): 画面上部に黄色の情報バナーとして「リスク判定エンジンが一時的に利用できません。前回の判定結果を表示しています」というメッセージが表示される
  const infoBanner = await page.locator('text=/リスク判定エンジンが一時的に利用できません/');
  await expect(infoBanner).toBeVisible();

  // 期待結果(2): 「リスク判定結果」セクションに、キャッシュから復元された判定結果「進捗遅延確率45%」が表示される
  const riskAssessmentTable = await page.locator('[data-testid="risk-assessment-table"]');
  await expect(riskAssessmentTable).toBeVisible();
  
  const riskResult = await page.locator('text=/進捗遅延確率45%/');
  await expect(riskResult).toBeVisible();

  // 期待結果(3): 該当する判定結果行の右側に「更新待機中」というラベルが灰色で表示される
  const riskResultRow = page.locator('[id="risk-assessment-tbody"] tr').filter({ has: page.locator('text=/進捗遅延確率45%/') });
  const riskWaitingLabel = riskResultRow.locator('text=/更新待機中/');
  await expect(riskWaitingLabel).toBeVisible();
  
  // 灰色系の RGB値を確認（R≈G≈B）
  const riskLabelColor = await riskWaitingLabel.evaluate((el) => {
    return window.getComputedStyle(el).color;
  });
  const riskRgbMatch = riskLabelColor.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (riskRgbMatch) {
    const r = parseInt(riskRgbMatch[1]);
    const g = parseInt(riskRgbMatch[2]);
    const b = parseInt(riskRgbMatch[3]);
    // 灰色は R ≈ G ≈ B で、かつ中程度の値
    expect(Math.abs(r - g)).toBeLessThan(50);
    expect(Math.abs(g - b)).toBeLessThan(50);
    expect(Math.abs(r - b)).toBeLessThan(50);
    expect(r).toBeGreaterThan(80);
    expect(r).toBeLessThan(200);
  }

  // ステップ4: ダッシュボード内の「推奨人員配置」セクションを確認する
  // 期待結果(4): 「推奨人員配置」セクションに、キャッシュから復元された配置案「作業者3名追加」が表示される
  const assignmentSection = await page.locator('text=/作業者3名追加/');
  await expect(assignmentSection).toBeVisible();

  // 期待結果(5): 該当する配置案行の右側に「更新待機中」というラベルが灰色で表示される
  // site-variance-table または team-variance-table を確認
  const siteVarianceTable = page.locator('[data-testid="site-variance-table"]');
  const teamVarianceTable = page.locator('[data-testid="team-variance-table"]');
  
  const siteVarianceVisible = await siteVarianceTable.isVisible().catch(() => false);
  const teamVarianceVisible = await teamVarianceTable.isVisible().catch(() => false);
  
  if (siteVarianceVisible) {
    const assignmentRow = page.locator('[id="site-variance-tbody"] tr').filter({ has: page.locator('text=/作業者3名追加/') });
    const assignmentWaitingLabel = assignmentRow.locator('text=/更新待機中/');
    await expect(assignmentWaitingLabel).toBeVisible();
    
    // 灰色系の RGB値を確認（R≈G≈B）
    const assignmentLabelColor = await assignmentWaitingLabel.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    const assignmentRgbMatch = assignmentLabelColor.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (assignmentRgbMatch) {
      const r = parseInt(assignmentRgbMatch[1]);
      const g = parseInt(assignmentRgbMatch[2]);
      const b = parseInt(assignmentRgbMatch[3]);
      expect(Math.abs(r - g)).toBeLessThan(50);
      expect(Math.abs(g - b)).toBeLessThan(50);
      expect(Math.abs(r - b)).toBeLessThan(50);
      expect(r).toBeGreaterThan(80);
      expect(r).toBeLessThan(200);
    }
  } else if (teamVarianceVisible) {
    const assignmentRow = page.locator('[id="team-variance-tbody"] tr').filter({ has: page.locator('text=/作業者3名追加/') });
    const assignmentWaitingLabel = assignmentRow.locator('text=/更新待機中/');
    await expect(assignmentWaitingLabel).toBeVisible();
    
    // 灰色系の RGB値を確認（R≈G≈B）
    const assignmentLabelColor = await assignmentWaitingLabel.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    const assignmentRgbMatch = assignmentLabelColor.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (assignmentRgbMatch) {
      const r = parseInt(assignmentRgbMatch[1]);
      const g = parseInt(assignmentRgbMatch[2]);
      const b = parseInt(assignmentRgbMatch[3]);
      expect(Math.abs(r - g)).toBeLessThan(50);
      expect(Math.abs(g - b)).toBeLessThan(50);
      expect(Math.abs(r - b)).toBeLessThan(50);
      expect(r).toBeGreaterThan(80);
      expect(r).toBeLessThan(200);
    }
  }

  // ステップ5: ダッシュボード内の「作業優先順位」セクションを確認する
  // 期待結果(6): 「作業優先順位」セクションに、キャッシュから復元された優先順位変更案3件が表示される
  const activePlansTable = await page.locator('[data-testid="active-plans-table"]');
  await expect(activePlansTable).toBeVisible();

  const priorityItems = await page.locator('[id="active-plans-tbody"] tr');
  expect(await priorityItems.count()).toBeGreaterThanOrEqual(3);

  // 期待結果(7): 優先順位変更案の取得タイムスタンプ（2時間前）が画面下部に小文字で「最終更新：2時間前」と表示される
  const timestamp = await page.locator('text=/最終更新：2時間前/');
  await expect(timestamp).toBeVisible();

  // 期待結果(8): 新規の人員配置提案生成ボタンまたは優先順位再計算ボタンは存在しないか、クリック不可（disabled）の状態である
  const optimizeButton = page.locator('[data-testid="optimize-button"]');
  const optimizeCount = await optimizeButton.count();

  // ボタンが存在する場合は disabled であることを確認
  if (optimizeCount > 0) {
    await expect(optimizeButton).toBeDisabled();
  }
});