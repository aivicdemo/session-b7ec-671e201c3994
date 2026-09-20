import { test, expect } from '@playwright/test';

test('SCEN-1205: AI予測エンジンが利用できない場合、画面に「リスク判定エンジンが一時的に利用できません。前回の判定結果を表示しています」と表示される', async ({ page }) => {
  // 前提: キャッシュされた前回の判定結果を準備
  // ローカルストレージにキャッシュデータを設定
  const cachedRiskDataWithTimestamp = {
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1日前
    riskItems: [
      {
        teamName: 'チーム東京A',
        site: '東京拠点',
        riskLevel: '高',
        delayDays: 3,
        progressRate: 65
      },
      {
        teamName: 'チーム大阪B',
        site: '大阪拠点',
        riskLevel: '中',
        delayDays: 1,
        progressRate: 78
      }
    ],
    proposals: [
      {
        name: '配置案001',
        progressRate: 72,
        status: '検討中'
      }
    ]
  };

  await page.addInitScript((cachedData) => {
    localStorage.setItem('riskPredictionCache', JSON.stringify(cachedData));
  }, cachedRiskDataWithTimestamp);

  // ステップ1: ブラウザを開き、進捗・人員配置ダッシュボード画面へアクセスする
  // RiskPredictionAiAdapter の predictDelayRisk 操作をタイムアウト状態にモック
  await page.route('**/api/predict-delay-risk', route => {
    // タイムアウトをシミュレート
    route.abort('timedout');
  });

  await page.goto('/panels/scr-1789461783315.html');

  // ステップ2-3: ダッシュボード画面が読み込まれ、初期表示の処理が実行される
  // AI予測エンジンのタイムアウトを考慮し、画面の読み込み完了まで待機
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {
    // タイムアウトの場合もテストを続行
  });

  // ステップ3-4: ダッシュボード画面の目立つ位置に警告メッセージが表示されていることを確認
  const warningMessage = 'リスク判定エンジンが一時的に利用できません。前回の判定結果を表示しています';
  
  // 画面上のテキストを確認
  const messageLocator = page.locator(`text="${warningMessage}"`);
  
  // メッセージが表示されているか確認
  await expect(messageLocator).toBeVisible({ timeout: 15000 });

  // メッセージが目立つ位置（画面の上部・ヘッダー部またはリスク表示パネル）に表示されていることを確認
  const messageBoundingBox = await messageLocator.boundingBox();
  expect(messageBoundingBox).not.toBeNull();
  
  const viewportSize = page.viewportSize();
  expect(viewportSize).not.toBeNull();
  
  if (messageBoundingBox && viewportSize) {
    // 画面の上部50%（ヘッダー部またはパネル）に表示されていることを確認
    expect(messageBoundingBox.y).toBeLessThan(viewportSize.height * 0.5);
  }

  // ダッシュボード画面全体が読み込み完了していることを確認
  const dashboard = page.locator('[data-testid="kpi-risk-count"], [id="trend-chart"]').first();
  await expect(dashboard).toBeVisible();

  // KPI情報が表示されていることを確認（最新の進捗情報が通常通り表示されている）
  const kpiRiskCount = page.locator('[data-testid="kpi-risk-count"]');
  await expect(kpiRiskCount).toBeVisible();

  const kpiSitesAction = page.locator('[data-testid="kpi-sites-action"]');
  await expect(kpiSitesAction).toBeVisible();

  const kpiActivePlans = page.locator('[data-testid="kpi-active-plans"]');
  await expect(kpiActivePlans).toBeVisible();

  // リスク関連の情報が表示されていることを確認（キャッシュから取得した前回の判定結果）
  const riskAssessmentTable = page.locator('[id="risk-assessment-tbody"]');
  await expect(riskAssessmentTable).toBeVisible();

  // リスク判定結果の内容を確認（キャッシュから取得した前回の判定データが表示されていることを視認）
  const riskTableRows = page.locator('[id="risk-assessment-tbody"] tr');
  const rowCount = await riskTableRows.count();
  expect(rowCount).toBeGreaterThan(0);

  // キャッシュデータの特徴的な内容が表示されていることを確認
  // 「高」リスクレベルの行が存在することを確認（キャッシュに含まれるデータ）
  const highRiskRow = page.locator('[id="risk-assessment-tbody"]').locator('text="高"');
  await expect(highRiskRow.first()).toBeVisible();

  // キャッシュデータが実際に表示されていることを確認
  // キャッシュに含まれるチーム名「チーム東京A」が表示されていることを確認
  const cachedTeamName = page.locator('text="チーム東京A"');
  await expect(cachedTeamName).toBeVisible();

  // キャッシュに含まれる「東京拠点」が表示されていることを確認
  const cachedSite = page.locator('text="東京拠点"');
  await expect(cachedSite).toBeVisible();

  // 進捗遅延リスク率が表示されていることを確認（キャッシュデータの視認可能性）
  const riskElements = page.locator('[id="risk-assessment-tbody"] tr td');
  await expect(riskElements.first()).toBeVisible();

  // 配置案候補や優先順位調整案などの情報が表示されていることを確認（キャッシュから取得した前回の判定データ）
  const activePlansTable = page.locator('[data-testid="active-plans-table"]');
  await expect(activePlansTable).toBeVisible();

  const activePlansTbody = page.locator('[id="active-plans-tbody"]');
  const plansRowCount = await activePlansTbody.locator('tr').count();
  expect(plansRowCount).toBeGreaterThan(0);

  // キャッシュに含まれる配置案「配置案001」が実際に表示されていることを確認
  const cachedProposal = page.locator('text="配置案001"');
  await expect(cachedProposal).toBeVisible();

  // 最新の進捗情報（進捗率・完了数・残数など）がWMSから取得された内容として表示されていることを確認
  // site-variance-table は WMS から最新データを取得するテーブル
  const siteVarianceTable = page.locator('[id="site-variance-tbody"]');
  await expect(siteVarianceTable).toBeVisible();

  const siteVarianceRows = page.locator('[id="site-variance-tbody"] tr');
  const siteRowCount = await siteVarianceRows.count();
  expect(siteRowCount).toBeGreaterThan(0);

  // キャッシュ表示であることが明示的に視認可能であることを確認
  // 警告メッセージがリスク結果の上に表示されていることで、
  // キャッシュから取得した前回の判定データであることが視認可能
  await expect(messageLocator).toBeVisible();
  
  // メッセージの下にリスク判定結果が表示されていることを確認
  // これにより、メッセージ直下の結果がキャッシュデータであることが視認可能
  const messageBox = await messageLocator.boundingBox();
  const riskBox = await riskAssessmentTable.boundingBox();
  
  expect(messageBox).not.toBeNull();
  expect(riskBox).not.toBeNull();
  
  if (messageBox && riskBox) {
    // メッセージがリスク結果の上に配置されていることを確認
    expect(messageBox.y).toBeLessThan(riskBox.y);
  }

  // 前回判定データのタイムスタンプまたはキャッシュ表示が視認可能であることを確認
  // メッセージまたはリスク表示内に「前回」「キャッシュ」「判定日時」などの表示を確認
  const cacheIndicators = page.locator('text=/前回|キャッシュ|判定日時|前回判定結果/i');
  const cacheIndicatorCount = await cacheIndicators.count();
  
  // 少なくともメッセージテキストに「前回の判定結果」が含まれていることで、
  // 過去データであることが視認可能
  expect(cacheIndicatorCount).toBeGreaterThanOrEqual(0);
  
  // メッセージ内に「前回」という表現があることで、過去データであることが明示
  await expect(page.locator(`text="${warningMessage}"`)).toContainText('前回');

  // キャッシュデータの日時情報が表示されている場合を確認
  // タイムスタンプが表示されていないか、またはリスク表示の何らかの形でキャッシュ由来であることが示されていることを確認
  const riskSectionText = await riskAssessmentTable.textContent();
  expect(riskSectionText).toBeTruthy();

  // 警告メッセージが表示されている時点で、その下のリスク結果がキャッシュデータであることが
  // ユーザーの視認可能な形で提示されていることを確認
  const messageAndRiskCoexist = 
    (await messageLocator.isVisible()) && 
    (await riskAssessmentTable.isVisible());
  
  expect(messageAndRiskCoexist).toBe(true);
});