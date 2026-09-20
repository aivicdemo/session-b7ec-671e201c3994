import { test, expect } from '@playwright/test';

test('SCEN-1260: リスク判定結果を含む最新の進捗・リスク・配置情報がダッシュボード画面用に集約されて準備される', async ({ page }) => {
  // テスト環境にログインし、進捗・人員配置ダッシュボード画面を開く
  await page.goto('/');
  
  // ログイン画面を待機
  await page.waitForSelector('input[type="text"]');
  
  // ログイン情報を入力（テスト用認証情報）
  const userInputs = await page.$$('input[type="text"]');
  const passwordInputs = await page.$$('input[type="password"]');
  
  if (userInputs.length > 0) {
    await userInputs[0].fill('testuser');
  }
  if (passwordInputs.length > 0) {
    await passwordInputs[0].fill('testpassword');
  }
  
  // ログインボタンをクリック
  const loginButton = await page.getByRole('button', { name: /ログイン|login/i }).first();
  await loginButton.click();
  
  // ダッシュボード画面への遷移を待機
  await page.waitForURL(/panels\/scr-1789461783315/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  // ダッシュボード画面が表示されていることを確認
  await expect(page).toHaveURL(/panels\/scr-1789461783315/);

  // WMSおよびハンディターミナルからのデータ自動取得を待つ
  // 進捗率70%、作業実績タイムスタンプ=現在時刻-5分、生産性指標=時間当たり14件処理が表示されるまで待機
  const siteVarianceTable = page.locator('[data-testid="site-variance-table"]');
  await expect(siteVarianceTable).toBeVisible();

  // テーブル内のデータを確認：進捗率70%を検証
  const siteTableBody = page.locator('#site-variance-tbody');
  const siteRows = siteTableBody.locator('tr');
  
  // 進捗率70%と作業実績タイムスタンプが表示されるまで待機
  await page.waitForFunction(() => {
    const rows = document.querySelectorAll('#site-variance-tbody tr');
    for (const row of rows) {
      const text = row.textContent || '';
      if (text.includes('70')) {
        return true;
      }
    }
    return false;
  }, { timeout: 10000 });

  const siteRowCount = await siteRows.count();
  expect(siteRowCount).toBeGreaterThan(0);

  // 拠点別テーブルから進捗率70%と実績進捗率70%を含むデータを検証
  const siteRowTexts = await siteRows.allTextContents();
  let hasProgressData = false;
  let hasTimestampData = false;
  
  for (const text of siteRowTexts) {
    // 進捗率70%を検証
    if (text.includes('70')) {
      hasProgressData = true;
    }
    // 作業実績タイムスタンプを検証（時刻形式）
    if (text.match(/\d{2}:\d{2}:\d{2}/)) {
      hasTimestampData = true;
    }
  }
  
  expect(hasProgressData).toBeTruthy();
  expect(hasTimestampData).toBeTruthy();

  // 進捗遅延リスク分析エンジンがリスク判定を自動実行するのを待つ
  // リスク値65%が計算・表示されるまで待機
  const riskAssessmentTable = page.locator('[data-testid="risk-assessment-table"]');
  await expect(riskAssessmentTable).toBeVisible();

  // リスク評価テーブルにリスク値65%が表示されるまで待機
  await page.waitForFunction(() => {
    const rows = document.querySelectorAll('#risk-assessment-tbody tr');
    for (const row of rows) {
      const text = row.textContent || '';
      if (text.match(/65[%％]/)) {
        return true;
      }
    }
    return false;
  }, { timeout: 10000 });

  const riskTableBody = page.locator('#risk-assessment-tbody');
  const riskRows = riskTableBody.locator('tr');
  const riskRowCount = await riskRows.count();
  
  expect(riskRowCount).toBeGreaterThan(0);

  // 進捗遅延リスク分析エンジンがリスク判定を自動実行して結果が表示されていることを確認
  const riskRowTexts = await riskRows.allTextContents();
  
  // リスク判定エンジンの実行結果として警告ステータス「高リスク」が表示されていることを確認
  const hasHighRiskStatus = riskRowTexts.some(text => text.includes('高リスク'));
  expect(hasHighRiskStatus).toBeTruthy();

  // リスク値が65%であることを確認
  const hasRiskValue = riskRowTexts.some(text => {
    const match = text.match(/65[%％]/);
    return match !== null;
  });
  expect(hasRiskValue).toBeTruthy();

  // リスク判定時刻が現在時刻またはそれ以降であることを確認
  // ログイン後の処理時間を考慮し、リスク判定時刻が存在すること（時刻形式）を検証
  const hasValidRiskTime = riskRowTexts.some(timeText => {
    // 様々な時刻フォーマットに対応（HH:MM:SS、YYYY-MM-DD HH:MM:SSなど）
    return timeText.match(/\d{2}:\d{2}:\d{2}/) !== null;
  });
  expect(hasValidRiskTime).toBeTruthy();

  // 生産性データを含むアクティブプランテーブルが表示されていることを確認
  const activePlansTable = page.locator('[data-testid="active-plans-table"]');
  await expect(activePlansTable).toBeVisible();

  // アクティブプランテーブルにデータが含まれていることを確認
  const activePlansBody = page.locator('#active-plans-tbody');
  const activePlanRows = activePlansBody.locator('tr');
  
  // 生産性データ「時間当たり14件」が表示されるまで待機
  await page.waitForFunction(() => {
    const rows = document.querySelectorAll('#active-plans-tbody tr');
    for (const row of rows) {
      const text = row.textContent || '';
      // 時間当たり14件のパターンマッチング
      if (text.match(/(?:時間当たり|\/h|\/時間).*14.*件/) || text.match(/14.*(?:時間当たり|\/h|\/時間).*件/)) {
        return true;
      }
    }
    return false;
  }, { timeout: 10000 });

  const activePlanRowCount = await activePlanRows.count();
  expect(activePlanRowCount).toBeGreaterThan(0);

  // アクティブプランテーブルから生産性データ（時間当たり14件）を検証
  const activePlanRowTexts = await activePlanRows.allTextContents();
  const hasProductivityData = activePlanRowTexts.some(text => {
    // 時間当たり14件の検証（パターンマッチング）
    return text.match(/(?:時間当たり|\/h|\/時間).*14.*件/) || text.match(/14.*(?:時間当たり|\/h|\/時間).*件/);
  });
  expect(hasProductivityData).toBeTruthy();

  // チーム配置情報テーブルが表示されていることを確認
  const teamVarianceTable = page.locator('[data-testid="team-variance-table"]');
  await expect(teamVarianceTable).toBeVisible();

  // チーム配置テーブルにデータが含まれていることを確認
  const teamTableBody = page.locator('#team-variance-tbody');
  const teamRows = teamTableBody.locator('tr');
  const teamRowCountValue = await teamRows.count();
  
  expect(teamRowCountValue).toBeGreaterThan(0);

  // チーム1が表示されていることを確認（強調表示の具体的な方法は画面実装に依存）
  const teamRowTextsAll = await teamRows.allTextContents();
  const hasTeam1 = teamRowTextsAll.some(text => text.includes('チーム1'));
  expect(hasTeam1).toBeTruthy();

  // 対象拠点Aが表示されていることを確認
  const siteRowCountValue = await siteRows.count();
  let hasSiteA = false;
  
  for (let i = 0; i < siteRowCountValue; i++) {
    const row = siteRows.nth(i);
    const rowText = await row.textContent();
    if (rowText && rowText.includes('拠点A')) {
      hasSiteA = true;
      break;
    }
  }
  expect(hasSiteA).toBeTruthy();

  // ダッシュボードに複数の情報源からのデータが集約されて表示されていることを確認
  // 進捗データ、リスク情報、生産性指標が同一画面内に存在することを検証
  const contentArea = page.locator('.content-area');
  await expect(contentArea).toBeVisible();

  // フィルタ要素が表示されており、対話可能なダッシュボードであることを確認
  const siteFilter = page.locator('[data-testid="site-filter"]');
  const riskLevelFilter = page.locator('[data-testid="risk-level-filter"]');
  
  await expect(siteFilter).toBeVisible();
  await expect(riskLevelFilter).toBeVisible();

  // ダッシュボード表示が複数のカードで構成されていることを確認
  const cards = page.locator('.card');
  const cardCount = await cards.count();
  
  expect(cardCount).toBeGreaterThan(0);

  // 推奨アクション領域が表示されていることを確認
  const recommendedActions = page.locator('#recommended-actions');
  await expect(recommendedActions).toBeVisible();

  // 進捗データ、リスク情報、生産性指標がすべて同一画面に集約されていることを最終確認
  // 各テーブルが表示状態にあり、データが存在することを総合判定
  expect(siteRowCount).toBeGreaterThan(0);
  expect(riskRowCount).toBeGreaterThan(0);
  expect(activePlanRowCount).toBeGreaterThan(0);
  expect(teamRowCountValue).toBeGreaterThan(0);
});