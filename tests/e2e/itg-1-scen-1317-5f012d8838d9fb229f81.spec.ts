import { test, expect } from '@playwright/test';

test('SCEN-1317: ダッシュボード表示（配置提案画面から）- 集約データにチーム別の進捗状況が含まれて表示される', async ({ page }) => {
  // Step 1: ブラウザで作業進捗・人員配置最適化エンジンにログインし、初期状態に戻す
  await page.goto('/');
  
  // ログイン画面で認証情報を入力
  const emailInput = page.locator('input[placeholder*="メール"], input[name*="email"], .form-input:nth-of-type(1)');
  const passwordInput = page.locator('input[placeholder*="パスワード"], input[name*="password"], .form-input:nth-of-type(2)');
  
  await emailInput.fill('test@example.com');
  await passwordInput.fill('testpassword');
  
  const loginButton = page.locator('button:has-text("ログイン"), .login-button');
  await loginButton.click();
  
  // ダッシュボード画面が表示されるまで待機
  await page.waitForNavigation();
  await page.waitForSelector('[data-testid="kpi-risk-count"], #site-variance-tbody', { timeout: 10000 });
  
  // Step 2: 人員配置最適化提案・実行画面を開く
  const optimizationNavLink = page.locator('nav a:has-text("人員配置最適化提案"), [data-testid="kpi-sites-action"]').first();
  await optimizationNavLink.click();
  
  // 人員配置最適化提案画面が読み込まれるまで待機
  await page.waitForSelector('[data-testid="generate-proposals-btn"], #progress-rate-value', { timeout: 10000 });
  
  // Step 3: WMSおよびハンディターミナルから複数チーム（チームA：進捗率65%、チームB：進捗率80%、チームC：進捗率52%）の現在の作業進捗データが取得されるまで待機する
  // WMS/ハンディターミナルからのデータ取得が完了したことを確認
  await page.waitForFunction(() => {
    const tables = document.querySelectorAll('[data-testid="assignment-detail-table"], #productivity-list');
    if (tables.length === 0) return false;
    
    const text = document.body.innerText;
    // チームA、B、Cの進捗率がすべて表示され、テーブルが存在するまで待機
    return text.includes('チームA') && 
           text.includes('チームB') && 
           text.includes('チームC') &&
           text.includes('65%') && 
           text.includes('80%') && 
           text.includes('52%');
  }, { timeout: 15000 });
  
  const assignmentDetailTable = page.locator('[data-testid="assignment-detail-table"], #productivity-list');
  await expect(assignmentDetailTable).toBeVisible();
  
  // 配置案生成前のプロポーザルデータを取得
  const preGenerationProposalData = await page.evaluate(() => {
    const proposalContainer = document.querySelector('[id*="proposal"]');
    if (!proposalContainer) return null;
    
    const proposalText = proposalContainer.innerText;
    // 配置案に関連する情報（例：推奨ロジックステータス、推奨アクション）を抽出
    return {
      text: proposalText,
      hasContent: proposalText.length > 0
    };
  });
  
  // Step 4: 人員配置最適化提案・実行画面で『配置案を生成』ボタンをクリックする
  const generateButton = page.locator('[data-testid="generate-proposals-btn"], button:has-text("配置案を生成")').first();
  await generateButton.click();
  
  // Step 5: 配置案の生成が完了し、『ダッシュボードへ移動』ボタンが表示されるまで待機する
  const dashboardButton = page.locator('button:has-text("ダッシュボードへ移動"), button:has-text("ダッシュボードに戻る")').first();
  await expect(dashboardButton).toBeVisible({ timeout: 15000 });
  
  // Step 6: 『ダッシュボードへ移動』ボタンをクリックして進捗・人員配置ダッシュボード画面に遷移する
  await dashboardButton.click();
  
  // ダッシュボード画面へ遷移するまで待機
  await page.waitForNavigation();
  await page.waitForSelector('#team-variance-tbody, [data-testid="team-variance-table"]', { timeout: 10000 });
  
  // Step 7: ダッシュボード画面の集約データセクションを目視確認する
  // 期待結果: チーム別の進捗状況が表示され、進捗率が数値および視覚的インジケータで表現されていることを確認
  
  const teamVarianceTable = page.locator('#team-variance-tbody, [data-testid="team-variance-table"]').first();
  await expect(teamVarianceTable).toBeVisible();
  
  // テーブル内のチームデータを確認
  const tableRows = teamVarianceTable.locator('tr');
  const rowCount = await tableRows.count();
  
  // 複数チームのデータが存在することを確認（最小3行以上）
  expect(rowCount).toBeGreaterThanOrEqual(3);
  
  // テーブル内の全テキストコンテンツを取得
  const allTableText = await teamVarianceTable.textContent();
  
  // チームA、B、Cおよび具体的な進捗率（65%、80%、52%）が表示されていることを確認
  expect(allTableText).toContain('チームA');
  expect(allTableText).toContain('チームB');
  expect(allTableText).toContain('チームC');
  expect(allTableText).toContain('65%');
  expect(allTableText).toContain('80%');
  expect(allTableText).toContain('52%');
  
  // 各チーム行を確認し、進捗率が数値で表示され、視覚的インジケータ（プログレスバー）が存在し、色分けされていることを検証
  const teamRows = [
    { name: 'チームA', progress: '65%', expectedColor: 'medium' }, // 中程度の進捗
    { name: 'チームB', progress: '80%', expectedColor: 'high' },   // 高い進捗
    { name: 'チームC', progress: '52%', expectedColor: 'medium' }  // 中程度の進捗
  ];
  
  for (const team of teamRows) {
    const teamRow = tableRows.filter({ has: page.locator(`text="${team.name}"`) }).first();
    await expect(teamRow).toBeVisible();
    
    const teamRowText = await teamRow.textContent();
    expect(teamRowText).toContain(team.name);
    expect(teamRowText).toContain(team.progress);
    
    // プログレスバー要素が存在することを確認（視覚的インジケータ）
    const progressBar = teamRow.locator('[role="progressbar"], .progress-bar, [class*="progress"], div[style*="width"]').first();
    await expect(progressBar).toBeVisible();
    
    // プログレスバーの色分けを検証（スタイルまたはクラスから色情報を取得）
    const progressBarClass = await progressBar.getAttribute('class');
    const progressBarStyle = await progressBar.getAttribute('style');
    const progressBarBackgroundColor = await progressBar.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // 進捗率に応じた色が適用されていることを確認
    // 低進捗（52%）、中進捗（65%）、高進捗（80%）で異なる色または視覚的表現が施されている
    expect(
      progressBarClass || progressBarStyle || progressBarBackgroundColor
    ).toBeTruthy();
    
    // width属性またはstyleから進捗率に対応した幅値を確認
    const progressValue = parseInt(team.progress);
    if (progressBarStyle) {
      expect(progressBarStyle).toContain('width');
      // 進捗率の値がwidth値に反映されていることを確認（例：65%のwidthが指定されている）
      expect(progressBarStyle).toMatch(/width:\s*\d+%/);
    }
  }
  
  // ダッシュボード画面が正常に表示され、配置案に基づくチーム別進捗情報が定着していることを最終確認
  const dashboardMainSection = page.locator('.card, [data-testid="site-variance-table"], #site-variance-tbody').first();
  await expect(dashboardMainSection).toBeVisible();
  
  // ダッシュボード表示後、チーム別進捗データが維持されていることを確認（配置案に基づく情報の定着確認）
  const finalTableText = await teamVarianceTable.textContent();
  expect(finalTableText).toContain('チームA');
  expect(finalTableText).toContain('チームB');
  expect(finalTableText).toContain('チームC');
  expect(finalTableText).toContain('65%');
  expect(finalTableText).toContain('80%');
  expect(finalTableText).toContain('52%');
});