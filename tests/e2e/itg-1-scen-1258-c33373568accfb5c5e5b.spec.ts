import { test, expect } from '@playwright/test';

test('SCEN-1258: リスク判定結果がデータベースの進捗遅延リスク判定結果テーブルに保存される', async ({ page }) => {
  // Step 1: 進捗・人員配置ダッシュボード画面を開く
  await page.goto('/');
  await page.waitForURL('**/panels/scr-1789461783315.html', { waitUntil: 'networkidle' });

  // ログイン確認（必要に応じて）
  const loginForm = await page.locator('[class*="login"]').count();
  if (loginForm > 0) {
    await page.fill('input[placeholder="ユーザーID"]', 'testuser');
    await page.fill('input[placeholder="パスワード"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/panels/scr-1789461783315.html', { waitUntil: 'networkidle' });
  }

  // ネットワークリクエスト・レスポンスを監視する準備
  const capturedRequests: Array<{ url: string; method: string; timestamp: string; payload?: any }> = [];
  const riskPredictionResponses: any[] = [];
  const progressDataResponses: any[] = [];
  const riskAssessmentSaveRequests: any[] = [];

  page.on('request', (request) => {
    capturedRequests.push({
      url: request.url(),
      method: request.method(),
      timestamp: new Date().toISOString(),
      payload: request.postDataJSON?.()
    });
  });

  // Step 2: WmsHandyTerminalDataSourceの呼び出し窓口経由で、複数拠点のチーム別進捗データを取得するまで待機
  const progressDataResponse = await page.waitForResponse(
    response => 
      response.url().includes('/api/') && 
      (response.url().includes('wms') || 
       response.url().includes('handy') || 
       response.url().includes('progress') ||
       response.url().includes('team')),
    { timeout: 30000 }
  );

  const progressDataPayload = await progressDataResponse.json();
  progressDataResponses.push(progressDataPayload);

  // レスポンスペイロードの検証：複数拠点のチーム別進捗データを確認
  expect(progressDataPayload).toBeDefined();
  let progressItems: any[] = [];
  if (Array.isArray(progressDataPayload)) {
    progressItems = progressDataPayload;
  } else if (progressDataPayload.data && Array.isArray(progressDataPayload.data)) {
    progressItems = progressDataPayload.data;
  }
  
  expect(progressItems.length).toBeGreaterThan(0);
  
  // 複数拠点が存在することを検証
  const siteIds = new Set();
  for (const item of progressItems) {
    const siteId = item.siteId || item.site_id || item.locationId || item.location_id;
    expect(siteId).toBeDefined();
    siteIds.add(siteId);
    
    // 完了数・残数・進捗率を確認
    const completedCount = item.completedCount !== undefined ? item.completedCount : 
                          item.completed_count !== undefined ? item.completed_count : 
                          item.completed;
    const remainingCount = item.remainingCount !== undefined ? item.remainingCount : 
                          item.remaining_count !== undefined ? item.remaining_count : 
                          item.remaining;
    const progressRate = item.progressRate !== undefined ? item.progressRate : 
                        item.progress_rate !== undefined ? item.progress_rate : 
                        item.progress;
    
    expect(completedCount).toBeDefined();
    expect(remainingCount).toBeDefined();
    expect(progressRate).toBeDefined();
  }
  
  // 複数拠点のデータが取得されていることを確認
  expect(siteIds.size).toBeGreaterThanOrEqual(2);

  // Step 3: RiskPredictionAiAdapterの呼び出し窓口経由で、各チーム単位の納期遅延確率予測を取得するまで待機
  const riskPredictionResponse = await page.waitForResponse(
    response => 
      response.url().includes('/api/') && 
      (response.url().includes('risk') || 
       response.url().includes('prediction') ||
       response.url().includes('delay')),
    { timeout: 30000 }
  );

  const riskPredictionPayload = await riskPredictionResponse.json();
  riskPredictionResponses.push(riskPredictionPayload);

  // レスポンスペイロードの検証：各チーム単位の納期遅延確率を確認
  expect(riskPredictionPayload).toBeDefined();
  let predictions: any[] = Array.isArray(riskPredictionPayload) 
    ? riskPredictionPayload 
    : (riskPredictionPayload.data || []);
  
  expect(predictions.length).toBeGreaterThan(0);
  
  // 複数チーム、複数拠点のデータが存在することを検証
  const predictionTeamIds = new Set();
  const predictionSiteIds = new Set();
  
  for (const prediction of predictions) {
    // 納期遅延確率（0～100%）を確認
    const delayProbability = 
      prediction.delayProbability !== undefined ? prediction.delayProbability :
      prediction.delay_probability !== undefined ? prediction.delay_probability :
      prediction.probability !== undefined ? prediction.probability :
      prediction.riskScore;
    
    expect(delayProbability).toBeDefined();
    expect(typeof delayProbability).toBe('number');
    expect(delayProbability).toBeGreaterThanOrEqual(0);
    expect(delayProbability).toBeLessThanOrEqual(100);

    // チームIDを確認
    const teamId = prediction.teamId !== undefined ? prediction.teamId : prediction.team_id;
    expect(teamId).toBeDefined();
    predictionTeamIds.add(teamId);
    
    // 拠点IDを確認
    const siteId = prediction.siteId !== undefined ? prediction.siteId : 
                  prediction.site_id !== undefined ? prediction.site_id :
                  prediction.locationId;
    if (siteId) {
      predictionSiteIds.add(siteId);
    }
  }
  
  // 複数チームのデータが取得されていることを確認
  expect(predictionTeamIds.size).toBeGreaterThanOrEqual(2);

  // Step 4: ダッシュボード画面で「進捗遅延リスク分析を実行」ボタンをクリック
  const optimizeButton = page.getByTestId('optimize-button');
  await expect(optimizeButton).toBeVisible();
  await optimizeButton.click();

  // Step 5: プログレス表示の確認
  const progressIndicator = page.locator('text=/リスク分析を実行中/i');
  await expect(progressIndicator).toBeVisible({ timeout: 10000 });

  // Step 6: 分析処理完了を待機
  await page.waitForFunction(
    () => {
      const element = document.querySelector('[id="risk-assessment-tbody"]');
      return element && element.querySelectorAll('tr').length > 0;
    },
    { timeout: 30000 }
  );

  // リスク分析結果の表示を確認
  const riskAssessmentTable = page.getByTestId('risk-assessment-table');
  await expect(riskAssessmentTable).toBeVisible({ timeout: 30000 });

  // Step 7: ネットワークトレースを使用してデータベース保存を検証
  // ボタンクリック後のリスク判定結果テーブルへのレコード保存リクエストをキャプチャ
  const riskAssessmentApiRequests = capturedRequests.filter(req =>
    (req.method === 'POST' || req.method === 'PUT') &&
    req.url.includes('/api/') && 
    (req.url.includes('risk_assessment_results') || 
     req.url.includes('risk-assessment') ||
     req.url.includes('riskAssessment'))
  );

  // リスク判定結果テーブルへのレコード保存リクエストが実行されたことを確認
  expect(riskAssessmentApiRequests.length).toBeGreaterThanOrEqual(1);

  // リクエストペイロードから保存内容を検証
  for (const request of riskAssessmentApiRequests) {
    const payload = request.payload;
    if (payload) {
      // リクエストペイロードの内容を確認
      const records = Array.isArray(payload) ? payload : (payload.data || payload);
      
      for (const record of Array.isArray(records) ? records : [records]) {
        // 分析実行タイムスタンプ
        const timestamp = record.timestamp || record.createdAt || record.analysisTimestamp || record.created_at;
        expect(timestamp).toBeDefined();

        // 対象拠点ID
        const siteId = record.siteId || record.site_id || record.locationId || record.location_id;
        expect(siteId).toBeDefined();

        // 対象チームID
        const teamId = record.teamId || record.team_id || record.groupId || record.group_id;
        expect(teamId).toBeDefined();

        // 予測遅延確率値
        const delayProbability = record.delayProbability || record.delay_probability || record.riskScore || record.risk_score;
        expect(delayProbability).toBeDefined();
        expect(typeof delayProbability).toBe('number');
        expect(delayProbability).toBeGreaterThanOrEqual(0);
        expect(delayProbability).toBeLessThanOrEqual(100);

        // 判定ステータス
        const status = record.status || record.riskLevel || record.judgmentStatus || record.judgment_status || record.risk_level;
        expect(status).toBeDefined();
        expect(status).toMatch(/HIGH|MEDIUM|LOW|高|中|低/);

        riskAssessmentSaveRequests.push(record);
      }
    }
  }

  // Step 8: テーブルに保存されたレコードを検証
  const rows = await page.locator('[id="risk-assessment-tbody"] tr').count();
  expect(rows).toBeGreaterThanOrEqual(1);

  // データベースから直接レコードを照会
  const apiUrl = (page as any).AIVIC_API_URL || 'http://localhost:3000/api';
  const appId = (page as any).AIVIC_APP_ID || 'app-default';
  const tables = (page as any).AIVIC_TABLES || {};
  
  // テーブル名から進捗遅延リスク判定結果テーブルを特定
  let riskAssessmentTableNum = null;
  for (const [tableName, tableNum] of Object.entries(tables)) {
    if (tableName.includes('risk') && (tableName.includes('assessment') || tableName.includes('judgment'))) {
      riskAssessmentTableNum = tableNum;
      break;
    }
  }

  let dbRecords: any[] = [];
  if (riskAssessmentTableNum) {
    try {
      const dbResponse = await page.request.get(`${apiUrl}/${riskAssessmentTableNum}?app=${appId}`);
      const dbData = await dbResponse.json();
      dbRecords = Array.isArray(dbData) ? dbData : (dbData.data || []);
    } catch (e) {
      // データベース照会失敗時はリクエストペイロードで検証
    }
  }

  // 検証対象レコード：リクエストペイロード、データベース照会、または画面表示から取得
  const recordsToValidate = riskAssessmentSaveRequests.length > 0 
    ? riskAssessmentSaveRequests 
    : (dbRecords.length > 0 ? dbRecords : []);

  // 期待結果：1件以上の新規レコードが保存されていることを確認
  expect(recordsToValidate.length).toBeGreaterThanOrEqual(1);

  // 保存されたレコードから必要な項目を確認
  for (const record of recordsToValidate) {
    // 分析実行タイムスタンプの確認
    const timestamp = record.timestamp || record.createdAt || record.analysisTimestamp || record.created_at;
    expect(timestamp).toBeDefined();
    expect(typeof timestamp === 'string' || typeof timestamp === 'number').toBeTruthy();

    // 対象拠点IDの確認
    const siteId = record.siteId || record.site_id || record.locationId || record.location_id;
    expect(siteId).toBeDefined();

    // 対象チームIDの確認
    const teamId = record.teamId || record.team_id || record.groupId || record.group_id;
    expect(teamId).toBeDefined();

    // 予測遅延確率値の確認（0～100の範囲）
    const delayProbability = record.delayProbability || record.delay_probability || record.riskScore || record.risk_score;
    expect(delayProbability).toBeDefined();
    expect(typeof delayProbability).toBe('number');
    expect(delayProbability).toBeGreaterThanOrEqual(0);
    expect(delayProbability).toBeLessThanOrEqual(100);

    // 判定ステータスの確認
    const status = record.status || record.riskLevel || record.judgmentStatus || record.judgment_status || record.risk_level;
    expect(status).toBeDefined();
    expect(status).toMatch(/HIGH|MEDIUM|LOW|高|中|低/);

    // 作成ユーザーIDの確認
    const userId = record.createdBy || record.created_by || record.userId || record.user_id;
    expect(userId).toBeDefined();

    // RiskPredictionAiAdapterの戻り値と遅延確率値の一致を検証
    if (predictions.length > 0) {
      const matchingPrediction = predictions.find(p => {
        const pTeamId = p.teamId || p.team_id;
        const pSiteId = p.siteId || p.site_id || p.locationId || p.location_id;
        return pTeamId === teamId && (!pSiteId || pSiteId === siteId);
      });

      if (matchingPrediction) {
        const predictedProbability = 
          matchingPrediction.delayProbability !== undefined ? matchingPrediction.delayProbability :
          matchingPrediction.delay_probability !== undefined ? matchingPrediction.delay_probability :
          matchingPrediction.probability !== undefined ? matchingPrediction.probability :
          matchingPrediction.riskScore;
        
        // 予測値と保存値の一致を確認
        expect(delayProbability).toBe(predictedProbability);
      }
    }

    // 遅延確率の閾値に基づいて判定ステータスが自動判定されていることを確認
    if (delayProbability >= 80) {
      expect(status).toMatch(/HIGH|高/);
    } else if (delayProbability >= 50) {
      expect(status).toMatch(/MEDIUM|中/);
    } else {
      expect(status).toMatch(/LOW|低/);
    }
  }

  // 画面表示でも1件以上のレコードが表示されていることを確認
  expect(rows).toBeGreaterThanOrEqual(1);
});